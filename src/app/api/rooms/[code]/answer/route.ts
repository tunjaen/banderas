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
    const { countryId, questionIndex } = body;

    const room = await prisma.room.findUnique({
      where: { code: cleanCode },
      include: { players: true }
    });

    if (!room) {
      return NextResponse.json({ message: "Sala no encontrada" }, { status: 404 });
    }

    if (room.status !== "PLAYING") {
      return NextResponse.json({ message: "La partida no está en curso" }, { status: 400 });
    }

    const me = room.players.find(p => p.userId === userId);
    if (!me) {
      return NextResponse.json({ message: "No eres miembro de esta sala" }, { status: 403 });
    }

    if (room.currentQuestionIndex !== questionIndex) {
      return NextResponse.json({
        message: "La pregunta ya avanzó",
        currentQuestionIndex: room.currentQuestionIndex
      }, { status: 400 });
    }

    let questions: any[] = [];
    try { questions = JSON.parse(room.flagSequence); } catch (e) {}

    const currentQ = questions[questionIndex];
    if (!currentQ) {
      return NextResponse.json({ message: "Pregunta no encontrada" }, { status: 404 });
    }

    const isCorrect = currentQ.country.id === countryId;

    if (!isCorrect) {
      // Mark player answered wrong
      await prisma.roomPlayer.update({
        where: { id: me.id },
        data: { lastAnsweredQuestionIndex: questionIndex }
      });
      return NextResponse.json({ isCorrect: false, isFirst: false });
    }

    // Check if question was already claimed by another player
    if (currentQ.claimedBy) {
      return NextResponse.json({
        isCorrect: true,
        isFirst: false,
        claimedBy: currentQ.claimedBy
      });
    }

    // CLAIM POINT! This player is the FIRST to guess correctly
    currentQ.claimedBy = {
      userId,
      name: me.name,
      timestamp: Date.now()
    };

    const nextIndex = questionIndex + 1;
    const isGameFinished = nextIndex >= room.totalQuestions;

    // Update player score
    const newScore = me.score + 1;
    await prisma.roomPlayer.update({
      where: { id: me.id },
      data: {
        score: newScore,
        lastAnsweredQuestionIndex: questionIndex
      }
    });

    // Chat system notification
    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}
    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: `⚡ ¡${me.name} fue el más rápido y se lleva el punto! (${currentQ.country.name || currentQ.country.nameEn})`,
      emoji: "🏆",
      timestamp: Date.now()
    });

    let winnerId: string | null = null;
    let roomStatus = room.status;

    if (isGameFinished) {
      roomStatus = "FINISHED";
      // Find winner by highest score
      const updatedPlayers = await prisma.roomPlayer.findMany({
        where: { roomId: room.id },
        orderBy: { score: "desc" }
      });

      const topPlayer = updatedPlayers[0];
      if (topPlayer) {
        winnerId = topPlayer.userId;
      }

      // Award XP to participants
      for (const p of updatedPlayers) {
        const xpEarned = (p.score * 15) + (p.userId === winnerId ? 30 : 10);
        await prisma.user.update({
          where: { id: p.userId },
          data: { xp: { increment: xpEarned } }
        });
      }

      messages.push({
        id: `sys_${Date.now()}_win`,
        senderId: "system",
        senderName: "Sistema",
        text: `👑 ¡PARTIDA FINALIZADA! Ganador: ${topPlayer ? topPlayer.name : "Empate"}.`,
        emoji: "🎉",
        timestamp: Date.now()
      });
    }

    await prisma.room.update({
      where: { id: room.id },
      data: {
        flagSequence: JSON.stringify(questions),
        messagesJson: JSON.stringify(messages),
        currentQuestionIndex: isGameFinished ? questionIndex : nextIndex,
        status: roomStatus,
        winnerId
      }
    });

    return NextResponse.json({
      isCorrect: true,
      isFirst: true,
      winnerName: me.name,
      newScore,
      isGameFinished
    });
  } catch (error) {
    console.error("Error processing answer:", error);
    return NextResponse.json({ message: "Error al procesar la respuesta" }, { status: 500 });
  }
}
