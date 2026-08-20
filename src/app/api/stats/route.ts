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

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // Default to the current logged-in user if no specific user is requested
    const userId = targetUserId || (session.user as any).id;

    const [progress, targetUser] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          country: {
            select: { name: true, nameEn: true, capital: true, capitalEn: true, continent: true, continentEn: true, isoCode: true }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })
    ]);

    return NextResponse.json({ progress, userName: targetUser?.name || "Jugador" });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
