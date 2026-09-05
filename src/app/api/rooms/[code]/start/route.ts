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

    if (room.hostId !== userId) {
      return NextResponse.json({ message: "Solo el anfitrión (Host) puede iniciar el juego" }, { status: 403 });
    }

    if (room.players.length < 2) {
      return NextResponse.json({ message: "Se necesitan al menos 2 jugadores para iniciar" }, { status: 400 });
    }

    const unreadyPlayers = room.players.filter(p => !p.isReady);
    if (unreadyPlayers.length > 0) {
      return NextResponse.json({ message: "Todos los jugadores deben estar en verde (¡LISTO!) para comenzar" }, { status: 400 });
    }

    // System message
    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}
    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: "🚀 ¡LA BATALLA HA COMENZADO! El primero en acertar cada bandera se lleva el punto. ¡Rápidos!",
      emoji: "⚔️",
      timestamp: Date.now()
    });

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentQuestionIndex: 0,
        messagesJson: JSON.stringify(messages)
      }
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error("Error starting room game:", error);
    return NextResponse.json({ message: "Error al iniciar el juego" }, { status: 500 });
  }
}
