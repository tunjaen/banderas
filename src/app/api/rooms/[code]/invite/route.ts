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
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ message: "ID de usuario objetivo requerido" }, { status: 400 });
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

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Create room invitation record
    const invitation = await prisma.roomInvitation.create({
      data: {
        roomId: room.id,
        code: room.code,
        hostId: userId,
        hostName: me.name,
        targetUserId: targetUser.id,
        status: "PENDING"
      }
    });

    // Chat system notification
    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}
    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: `📩 ${me.name} invitó a ${targetUser.name} a unirse a la sala.`,
      emoji: "✉️",
      timestamp: Date.now()
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { messagesJson: JSON.stringify(messages) }
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error("Error sending room invitation:", error);
    return NextResponse.json({ message: "Error al enviar invitación" }, { status: 500 });
  }
}
