import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "world";
    const continent = searchParams.get("continent"); // for 'continents' mode
    const excludeParam = searchParams.get("exclude") || "";
    const excludeIds = excludeParam.split(",").map(id => id.trim()).filter(Boolean);

    const userId = (session.user as any).id;

    // Fetch user progress and country pool in parallel
    const [userProgress, fullPool] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: { country: true }
      }),
      prisma.country.findMany()
    ]);

    let pool = fullPool;
    
    const ISLAND_COUNTRIES = ["ABW","ASM","ATG","AUS","BHS","SHN","BMU","BRB","CCK","COK","COM","CPV","CUB","CUW","CXR","CYM","CYP","DMA","DOM","FJI","FLK","FSM","GBR","GGY","GLP","GRL","GUM","HTI","IDN","IMN","IOT","IRL","ISL","JAM","JEY","JPN","KIR","KNA","LCA","LKA","MDG","MDV","MHL","MLT","MNP","MSR","MTQ","MUS","MYT","NCL","NIU","NRU","NZL","PCN","PHL","PNG","PRI","PYF","REU","SGP","SJM","SLB","SPM","STP","SXM","SYC","TKL","TLS","TON","TTO","TUV","TWN","VGB","VIR","VUT","WLF","WSM"];

    // Filter pool by mode or continent
    if ((mode === "continents" || mode === "spatial") && continent && continent !== "Mundo") {
      if (continent === "Islas") {
        pool = pool.filter(c => ISLAND_COUNTRIES.includes(c.id));
      } else {
        pool = pool.filter(c => c.continent === continent);
      }
    } else if (mode === "weaknesses") {
      const weakIds = userProgress
        .filter(p => p.status === "Aprendiendo" || (p.correctAnswers / Math.max(1, p.correctAnswers + p.wrongAnswers) < 0.6))
        .map(p => p.countryId);
      pool = pool.filter(c => weakIds.includes(c.id));
      if (pool.length === 0) {
        pool = fullPool; 
      }
    }

    // Exclude already asked countries in the current session
    let availablePool = pool.filter(c => !excludeIds.includes(c.id));
    if (availablePool.length === 0) {
      availablePool = pool; // Fallback if all countries in pool have been asked
    }

    const now = new Date();
    const progressMap = new Map(userProgress.map(p => [p.countryId, p]));

    // Separate availablePool into unmastered vs mastered countries to reduce frequency of mastered ones
    const nonMasteredPool = availablePool.filter(c => progressMap.get(c.id)?.status !== "Dominado");
    const masteredPool = availablePool.filter(c => progressMap.get(c.id)?.status === "Dominado");

    // 85% chance to pick from non-mastered pool if available
    const pickFromNonMastered = nonMasteredPool.length > 0 && (masteredPool.length === 0 || Math.random() < 0.85);
    const candidatePool = pickFromNonMastered ? nonMasteredPool : (masteredPool.length > 0 ? masteredPool : availablePool);

    let targetCountry = null;
    let overdue = [];
    let nuevos = [];

    for (const c of candidatePool) {
      const p = progressMap.get(c.id);
      if (!p) {
        nuevos.push(c);
      } else if (p.nextReview <= now) {
        overdue.push(c);
      }
    }

    if (overdue.length > 0) {
      overdue.sort((a, b) => progressMap.get(a.id)!.nextReview.getTime() - progressMap.get(b.id)!.nextReview.getTime());
      targetCountry = overdue[0];
    } else if (nuevos.length > 0) {
      targetCountry = nuevos[Math.floor(Math.random() * nuevos.length)];
    } else {
      targetCountry = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    }

    // Generate 3 wrong options from the main pool
    const options = [targetCountry];
    while (options.length < 4) {
      const randomOption = pool[Math.floor(Math.random() * pool.length)];
      if (!options.find(o => o.id === randomOption.id)) {
        options.push(randomOption);
      }
    }

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5).map(o => ({
      id: o.id,
      name: o.name,
      nameEn: o.nameEn,
      isoCode: (o.isoCode.toUpperCase() === "SJM" || o.isoCode.toUpperCase() === "BVT") ? "no" : o.isoCode,
    }));

    const targetProgress = progressMap.get(targetCountry.id);
    const targetStatus = targetProgress?.status || "Nuevo";
    
    // Normalize Norwegian territories flag code to Norway's flag ("no")
    let targetFlagCode = targetCountry.isoCode;
    if (targetFlagCode.toUpperCase() === "SJM" || targetFlagCode.toUpperCase() === "BVT") {
      targetFlagCode = "no";
    }

    return NextResponse.json({
      targetId: targetCountry.id,
      flagCode: targetFlagCode,
      countryName: targetCountry.name,
      countryNameEn: targetCountry.nameEn,
      lat: targetCountry.lat,
      lng: targetCountry.lng,
      status: targetStatus,
      options: shuffledOptions.map(o => ({
        id: o.id,
        name: o.name,
        nameEn: o.nameEn,
        isoCode: o.isoCode
      }))
    });

  } catch (error) {
    console.error("Error generating question:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
