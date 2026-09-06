import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
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
      include: {
        players: {
          orderBy: [{ score: "desc" }, { joinedAt: "asc" }]
        }
      }
    });

    if (!room) {
      return NextResponse.json({ message: "Sala no encontrada" }, { status: 404 });
    }

    // Check if user belongs to this room
    const me = room.players.find(p => p.userId === userId);

    let questions: any[] = [];
    try { questions = JSON.parse(room.flagSequence); } catch (e) {}

    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}

    const currentQuestion = questions[room.currentQuestionIndex] || null;

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        scope: room.scope,
        status: room.status,
        maxPlayers: room.maxPlayers,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.totalQuestions,
        winnerId: room.winnerId,
        players: room.players
      },
      currentQuestion,
      messages,
      currentUserId: userId,
      isMeHost: me?.isHost || false,
      isMeReady: me?.isReady || false,
      myScore: me?.score || 0
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return NextResponse.json({ message: "Error al obtener sala" }, { status: 500 });
  }
}

export async function PATCH(
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
      return NextResponse.json({ message: "Solo el anfitrión puede editar los ajustes de la sala" }, { status: 403 });
    }

    if (room.status !== "WAITING") {
      return NextResponse.json({ message: "No se pueden editar los ajustes mientras se juega" }, { status: 400 });
    }

    const body = await req.json();
    const { scope = room.scope, totalQuestions = room.totalQuestions } = body;

    const qCount = Math.min(50, Math.max(5, Number(totalQuestions) || 10));

    // Import or generate questions
    const { generateQuestionSequence } = await import("@/app/api/rooms/[code]/reset/route");
    const newQuestions = await generateQuestionSequence(scope, qCount);

    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}
    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: `⚙️ El anfitrión ha modificado la partida: ${scope} • ${qCount} preguntas.`,
      emoji: "⚙️",
      timestamp: Date.now()
    });

    // Reset ready status of all players because settings changed
    await prisma.roomPlayer.updateMany({
      where: { roomId: room.id },
      data: { isReady: false }
    });

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        scope,
        totalQuestions: qCount,
        flagSequence: JSON.stringify(newQuestions),
        messagesJson: JSON.stringify(messages)
      },
      include: { players: true }
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error("Error updating room settings:", error);
    return NextResponse.json({ message: "Error al actualizar ajustes" }, { status: 500 });
  }
}

