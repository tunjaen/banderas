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

    const updateData: any = {};
    if (isChallenger) {
      updateData.hiddenByChallenger = true;
    }
    if (isChallenged) {
      updateData.hiddenByChallenged = true;
    }

    await prisma.challenge.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error hiding challenge:", error);
    return NextResponse.json({ message: "Error interno al ocultar reto" }, { status: 500 });
  }
}
