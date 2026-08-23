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
    const { score = 0, timeMs = 0 } = body;

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

    // Check if both players will be done after this submission
    const willChallengerDone = isChallenger ? true : challenge.challengerDone;
    const willChallengedDone = isChallenged ? true : challenge.challengedDone;

    let winnerId: string | null = null;
    let xpAwarded = 10; // Base participation XP

    if (willChallengerDone && willChallengedDone) {
      const cScore = isChallenger ? score : challenge.challengerScore || 0;
      const cTime = isChallenger ? timeMs : challenge.challengerTimeMs || 999999;
      
      const rScore = isChallenged ? score : challenge.challengedScore || 0;
      const rTime = isChallenged ? timeMs : challenge.challengedTimeMs || 999999;

      if (cScore > rScore) {
        winnerId = challenge.challengerId;
      } else if (rScore > cScore) {
        winnerId = challenge.challengedId;
      } else {
        // Tie in score: tie-breaker by time
        if (cTime < rTime) {
          winnerId = challenge.challengerId;
        } else if (rTime < cTime) {
          winnerId = challenge.challengedId;
        } else {
          winnerId = "DRAW";
        }
      }

      updateData.winnerId = winnerId;
      updateData.status = "COMPLETED";

      // Award XP & Update 1v1 Duels Stats
      if (winnerId === "DRAW") {
        await prisma.user.update({
          where: { id: challenge.challengerId },
          data: { 
            xp: { increment: 15 },
            duelsDrawn: { increment: 1 },
            duelsTotal: { increment: 1 }
          }
        });
        await prisma.user.update({
          where: { id: challenge.challengedId },
          data: { 
            xp: { increment: 15 },
            duelsDrawn: { increment: 1 },
            duelsTotal: { increment: 1 }
          }
        });
        xpAwarded = 15;
      } else {
        // Winner gets +20 XP and duelsWon +1
        await prisma.user.update({
          where: { id: winnerId! },
          data: { 
            xp: { increment: 20 },
            duelsWon: { increment: 1 },
            duelsTotal: { increment: 1 }
          }
        });

        // Loser gets +10 XP for participating and duelsLost +1
        const loserId = winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
        await prisma.user.update({
          where: { id: loserId },
          data: { 
            xp: { increment: 10 },
            duelsLost: { increment: 1 },
            duelsTotal: { increment: 1 }
          }
        });

        xpAwarded = winnerId === userId ? 20 : 10;
      }
    } else {
      // Single player finished first, grant +10 XP participation for now
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: 10 } }
      });
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
      xpAwarded,
      isFinished: willChallengerDone && willChallengedDone
    });
  } catch (error) {
    console.error("Error saving challenge answer:", error);
    return NextResponse.json({ message: "Error al guardar el resultado" }, { status: 500 });
  }
}
