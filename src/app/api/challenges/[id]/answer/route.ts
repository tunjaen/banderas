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
    const body = await req.json();
    const { 
      score = 0, 
      timeMs = 0, 
      progressData = null, 
      isSessionEnd = false 
    } = body;

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

    if (challenge.gameMode === "DOMINATION" && progressData) {
      // Domination mode logic
      const hitsMap = progressData.hits || {};
      const correctCount = progressData.correctCount || 0;
      const wrongCount = progressData.wrongCount || 0;
      const totalAttempts = correctCount + wrongCount;
      const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

      // Count dominated countries (hits >= 3)
      let isoList: string[] = [];
      try { isoList = JSON.parse(challenge.flagSequence); } catch (e) {}
      
      const totalTerritoryCount = isoList.length || challenge.targetScore;
      const dominatedCount = Object.keys(hitsMap).filter(k => (hitsMap[k] || 0) >= 3).length;
      const isPlayerFinished = totalTerritoryCount > 0 && dominatedCount >= totalTerritoryCount;

      const progressStr = JSON.stringify({
        hits: hitsMap,
        correctCount,
        wrongCount,
        dominatedCount,
        totalTerritoryCount
      });

      if (isChallenger) {
        updateData.challengerProgressJson = progressStr;
        updateData.challengerAccuracy = accuracy;
        updateData.challengerScore = dominatedCount;
        updateData.challengerTimeMs = (challenge.challengerTimeMs || 0) + timeMs;
        if (isPlayerFinished) updateData.challengerDone = true;
      } else {
        updateData.challengedProgressJson = progressStr;
        updateData.challengedAccuracy = accuracy;
        updateData.challengedScore = dominatedCount;
        updateData.challengedTimeMs = (challenge.challengedTimeMs || 0) + timeMs;
        if (isPlayerFinished) updateData.challengedDone = true;
        updateData.status = "ACCEPTED";
      }

      // If this player finished dominating all countries, check if firstCompletedAt needs to be set
      if (isPlayerFinished && !challenge.firstCompletedAt) {
        updateData.firstCompletedAt = new Date();
      }

      const willChallengerDone = isChallenger ? isPlayerFinished : challenge.challengerDone;
      const willChallengedDone = isChallenged ? isPlayerFinished : challenge.challengedDone;

      // If BOTH players finished dominating all countries, calculate winner by accuracy %
      if (willChallengerDone && willChallengedDone) {
        const cAcc = isChallenger ? accuracy : (challenge.challengerAccuracy || 0);
        const rAcc = isChallenged ? accuracy : (challenge.challengedAccuracy || 0);

        let winnerId: string | null = null;
        if (cAcc > rAcc) {
          winnerId = challenge.challengerId;
        } else if (rAcc > cAcc) {
          winnerId = challenge.challengedId;
        } else {
          // Tie breaker: total score or time
          const cTime = isChallenger ? (challenge.challengerTimeMs || 0) + timeMs : (challenge.challengerTimeMs || 999999);
          const rTime = isChallenged ? (challenge.challengedTimeMs || 0) + timeMs : (challenge.challengedTimeMs || 999999);

          if (cTime < rTime) winnerId = challenge.challengerId;
          else if (rTime < cTime) winnerId = challenge.challengedId;
          else winnerId = "DRAW";
        }

        updateData.winnerId = winnerId;
        updateData.status = "COMPLETED";

        // Award XP
        if (winnerId === "DRAW") {
          await prisma.user.update({ where: { id: challenge.challengerId }, data: { xp: { increment: 20 }, duelsDrawn: { increment: 1 }, duelsTotal: { increment: 1 } } });
          await prisma.user.update({ where: { id: challenge.challengedId }, data: { xp: { increment: 20 }, duelsDrawn: { increment: 1 }, duelsTotal: { increment: 1 } } });
        } else {
          await prisma.user.update({ where: { id: winnerId! }, data: { xp: { increment: 30 }, duelsWon: { increment: 1 }, duelsTotal: { increment: 1 } } });
          const loserId = winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
          await prisma.user.update({ where: { id: loserId }, data: { xp: { increment: 15 }, duelsLost: { increment: 1 }, duelsTotal: { increment: 1 } } });
        }
      }

    } else {
      // Standard / LIGHTNING mode logic
      if (isChallenger) {
        updateData.challengerScore = score;
        updateData.challengerTimeMs = timeMs;
        updateData.challengerDone = true;
      } else {
        updateData.challengedScore = score;
        updateData.challengedTimeMs = timeMs;
        updateData.challengedDone = true;
        updateData.status = "ACCEPTED";
      }

      const willChallengerDone = isChallenger ? true : challenge.challengerDone;
      const willChallengedDone = isChallenged ? true : challenge.challengedDone;

      if (willChallengerDone && willChallengedDone) {
        const cScore = isChallenger ? score : challenge.challengerScore || 0;
        const cTime = isChallenger ? timeMs : challenge.challengerTimeMs || 999999;
        const rScore = isChallenged ? score : challenge.challengedScore || 0;
        const rTime = isChallenged ? timeMs : challenge.challengedTimeMs || 999999;

        let winnerId: string | null = null;
        if (cScore > rScore) winnerId = challenge.challengerId;
        else if (rScore > cScore) winnerId = challenge.challengedId;
        else {
          if (cTime < rTime) winnerId = challenge.challengerId;
          else if (rTime < cTime) winnerId = challenge.challengedId;
          else winnerId = "DRAW";
        }

        updateData.winnerId = winnerId;
        updateData.status = "COMPLETED";

        if (winnerId === "DRAW") {
          await prisma.user.update({ where: { id: challenge.challengerId }, data: { xp: { increment: 15 }, duelsDrawn: { increment: 1 }, duelsTotal: { increment: 1 } } });
          await prisma.user.update({ where: { id: challenge.challengedId }, data: { xp: { increment: 15 }, duelsDrawn: { increment: 1 }, duelsTotal: { increment: 1 } } });
        } else {
          await prisma.user.update({ where: { id: winnerId! }, data: { xp: { increment: 20 }, duelsWon: { increment: 1 }, duelsTotal: { increment: 1 } } });
          const loserId = winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
          await prisma.user.update({ where: { id: loserId }, data: { xp: { increment: 10 }, duelsLost: { increment: 1 }, duelsTotal: { increment: 1 } } });
        }
      } else {
        await prisma.user.update({ where: { id: userId }, data: { xp: { increment: 10 } } });
      }
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: updateData,
      include: {
        challenger: { select: { id: true, name: true } },
        challenged: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      challenge: updatedChallenge,
      isFinished: updatedChallenge.status === "COMPLETED"
    });
  } catch (error) {
    console.error("Error saving challenge answer:", error);
    return NextResponse.json({ message: "Error al guardar el resultado" }, { status: 500 });
  }
}
