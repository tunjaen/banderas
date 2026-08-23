import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Fetch challenges where user is either challenger or challenged
    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { challengedId: userId }
        ]
      },
      include: {
        challenger: {
          select: { id: true, name: true, level: true, xp: true }
        },
        challenged: {
          select: { id: true, name: true, level: true, xp: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const pendingReceived = challenges.filter(
      c => c.challengedId === userId && c.status === "PENDING" && !c.challengedDone
    );

    const active = challenges.filter(
      c => c.status !== "DECLINED" && !(c.challengerDone && c.challengedDone)
    );

    const completed = challenges.filter(
      c => c.challengerDone && c.challengedDone
    );

    return NextResponse.json({
      pendingCount: pendingReceived.length,
      challenges,
      active,
      completed
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { challengedId, gameMode = "LIGHTNING", scopeType = "subregion_multi", scopeValues = "Europe_East", targetScore = 10 } = body;

    if (!challengedId) {
      return NextResponse.json({ message: "Jugador retado requerido" }, { status: 400 });
    }

    if (challengedId === userId) {
      return NextResponse.json({ message: "No puedes retarte a ti mismo" }, { status: 400 });
    }

    // Build filter for countries based on scopeValues
    const items = scopeValues.split(",").map((s: string) => s.trim());
    let countryWhere: any = {};

    if (items.includes("world") || items.includes("Todo el Mundo") || items.includes("Mundo")) {
      countryWhere = {}; // All countries
    } else {
      const orConditions: any[] = [];

      items.forEach((item: string) => {
        if (["Europa", "América", "Asia", "África", "Oceanía"].includes(item)) {
          orConditions.push({ continent: { contains: item, mode: "insensitive" } });
        } else {
          const cleanItem = item.replace(/_/g, " ");
          orConditions.push({
            OR: [
              { continent: { contains: cleanItem, mode: "insensitive" } },
              { name: { contains: cleanItem, mode: "insensitive" } }
            ]
          });
        }
      });

      if (orConditions.length > 0) {
        countryWhere = { OR: orConditions };
      }
    }

    // Fetch candidate countries from DB
    let countries = await prisma.country.findMany({
      where: countryWhere,
      select: { id: true }
    });

    // Fallback if filter returned too few
    if (countries.length < 5) {
      countries = await prisma.country.findMany({
        select: { id: true }
      });
    }

    // Shuffle countries
    const shuffled = [...countries].sort(() => Math.random() - 0.5);
    
    // Select flag count sequence
    const countToTake = gameMode === "MARATHON" ? shuffled.length : Math.min(targetScore, shuffled.length);
    const selectedISOs = shuffled.slice(0, countToTake).map(c => c.id);

    // Create Challenge record
    const challenge = await prisma.challenge.create({
      data: {
        challengerId: userId,
        challengedId,
        gameMode,
        scopeType,
        scopeValues,
        targetScore: countToTake,
        flagSequence: JSON.stringify(selectedISOs),
        status: "PENDING"
      },
      include: {
        challenger: { select: { id: true, name: true } },
        challenged: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ message: "Error al crear el reto" }, { status: 500 });
  }
}
