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

    const subregion = searchParams.get("subregion");
    const progressMap = new Map(userProgress.map(p => [p.countryId, p]));

    // Filter pool by mode, continent, or subregion
    if (subregion && SUBREGIONS[subregion]) {
      const allowedIds = SUBREGIONS[subregion];
      pool = pool.filter(c => allowedIds.includes(c.id.toUpperCase()));
    } else if ((mode === "continents" || mode === "spatial") && continent && continent !== "Mundo") {
      if (continent === "Islas") {
        pool = pool.filter(c => ISLAND_COUNTRIES.includes(c.id));
      } else {
        pool = pool.filter(c => c.continent === continent);
      }
    } else if (mode === "weaknesses") {
      // Weighted Error Priority Algorithm:
      // Score = (wrongAnswers * 4) + (errorRate * 200) - (consecutiveCorrect * 3)
      const scoredCountries = fullPool.map(c => {
        const p = progressMap.get(c.id);
        if (!p || p.wrongAnswers === 0) {
          return { country: c, score: 0, wrongAnswers: 0 };
        }
        const totalAttempts = Math.max(1, p.correctAnswers + p.wrongAnswers);
        const errorRate = p.wrongAnswers / totalAttempts;
        const score = (p.wrongAnswers * 4) + (errorRate * 200) - (p.consecutiveCorrect * 3);
        return { country: c, score, wrongAnswers: p.wrongAnswers };
      });

      const errorPool = scoredCountries
        .filter(item => item.wrongAnswers > 0 && item.score > 0)
        .sort((a, b) => b.score - a.score);

      if (errorPool.length > 0) {
        pool = errorPool.map(item => item.country);
      } else {
        const unmastered = fullPool.filter(c => progressMap.get(c.id)?.status !== "Dominado");
        pool = unmastered.length > 0 ? unmastered : fullPool;
      }
    }

    // Exclude already asked countries in the current session
    let availablePool = pool.filter(c => !excludeIds.includes(c.id));
    if (availablePool.length === 0) {
      availablePool = pool; // Fallback if all countries in pool have been asked
    }

    const now = new Date();

    let targetCountry = null;

    if (mode === "weaknesses") {
      // In weaknesses mode, pick probabilistically from top candidates (weighted towards highest error score)
      targetCountry = availablePool[0];
    } else {
      // Separate availablePool into unmastered vs mastered countries
      const nonMasteredPool = availablePool.filter(c => progressMap.get(c.id)?.status !== "Dominado");
      const masteredPool = availablePool.filter(c => progressMap.get(c.id)?.status === "Dominado");

      // 85% chance to pick from non-mastered pool if available
      const pickFromNonMastered = nonMasteredPool.length > 0 && (masteredPool.length === 0 || Math.random() < 0.85);
      const candidatePool = pickFromNonMastered ? nonMasteredPool : (masteredPool.length > 0 ? masteredPool : availablePool);

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
