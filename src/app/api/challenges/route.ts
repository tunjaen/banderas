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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { challengedId: userId }
        ]
      },
      include: {
        challenger: {
          select: { id: true, name: true, level: true, xp: true }
        },
        challenged: {
          select: { id: true, name: true, level: true, xp: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const userChallenges = challenges.filter(c => {
      const isChallenger = c.challengerId === userId;
      const isChallenged = c.challengedId === userId;
      if (isChallenger && c.hiddenByChallenger) return false;
      if (isChallenged && c.hiddenByChallenged) return false;
      return true;
    });

    const formattedChallenges = userChallenges.map(c => {
      let cAcc = c.challengerAccuracy;
      let rAcc = c.challengedAccuracy;
      let cDominated = c.challengerScore || 0;
      let rDominated = c.challengedScore || 0;

      let isoList: string[] = [];
      try { isoList = JSON.parse(c.flagSequence); } catch (e) {}
      const totalTerritoryCount = isoList.length || c.targetScore || 1;

      if (c.gameMode === "LIGHTNING") {
        if (c.challengerDone && c.challengerScore !== null) {
          cAcc = Math.min(100, Math.max(0, (c.challengerScore / totalTerritoryCount) * 100));
        } else {
          cAcc = null;
        }

        if (c.challengedDone && c.challengedScore !== null) {
          rAcc = Math.min(100, Math.max(0, (c.challengedScore / totalTerritoryCount) * 100));
        } else {
          rAcc = null;
        }
      } else if (c.gameMode === "DOMINATION") {
        let cTotalAttempts = 0;
        let rTotalAttempts = 0;

        if (c.challengerProgressJson) {
          try {
            const cData = JSON.parse(c.challengerProgressJson);
            cTotalAttempts = (cData.correctCount || 0) + (cData.wrongCount || 0);
            cDominated = cData.dominatedCount ?? (cData.hits ? Object.keys(cData.hits).filter(k => cData.hits[k] >= 3).length : cDominated);
            if (cTotalAttempts > 0) {
              cAcc = (cData.correctCount / cTotalAttempts) * 100;
            } else {
              cAcc = null;
            }
          } catch (e) {}
        } else {
          cAcc = null;
        }

        if (c.challengedProgressJson) {
          try {
            const rData = JSON.parse(c.challengedProgressJson);
            rTotalAttempts = (rData.correctCount || 0) + (rData.wrongCount || 0);
            rDominated = rData.dominatedCount ?? (rData.hits ? Object.keys(rData.hits).filter(k => rData.hits[k] >= 3).length : rDominated);
            if (rTotalAttempts > 0) {
              rAcc = (rData.correctCount / rTotalAttempts) * 100;
            } else {
              rAcc = null;
            }
          } catch (e) {}
        } else {
          rAcc = null;
        }
      }

      const cTerritoryPct = Math.min(100, Math.round((cDominated / totalTerritoryCount) * 100));
      const rTerritoryPct = Math.min(100, Math.round((rDominated / totalTerritoryCount) * 100));

      return {
        ...c,
        totalTerritoryCount,
        challengerDominatedCount: cDominated,
        challengedDominatedCount: rDominated,
        challengerTerritoryPct: cTerritoryPct,
        challengedTerritoryPct: rTerritoryPct,
        challengerAccuracy: cAcc,
        challengedAccuracy: rAcc
      };
    });

    const pendingReceived = formattedChallenges.filter(
      c => c.challengedId === userId && c.status === "PENDING" && !c.challengedDone
    );

    const active = formattedChallenges.filter(
      c => c.status !== "DECLINED" && c.status !== "COMPLETED" && !(c.challengerDone && c.challengedDone) && !(c.challengedId === userId && c.status === "PENDING" && !c.challengedDone)
    );

    const completed = formattedChallenges.filter(
      c => c.status === "COMPLETED" || (c.challengerDone && c.challengedDone)
    );

    return NextResponse.json({
      pendingCount: pendingReceived.length,
      challenges: formattedChallenges,
      pending: pendingReceived,
      active,
      completed
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { challengedId, gameMode = "LIGHTNING", scopeType = "subregion_multi", scopeValues = "Europe_East", targetScore = 10 } = body;

    if (!challengedId) {
      return NextResponse.json({ message: "Jugador retado requerido" }, { status: 400 });
    }

    if (challengedId === userId) {
      return NextResponse.json({ message: "No puedes retarte a ti mismo" }, { status: 400 });
    }

    // Filter candidate countries based on scopeValues
    const items = scopeValues.split(",").map((s: string) => s.trim());
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

    let countries: { id: string }[] = [];
    if (useAllCountries) {
      countries = await prisma.country.findMany({ select: { id: true } });
    } else if (allowedISOs.size > 0) {
      countries = await prisma.country.findMany({
        where: { id: { in: Array.from(allowedISOs) } },
        select: { id: true }
      });
    }

    // Only fallback if filter returned 0 countries
    if (countries.length === 0) {
      countries = await prisma.country.findMany({
        select: { id: true }
      });
    }

    // Shuffle countries
    const shuffled = [...countries].sort(() => Math.random() - 0.5);
    
    // Select flag count sequence
    const countToTake = (gameMode === "MARATHON" || gameMode === "DOMINATION") ? shuffled.length : Math.min(targetScore, shuffled.length);
    const selectedISOs = shuffled.slice(0, countToTake).map(c => c.id);

    const initialProgressJson = JSON.stringify({ hits: {}, correctCount: 0, wrongCount: 0 });

    // Create Challenge record
    const challenge = await prisma.challenge.create({
      data: {
        challengerId: userId,
        challengedId,
        gameMode,
        scopeType,
        scopeValues,
        targetScore: countToTake,
        flagSequence: JSON.stringify(selectedISOs),
        challengerProgressJson: initialProgressJson,
        challengedProgressJson: initialProgressJson,
        status: "PENDING"
      },
      include: {
        challenger: { select: { id: true, name: true } },
        challenged: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ message: "Error al crear el reto" }, { status: 500 });
  }
}
