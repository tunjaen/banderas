import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    if (!userId) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        level: true,
        xp: true,
        currentStreak: true,
        longestStreak: true,
        flagCorrect: true,
        flagWrong: true,
        spatialCorrect: true,
        spatialWrong: true,
        progress: {
          include: {
            country: {
              select: { name: true, nameEn: true, continent: true, continentEn: true, isoCode: true }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Calcular estadísticas
    const flagTotal = user.flagCorrect + user.flagWrong;
    const flagAcc = flagTotal > 0 ? (user.flagCorrect / flagTotal) * 100 : 0;
    
    const spatialTotal = user.spatialCorrect + user.spatialWrong;
    const spatialAcc = spatialTotal > 0 ? (user.spatialCorrect / spatialTotal) * 100 : 0;

    let bestMode = "ninguno";
    if (flagTotal > 0 || spatialTotal > 0) {
      bestMode = flagAcc >= spatialAcc ? "flag" : "spatial";
    }

    // Peores banderas (Top 3)
    const worstFlags = [...user.progress]
      .filter(p => p.wrongAnswers > 0)
      .sort((a, b) => b.wrongAnswers - a.wrongAnswers)
      .slice(0, 3)
      .map(p => ({
        countryId: p.countryId,
        isoCode: p.country.isoCode,
        name: p.country.name,
        nameEn: p.country.nameEn,
        wrongAnswers: p.wrongAnswers,
      }));

    // Mejor Continente
    const continents: Record<string, { total: number, mastered: number, nameEn: string }> = {};
    user.progress.forEach(p => {
      const cName = p.country.continent;
      if (!continents[cName]) continents[cName] = { total: 0, mastered: 0, nameEn: p.country.continentEn };
      continents[cName].total += 1;
      if (p.status === "Dominado") continents[cName].mastered += 1;
    });

    let bestContinent = { name: "Ninguno", nameEn: "None", mastered: 0 };
    for (const [name, stats] of Object.entries(continents)) {
      if (stats.mastered > bestContinent.mastered) {
        bestContinent = { name, nameEn: stats.nameEn, mastered: stats.mastered };
      }
    }

    const masteredCount = user.progress.filter(p => p.status === "Dominado").length;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        masteredCount
      },
      stats: {
        bestMode,
        flagAcc,
        spatialAcc,
        worstFlags,
        bestContinent
      }
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
