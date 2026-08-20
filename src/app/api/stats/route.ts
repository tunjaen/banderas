import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        country: {
          select: { name: true, nameEn: true, capital: true, capitalEn: true, continent: true, continentEn: true, isoCode: true }
        }
      }
    });

    return NextResponse.json({ progress });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
