import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { countryId, isCorrect, mode, subregion, difficulty } = await req.json();
    if (!countryId || typeof isCorrect !== "boolean") {
      return NextResponse.json({ message: "Faltan parámetros" }, { status: 400 });
    }
    
    // mode can be "flag" or "spatial" (default to flag if not provided for backwards compat)
    const gameMode = mode === "spatial" ? "spatial" : "flag";

    const userId = (session.user as any).id;

    // Parallelize all initial fetches
    const [progressResult, user, country] = await Promise.all([
      prisma.userProgress.findUnique({ where: { userId_countryId: { userId, countryId } } }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.country.findUnique({ where: { id: countryId } })
    ]);

    let progress = progressResult;
    if (!progress) {
      progress = await prisma.userProgress.create({
        data: { userId, countryId }
      });
    }

    // SuperMemo-2 (SM-2) simplified algorithm
    let { easeFactor, interval, correctAnswers, wrongAnswers, consecutiveCorrect } = progress;
    
    // Quality of response: 5 (perfect), 0 (complete blackout)
    // For simplicity: correct = 4, wrong = 0
    const quality = isCorrect ? 4 : 0;

    if (isCorrect) {
      correctAnswers += 1;
      consecutiveCorrect += 1;
      if (interval === 0) {
        interval = 1;
      } else if (interval === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    } else {
      wrongAnswers += 1;
      consecutiveCorrect = 0; // Reset streak
      interval = 1; // Reset interval
    }

    // Update ease factor: EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Determine status
    let status = "Aprendiendo";
    if (correctAnswers === 0) status = "Nuevo";
    else if (correctAnswers >= 4 && (correctAnswers / (correctAnswers + wrongAnswers)) > 0.8) status = "Dominado";
    else if (consecutiveCorrect >= 3) status = "Familiar";

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    // Prepare all updates to execute in parallel
    const updatePromises = [];

    updatePromises.push(prisma.userProgress.update({
      where: { id: progress.id },
      data: {
        easeFactor,
        interval,
        correctAnswers,
        wrongAnswers,
        consecutiveCorrect,
        status,
        lastReviewed: new Date(),
        nextReview
      }
    }));

    let xpGained = 0;

    // Update Gamification for User
    if (user) {
      let { xp, currentStreak, longestStreak, lastPlayedAt, level, flagCorrect, flagWrong, spatialCorrect, spatialWrong } = user;
      
      // Update streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastPlayed = lastPlayedAt ? new Date(lastPlayedAt) : null;
      if (lastPlayed) lastPlayed.setHours(0,0,0,0);

      if (!lastPlayed || today.getTime() - lastPlayed.getTime() === 86400000) {
        // consecutive day
        if (isCorrect) currentStreak += 1;
      } else if (today.getTime() - lastPlayed.getTime() > 86400000) {
        // broke streak
        currentStreak = isCorrect ? 1 : 0;
      }

      if (currentStreak > longestStreak) longestStreak = currentStreak;

      // Add XP according to mastery status & difficulty level
      // Easy level = 5 XP, Medium level = 10 XP, Hard/Special level = 15 XP
      const EASY_SUBREGIONS = ["Europe_WestNorth", "Asia_EastSE", "America_NorthCentral", "America_South"];
      const HARD_SUBREGIONS = ["Asia_MiddleEast", "Africa_CentralSouth"];

      let baseXP = 10; // default medium
      if (difficulty === "facil" || (subregion && EASY_SUBREGIONS.includes(subregion))) {
        baseXP = 5; // Easy mode awards 5 XP
      } else if (difficulty === "dificil" || difficulty === "especial" || (subregion && HARD_SUBREGIONS.includes(subregion))) {
        baseXP = 15; // Hard mode awards 15 XP
      }

      const wasDominado = progress?.status === "Dominado";

      if (isCorrect) {
        if (wasDominado) {
          xpGained = mode === "world" ? 5 : 2;
        } else {
          xpGained = baseXP;
          if (currentStreak > 5) xpGained += Math.round(baseXP * 0.5); // 50% streak bonus
        }
      } else {
        xpGained = 1;
      }
      xp += xpGained;

      // Level calculation
      const nextLevelXp = level * (level + 1) * 50;
      let leveledUp = false;
      if (xp >= nextLevelXp) {
        level += 1;
        leveledUp = true;
      }

      // Update Game Mode Stats
      if (gameMode === "flag") {
        if (isCorrect) flagCorrect += 1;
        else flagWrong += 1;
      } else {
        if (isCorrect) spatialCorrect += 1;
        else spatialWrong += 1;
      }

      updatePromises.push(prisma.user.update({
        where: { id: userId },
        data: {
          xp, level, currentStreak, longestStreak, lastPlayedAt: new Date(),
          flagCorrect, flagWrong, spatialCorrect, spatialWrong
        }
      }));
    }

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      country, // Fetched initially in parallel
      xpGained,
    });

  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
