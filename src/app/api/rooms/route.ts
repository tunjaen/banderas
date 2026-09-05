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

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    let body: any = {};
    try { body = await req.json(); } catch (e) {}
    const { scope = "Mundo", totalQuestions = 10 } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true }
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Generate unique 4-character code (e.g. 8K2X)
    let code = generateRoomCode();
    let existing = await prisma.room.findUnique({ where: { code } });
    let attempts = 0;
    while (existing && attempts < 15) {
      code = generateRoomCode();
      existing = await prisma.room.findUnique({ where: { code } });
      attempts++;
    }

    // Fetch all countries
    const allCountries = await prisma.country.findMany({
      select: { id: true, name: true, nameEn: true, capital: true, capitalEn: true, isoCode: true, continent: true }
    });

    // Parse scope (could be comma-separated: "Mundo", "Europa", "Africa_NorthWest,Europe_WestNorth", etc.)
    const scopeItems = scope.split(",").map((s: string) => s.trim()).filter(Boolean);
    let pool = allCountries;
    let useAllCountries = false;

    if (scopeItems.includes("Mundo") || scopeItems.includes("world")) {
      useAllCountries = true;
    }

    if (!useAllCountries) {
      const allowedIDs = new Set<string>();
      const continentNames = ["Europa", "América", "Asia", "África", "Oceanía"];

      for (const item of scopeItems) {
        if (continentNames.includes(item)) {
          // Filter by continent name
          allCountries
            .filter(c => c.continent.toLowerCase().includes(item.toLowerCase()))
            .forEach(c => allowedIDs.add(c.id));
        } else if (item === "Islas") {
          // Island countries by ISO
          allCountries
            .filter(c => ISLAND_COUNTRIES.includes(c.isoCode))
            .forEach(c => allowedIDs.add(c.id));
        } else if (SUBREGIONS[item]) {
          // Subregion block by ISO codes
          allCountries
            .filter(c => SUBREGIONS[item].includes(c.isoCode))
            .forEach(c => allowedIDs.add(c.id));
        } else {
          // Fallback: try continent match
          allCountries
            .filter(c => c.continent.toLowerCase().includes(item.toLowerCase()))
            .forEach(c => allowedIDs.add(c.id));
        }
      }

      if (allowedIDs.size >= 4) {
        pool = allCountries.filter(c => allowedIDs.has(c.id));
      }
    }

    const qCount = Math.min(50, Math.max(5, Number(totalQuestions) || 10));

    // Shuffle pool to generate questions
    const shuffledTargets = [...pool].sort(() => Math.random() - 0.5);
    const selectedTargets: typeof allCountries = [];

    // Cycle if pool is smaller than qCount
    for (let i = 0; i < qCount; i++) {
      selectedTargets.push(shuffledTargets[i % shuffledTargets.length]);
    }

    const questions = selectedTargets.map(c => {
      let distractorsPool = allCountries.filter(ac => ac.id !== c.id && ac.continent === c.continent);
      if (distractorsPool.length < 3) {
        distractorsPool = allCountries.filter(ac => ac.id !== c.id);
      }
      const distractors = [...distractorsPool].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [c, ...distractors].sort(() => Math.random() - 0.5);

      return {
        country: c,
        options,
        claimedBy: null
      };
    });

    // Initial system chat message
    const initialMessages = [
      {
        id: "sys_1",
        senderId: "system",
        senderName: "Sistema",
        text: `⚔️ ¡Sala ${code} creada (${scope} • ${qCount} preguntas)! Invita a tus amigos usando este código. ¡Ponte en verde cuando estés listo!`,
        emoji: "🔥",
        timestamp: Date.now()
      }
    ];

    const room = await prisma.room.create({
      data: {
        code,
        hostId: userId,
        scope,
        status: "WAITING",
        maxPlayers: 4,
        currentQuestionIndex: 0,
        totalQuestions: qCount,
        flagSequence: JSON.stringify(questions),
        messagesJson: JSON.stringify(initialMessages),
        players: {
          create: {
            userId,
            name: user.name || "Jugador Host",
            image: user.image,
            isReady: true,
            isHost: true,
            score: 0
          }
        }
      },
      include: {
        players: true
      }
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ message: "Error al crear la sala" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        status: "WAITING"
      },
      include: {
        players: true
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ message: "Error al listar salas" }, { status: 500 });
  }
}
