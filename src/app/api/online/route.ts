import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const now = new Date();

    // Heartbeat: update requesting user's lastPlayedAt if logged in
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastPlayedAt: now }
      }).catch(err => console.error("Heartbeat error:", err));
    }

    // Active threshold: last 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const onlineUsers = await prisma.user.findMany({
      where: {
        lastPlayedAt: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        name: true,
        level: true,
        xp: true,
        currentStreak: true,
        lastPlayedAt: true
      },
      orderBy: {
        lastPlayedAt: "desc"
      }
    });

    const onlineOtherUsers = userId 
      ? onlineUsers.filter(u => u.id !== userId)
      : onlineUsers;

    return NextResponse.json({
      count: onlineOtherUsers.length,
      users: onlineOtherUsers
    });
  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
