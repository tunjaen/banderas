import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ISLAND_COUNTRIES = ["ABW","ASM","ATG","AUS","BHS","SHN","BMU","BRB","CCK","COK","COM","CPV","CUB","CUW","CXR","CYM","CYP","DMA","DOM","FJI","FLK","FSM","GBR","GGY","GLP","GRL","GUM","HTI","IDN","IMN","IOT","IRL","ISL","JAM","JEY","JPN","KIR","KNA","LCA","LKA","MDG","MDV","MHL","MLT","MNP","MSR","MTQ","MUS","MYT","NCL","NIU","NRU","NZL","PCN","PHL","PNG","PRI","PYF","REU","SGP","SLB","SPM","STP","SXM","SYC","TKL","TLS","TON","TTO","TUV","TWN","VGB","VIR","VUT","WLF","WSM"];

const SUBREGIONS: Record<string, string[]> = {
  Africa_NorthWest: ["EGY","DZA","MAR","TUN","LBY","SDN","ESH", "NGA","GHA","SEN","CIV","MLI","NER","BFAS","GIN","BEN","TGO","GMB","GNB","SLE","LBR","CPV","MRT"],
  Africa_East: ["ETH","KEN","TZA","UGA","RWA","BDI","SOM","DJI","ERI","SSD","MOZ","MDG","MWI","ZMB","ZWE","MUS","SYC","COM","MYT","REU"],
  Africa_CentralSouth: ["ZAF","AGO","CMR","COD","COG","GAB","GNQ","STP","NAM","BWA","LSO","SWZ","CAF","TCD"],
  
  Europe_WestNorth: ["FRA","DEU","NLD","BEL","CHE","AUT","LUX","MCO","LIE", "GBR","IRL","SWE","NOR","FIN","DNK","ISL","EST","LVA","LTU","FRO","ALA"],
  Europe_South: ["ESP","PRT","ITA","GRC","HRV","SVN","BIH","SRB","MNE","MKD","ALB","MLT","CYP","AND","SMR","VAT","GIB"],
  Europe_East: ["POL","CZE","SVK","HUN","ROU","BGR","UKR","BLR","MDA","RUS","LTU","LVA"],

  Asia_EastSE: ["CHN","JPN","KOR","PRK","TWN","HKG","MAC", "IDN","PHL","VNM","THA","MYS","SGP","MMR","KHM","LAO","BRN","TLS"],
  Asia_SouthCentral: ["IND","PAK","BGD","LKA","NPL","AFG","BTN","MDV", "KAZ","UZB","TKM","KGZ","TJK"],
  Asia_MiddleEast: ["TUR","SAU","IRN","IRQ","ARE","ISR","PSE","JOR","LBN","SYR","YEM","OMN","QAT","KWT","BHR","AZE","ARM","GEO"],

  America_NorthCentral: ["USA","CAN","MEX", "GTM","HND","SLV","NIC","CRI","PAN","BLZ","CUB","DOM"],
  America_Caribbean: ["HTI","JAM","PRI","BHS","TTO","BRB","LCA","ATG","KNA","VCT","DMA","GRD","ABW","CUW","SXM","CYM","VIR","VGB","BMU","AIA","MSR","TCAS","GLP","MTQ","BLM"],
  America_South: ["BRA","ARG","COL","PER","VEN","CHL","ECU","BOL","PRY","URY","GUY","SUR","GUF","FLK"]
};

export async function GET(
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

    let challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, name: true, level: true, xp: true } },
        challenged: { select: { id: true, name: true, level: true, xp: true } }
      }
    });

    if (!challenge) {
      return NextResponse.json({ message: "Reto no encontrado" }, { status: 404 });
    }

    // Check expiration conditions for Domination challenges
    const now = Date.now();
    const createdAtTime = new Date(challenge.createdAt).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const expiresAtMs = createdAtTime + threeDaysMs;

    const isThreeDaysExpired = now >= expiresAtMs;
    
    // Also check if 24 hours passed after first player completion
    let is24hAfterFirstCompletedExpired = false;
    if (challenge.firstCompletedAt) {
      const firstCompletedTime = new Date(challenge.firstCompletedAt).getTime();
      if ((now - firstCompletedTime) >= 24 * 60 * 60 * 1000) {
        is24hAfterFirstCompletedExpired = true;
      }
    }

    if ((isThreeDaysExpired || is24hAfterFirstCompletedExpired) && challenge.status !== "COMPLETED") {
      let cAcc = challenge.challengerAccuracy || 0;
      let rAcc = challenge.challengedAccuracy || 0;

      // Calculate accuracy from progress JSON if available
      try {
        if (challenge.challengerProgressJson) {
          const cData = JSON.parse(challenge.challengerProgressJson);
          const total = (cData.correctCount || 0) + (cData.wrongCount || 0);
          if (total > 0) cAcc = (cData.correctCount / total) * 100;
        }
        if (challenge.challengedProgressJson) {
          const rData = JSON.parse(challenge.challengedProgressJson);
          const total = (rData.correctCount || 0) + (rData.wrongCount || 0);
          if (total > 0) rAcc = (rData.correctCount / total) * 100;
        }
      } catch (e) {}

      let winnerId: string | null = null;
      
      // Rule: When 3 days pass and neither player finished, winner is decided by HIGHEST ACCURACY % (porcentaje de acierto)
      if (cAcc > rAcc) {
        winnerId = challenge.challengerId;
      } else if (rAcc > cAcc) {
        winnerId = challenge.challengedId;
      } else {
        // Tie breaker by dominated countries count if accuracy % is tied
        const cDom = challenge.challengerScore || 0;
        const rDom = challenge.challengedScore || 0;
        if (cDom > rDom) winnerId = challenge.challengerId;
        else if (rDom > cDom) winnerId = challenge.challengedId;
        else winnerId = "DRAW";
      }

      const loserId = winnerId === "DRAW" ? null : (winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId);

      if (winnerId === "DRAW") {
        await prisma.user.update({ where: { id: challenge.challengerId }, data: { xp: { increment: 15 }, duelsDrawn: { increment: 1 }, duelsTotal: { increment: 1 } } });
        await prisma.user.update({ where: { id: challenge.challengedId }, data: { xp: { increment: 15 }, duelsDrawn: { increment: 1 }, duelsTotal: { increment: 1 } } });
      } else if (winnerId) {
        await prisma.user.update({ where: { id: winnerId }, data: { xp: { increment: 25 }, duelsWon: { increment: 1 }, duelsTotal: { increment: 1 } } });
        if (loserId) {
          await prisma.user.update({ where: { id: loserId }, data: { xp: { increment: 10 }, duelsLost: { increment: 1 }, duelsTotal: { increment: 1 } } });
        }
      }

      challenge = await prisma.challenge.update({
        where: { id },
        data: {
          winnerId,
          status: "COMPLETED",
          challengerDone: true,
          challengedDone: true,
          challengerAccuracy: cAcc,
          challengedAccuracy: rAcc
        },
        include: {
          challenger: { select: { id: true, name: true, level: true, xp: true } },
          challenged: { select: { id: true, name: true, level: true, xp: true } }
        }
      });
    }

    // Parse pre-generated flag ISO sequence
    let isoList: string[] = [];
    try {
      isoList = JSON.parse(challenge.flagSequence);
    } catch (e) {
      isoList = challenge.flagSequence.split(",");
    }

    // Fetch details of countries in sequence
    const rawCountries = await prisma.country.findMany({
      where: { id: { in: isoList } }
    });

    const countriesMap = new Map(rawCountries.map(c => [c.id, c]));
    let orderedCountries = isoList.map(iso => countriesMap.get(iso)).filter(Boolean);

    // Build candidate distractor pool based on scopeValues
    const items = challenge.scopeValues.split(",").map((s: string) => s.trim());
    const allowedISOs = new Set<string>();
    let useAllCountries = false;

    if (items.includes("world") || items.includes("Todo el Mundo") || items.includes("Mundo")) {
      useAllCountries = true;
    } else {
      for (const item of items) {
        if (["Europa", "América", "Asia", "África", "Oceanía"].includes(item)) {
          const contCountries = await prisma.country.findMany({
            where: { continent: { contains: item, mode: "insensitive" } },
            select: { id: true }
          });
          contCountries.forEach(c => allowedISOs.add(c.id));
        } else if (item === "Islas") {
          ISLAND_COUNTRIES.forEach(iso => allowedISOs.add(iso));
        } else if (SUBREGIONS[item]) {
          SUBREGIONS[item].forEach(iso => allowedISOs.add(iso));
        } else {
          const cleanItem = item.replace(/_/g, " ");
          const matchCountries = await prisma.country.findMany({
            where: {
              OR: [
                { continent: { contains: cleanItem, mode: "insensitive" } },
                { name: { contains: cleanItem, mode: "insensitive" } }
              ]
            },
            select: { id: true }
          });
          matchCountries.forEach(c => allowedISOs.add(c.id));
        }
      }
    }

    const [blockPool, allCountries] = await Promise.all([
      prisma.country.findMany({
        where: useAllCountries || allowedISOs.size === 0 ? {} : { id: { in: Array.from(allowedISOs) } },
        select: { id: true, name: true, nameEn: true, capital: true, capitalEn: true, isoCode: true, continent: true }
      }),
      prisma.country.findMany({
        select: { id: true, name: true, nameEn: true, capital: true, capitalEn: true, isoCode: true, continent: true }
      })
    ]);

    // In DOMINATION mode, filter remaining un-dominated countries for the current user's session
    let targetCountriesToAsk = orderedCountries;

    if (challenge.gameMode === "DOMINATION") {
      const userProgressJson = challenge.challengerId === userId ? challenge.challengerProgressJson : challenge.challengedProgressJson;
      let userHits: Record<string, number> = {};
      try {
        if (userProgressJson) {
          const parsed = JSON.parse(userProgressJson);
          userHits = parsed.hits || {};
        }
      } catch (e) {}

      // Keep countries that user has NOT dominated yet (< 3 hits)
      const undominated = orderedCountries.filter(c => c && (userHits[c.id] || 0) < 3);

      if (undominated.length > 0) {
        // Shuffle undominated countries to create a dynamic session round (take up to 15 questions per session)
        targetCountriesToAsk = [...undominated].sort(() => Math.random() - 0.5);
      } else {
        targetCountriesToAsk = [];
      }
    }

    const questions = targetCountriesToAsk.map(c => {
      if (!c) return null;

      let pool = blockPool.filter(ac => ac.id !== c.id);

      if (pool.length < 3) {
        const contPool = allCountries.filter(ac => ac.id !== c.id && ac.continent === c.continent && !pool.some(p => p.id === ac.id));
        pool = [...pool, ...contPool];
      }

      if (pool.length < 3) {
        const remaining = allCountries.filter(ac => ac.id !== c.id && !pool.some(p => p.id === ac.id));
        pool = [...pool, ...remaining];
      }

      const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [c, ...distractors].sort(() => Math.random() - 0.5);

      return {
        country: c,
        options
      };
    }).filter(Boolean);

    return NextResponse.json({
      challenge,
      questions,
      currentUserId: userId,
      allTerritoryCountries: orderedCountries.map(c => ({
        id: c?.id,
        name: c?.name,
        nameEn: c?.nameEn,
        isoCode: c?.isoCode
      }))
    });
  } catch (error) {
    console.error("Error fetching single challenge:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
