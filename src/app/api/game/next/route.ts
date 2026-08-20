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
    
    // Filter pool by mode
    if (mode === "continents" && continent) {
      pool = pool.filter(c => c.continent === continent);
    } else if (mode === "weaknesses") {
      const weakIds = userProgress
        .filter(p => p.status === "Aprendiendo" || (p.correctAnswers / (p.correctAnswers + p.wrongAnswers) < 0.6))
        .map(p => p.countryId);
      pool = pool.filter(c => weakIds.includes(c.id));
      if (pool.length === 0) {
        // Fallback if no weaknesses found
        pool = await prisma.country.findMany(); 
      }
    }

    const now = new Date();
    
    // Create a map of progress
    const progressMap = new Map(userProgress.map(p => [p.countryId, p]));

    // Determine the next target country
    // Priority: 1. Overdue reviews 2. New countries 3. Fallback to random
    let targetCountry = null;
    let overdue = [];
    let nuevos = [];

    for (const c of pool) {
      const p = progressMap.get(c.id);
      if (!p) {
        nuevos.push(c);
      } else if (p.nextReview <= now) {
        overdue.push(c);
      }
    }

    if (overdue.length > 0) {
      // Sort overdue by how late they are
      overdue.sort((a, b) => progressMap.get(a.id)!.nextReview.getTime() - progressMap.get(b.id)!.nextReview.getTime());
      targetCountry = overdue[0]; // Pick the most overdue
    } else if (nuevos.length > 0) {
      // Pick a random new country
      targetCountry = nuevos[Math.floor(Math.random() * nuevos.length)];
    } else {
      // Fallback: pick a random country from pool
      targetCountry = pool[Math.floor(Math.random() * pool.length)];
    }

    // Generate 3 wrong options from the same pool (or global pool)
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
      isoCode: o.isoCode, // for flag rendering
    }));

    // We send back the target id so the client can submit it, but we don't expose which one is correct directly in the options array in a way that gives it away, although the client knows it when rendering if we send `correctId`.
    // Actually, we must send the question. The question could be "What flag is this?" or "Where is this country?".
    
    return NextResponse.json({
      targetId: targetCountry.id,
      flagCode: targetCountry.isoCode,
      countryName: targetCountry.name,
      countryNameEn: targetCountry.nameEn,
      lat: targetCountry.lat,
      lng: targetCountry.lng,
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
