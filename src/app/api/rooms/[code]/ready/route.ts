import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { code } = await params;
    const cleanCode = code.trim().toUpperCase();

    const room = await prisma.room.findUnique({
      where: { code: cleanCode },
      include: { players: true }
    });

    if (!room) {
      return NextResponse.json({ message: "Sala no encontrada" }, { status: 404 });
    }

    const me = room.players.find(p => p.userId === userId);
    if (!me) {
      return NextResponse.json({ message: "No eres miembro de esta sala" }, { status: 403 });
    }

    const nextReadyState = !me.isReady;

    await prisma.roomPlayer.update({
      where: { id: me.id },
      data: { isReady: nextReadyState }
    });

    // Send chat system notification
    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}
    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: `${nextReadyState ? "💚" : "🟡"} ${me.name} ahora está ${nextReadyState ? "¡LISTO!" : "en espera"}.`,
      emoji: nextReadyState ? "💚" : "⏳",
      timestamp: Date.now()
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { messagesJson: JSON.stringify(messages) }
    });

    return NextResponse.json({ success: true, isReady: nextReadyState });
  } catch (error) {
    console.error("Error toggling ready status:", error);
    return NextResponse.json({ message: "Error al cambiar estado" }, { status: 500 });
  }
}
