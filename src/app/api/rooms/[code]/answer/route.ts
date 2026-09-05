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
    const { countryId, questionIndex, isTimeout = false } = body;

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

    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}

    // CASE 1: TIMEOUT (Inhabilitar opción sin penalización)
    if (isTimeout) {
      await prisma.roomPlayer.update({
        where: { id: me.id },
        data: { lastAnsweredQuestionIndex: questionIndex }
      });
      return NextResponse.json({ isTimeout: true, isCorrect: false });
    }

    const isCorrect = currentQ.country.id === countryId;

    // CASE 2: INCORRECT ANSWER (Fallo -> Puntaje suma a los oponentes)
    if (!isCorrect) {
      await prisma.roomPlayer.update({
        where: { id: me.id },
        data: { lastAnsweredQuestionIndex: questionIndex }
      });

      // Sum +1 point to all opponents in the room
      await prisma.roomPlayer.updateMany({
        where: {
          roomId: room.id,
          userId: { not: userId }
        },
        data: {
          score: { increment: 1 }
        }
      });

      messages.push({
        id: `sys_${Date.now()}`,
        senderId: "system",
        senderName: "Sistema",
        text: `💥 ¡${me.name} cometió un error! (+1 punto para sus oponentes)`,
        emoji: "💣",
        timestamp: Date.now()
      });

      await prisma.room.update({
        where: { id: room.id },
        data: { messagesJson: JSON.stringify(messages) }
      });

      return NextResponse.json({ isCorrect: false, penaltyApplied: true });
    }

    // CASE 3: CORRECT ANSWER (Acierto)
    const now = Date.now();

    // Check if question was already claimed by another player
    if (currentQ.claimedBy) {
      const timeDiff = now - (currentQ.claimedBy.timestamp || 0);

      // If answered within simultaneous window (2.5 seconds), award point to this player too!
      if (timeDiff <= 2500) {
        const newScore = me.score + 1;
        await prisma.roomPlayer.update({
          where: { id: me.id },
          data: {
            score: newScore,
            lastAnsweredQuestionIndex: questionIndex
          }
        });

        messages.push({
          id: `sys_${Date.now()}`,
          senderId: "system",
          senderName: "Sistema",
          text: `✨ ¡${me.name} también acertó la bandera a tiempo (+1 punto)!`,
          emoji: "🎉",
          timestamp: Date.now()
        });

        await prisma.room.update({
          where: { id: room.id },
          data: { messagesJson: JSON.stringify(messages) }
        });

        return NextResponse.json({
          isCorrect: true,
          isSimultaneous: true,
          newScore
        });
      }

      return NextResponse.json({
        isCorrect: true,
        isLate: true,
        claimedBy: currentQ.claimedBy
      });
    }

    // FIRST TO GUESS CORRECTLY!
    currentQ.claimedBy = {
      userId,
      name: me.name,
      timestamp: now
    };

    const nextIndex = questionIndex + 1;
    const isGameFinished = nextIndex >= room.totalQuestions;

    const newScore = me.score + 1;
    await prisma.roomPlayer.update({
      where: { id: me.id },
      data: {
        score: newScore,
        lastAnsweredQuestionIndex: questionIndex
      }
    });

    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: `⚡ ¡${me.name} fue el más rápido y acertó la bandera (+1 punto)! (${currentQ.country.name || currentQ.country.nameEn})`,
      emoji: "🏆",
      timestamp: Date.now()
    });

    let winnerId: string | null = null;
    let roomStatus = room.status;

    if (isGameFinished) {
      roomStatus = "FINISHED";
      const updatedPlayers = await prisma.roomPlayer.findMany({
        where: { roomId: room.id },
        orderBy: { score: "desc" }
      });

      const topPlayer = updatedPlayers[0];
      if (topPlayer) {
        winnerId = topPlayer.userId;
      }

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
