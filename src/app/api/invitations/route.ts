import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ invitations: [] });
    }

    // Fetch pending invitations created within the last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

    const invitations = await prisma.roomInvitation.findMany({
      where: {
        targetUserId: userId,
        status: "PENDING",
        createdAt: { gte: tenMinsAgo }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ invitations: [] });
  }
}
