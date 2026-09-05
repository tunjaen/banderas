import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ message: "Código de sala requerido" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const room = await prisma.room.findUnique({
      where: { code: cleanCode },
      include: { players: true }
    });

    if (!room) {
      return NextResponse.json({ message: "Sala no encontrada" }, { status: 404 });
    }

    if (room.status !== "WAITING") {
      return NextResponse.json({ message: "La partida ya ha comenzado o ha finalizado" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true }
    });

    // Check if player is already in room
    const existingPlayer = room.players.find(p => p.userId === userId);

    if (!existingPlayer) {
      if (room.players.length >= room.maxPlayers) {
        return NextResponse.json({ message: "La sala está llena (máximo 4 jugadores)" }, { status: 400 });
      }

      await prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId,
          name: user?.name || "Jugador",
          image: user?.image,
          isReady: false,
          isHost: false,
          score: 0
        }
      });

      // System message in chat
      let messages: any[] = [];
      try { messages = JSON.parse(room.messagesJson); } catch (e) {}
      messages.push({
        id: `sys_${Date.now()}`,
        senderId: "system",
        senderName: "Sistema",
        text: `👋 ${user?.name || "Un nuevo jugador"} se ha unido a la sala.`,
        emoji: "🟢",
        timestamp: Date.now()
      });

      await prisma.room.update({
        where: { id: room.id },
        data: { messagesJson: JSON.stringify(messages) }
      });
    }

    return NextResponse.json({ code: room.code });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({ message: "Error al unirse a la sala" }, { status: 500 });
  }
}
