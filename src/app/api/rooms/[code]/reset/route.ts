import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ISLAND_COUNTRIES = ["ABW","ASM","ATG","AUS","BHS","SHN","BMU","BRB","CCK","COK","COM","CPV","CUB","CUW","CXR","CYM","CYP","DMA","DOM","FJI","FLK","FSM","GBR","GGY","GLP","GRL","GUM","HTI","IDN","IMN","IRL","ISL","JAM","JEY","JPN","KIR","KNA","LCA","LKA","MDG","MDV","MHL","MLT","MNP","MSR","MTQ","MUS","MYT","NCL","NIU","NRU","NZL","PCN","PHL","PNG","PRI","PYF","REU","SGP","SLB","SPM","STP","SXM","SYC","TKL","TLS","TON","TTO","TUV","TWN","VGB","VIR","VUT","WLF","WSM"];

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

export async function generateQuestionSequence(scope: string, totalQuestions: number) {
  const allCountries = await prisma.country.findMany({
    select: { id: true, name: true, nameEn: true, capital: true, capitalEn: true, isoCode: true, continent: true }
  });

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
        allCountries
          .filter(c => c.continent.toLowerCase().includes(item.toLowerCase()))
          .forEach(c => allowedIDs.add(c.id));
      } else if (item === "Islas") {
        allCountries
          .filter(c => ISLAND_COUNTRIES.includes(c.isoCode))
          .forEach(c => allowedIDs.add(c.id));
      } else if (SUBREGIONS[item]) {
        allCountries
          .filter(c => SUBREGIONS[item].includes(c.isoCode))
          .forEach(c => allowedIDs.add(c.id));
      } else {
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
  const shuffledTargets = [...pool].sort(() => Math.random() - 0.5);
  const selectedTargets: typeof allCountries = [];

  for (let i = 0; i < qCount; i++) {
    selectedTargets.push(shuffledTargets[i % shuffledTargets.length]);
  }

  return selectedTargets.map(c => {
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
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { code } = await params;
    const cleanCode = code.trim().toUpperCase();

    const room = await prisma.room.findUnique({
      where: { code: cleanCode },
      include: { players: true }
    });

    if (!room) {
      return NextResponse.json({ message: "Sala no encontrada" }, { status: 404 });
    }

    const isParticipant = room.players.some(p => p.userId === userId);
    if (!isParticipant) {
      return NextResponse.json({ message: "No pertences a esta sala" }, { status: 403 });
    }

    // Regenerate flag sequence for fresh round
    const newQuestions = await generateQuestionSequence(room.scope, room.totalQuestions);

    let messages: any[] = [];
    try { messages = JSON.parse(room.messagesJson); } catch (e) {}
    messages.push({
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "Sistema",
      text: "🔄 La partida ha finalizado. La sala se ha reiniciado. ¡Ponte en verde cuando estés listo!",
      emoji: "🔁",
      timestamp: Date.now()
    });

    // Reset scores & ready states in room players
    await prisma.roomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        score: 0,
        isReady: false,
        lastAnsweredQuestionIndex: -1
      }
    });

    // Ensure Host player is ready if desired or keep unready
    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        status: "WAITING",
        currentQuestionIndex: 0,
        winnerId: null,
        flagSequence: JSON.stringify(newQuestions),
        messagesJson: JSON.stringify(messages)
      },
      include: { players: true }
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error("Error resetting room:", error);
    return NextResponse.json({ message: "Error al reiniciar sala" }, { status: 500 });
  }
}
