import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        level: true,
        xp: true,
        spatialCorrect: true,
        spatialWrong: true,
      },
      orderBy: [
        { xp: 'desc' }
      ],
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
