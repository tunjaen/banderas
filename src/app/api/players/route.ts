import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const users = await prisma.user.findMany({
      where: userId ? { id: { not: userId } } : {},
      select: {
        id: true,
        name: true,
        level: true,
        xp: true,
        lastPlayedAt: true
      },
      orderBy: [
        { name: "asc" }
      ]
    });

    // Check online status (< 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const formatted = users.map(u => ({
      ...u,
      isOnline: u.lastPlayedAt ? new Date(u.lastPlayedAt) >= fiveMinsAgo : false
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error("Error fetching players list:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
