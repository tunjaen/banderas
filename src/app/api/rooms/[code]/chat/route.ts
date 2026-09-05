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

    const body = await req.json();
    const { text = "", emoji = "" } = body;

    if (!text && !emoji) {
      return NextResponse.json({ message: "El mensaje no puede estar vacío" }, { status: 400 });
    }

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

    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: userId,
      senderName: me.name,
      text: text.trim(),
      emoji: emoji.trim(),
      timestamp: Date.now()
    };

    // Keep last 50 messages to prevent excessive memory bloat
    const updatedMessages = [...messages, newMessage].slice(-50);

    await prisma.room.update({
      where: { id: room.id },
      data: { messagesJson: JSON.stringify(updatedMessages) }
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json({ message: "Error al enviar mensaje" }, { status: 500 });
  }
}
