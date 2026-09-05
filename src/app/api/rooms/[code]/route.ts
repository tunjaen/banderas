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
