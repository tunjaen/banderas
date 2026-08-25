import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });

    if (!challenge) {
      return NextResponse.json({ message: "Reto no encontrado" }, { status: 404 });
    }

    const isChallenger = challenge.challengerId === userId;
    const isChallenged = challenge.challengedId === userId;

    if (!isChallenger && !isChallenged) {
      return NextResponse.json({ message: "No perteneces a este reto" }, { status: 403 });
    }

    await prisma.challenge.update({
      where: { id },
      data: { status: "DECLINED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error declining challenge:", error);
    return NextResponse.json({ message: "Error interno al rechazar reto" }, { status: 500 });
  }
}
