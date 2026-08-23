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

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, name: true, level: true, xp: true } },
        challenged: { select: { id: true, name: true, level: true, xp: true } }
      }
    });

    if (!challenge) {
      return NextResponse.json({ message: "Reto no encontrado" }, { status: 404 });
    }

    // Parse pre-generated flag ISO sequence
    let isoList: string[] = [];
    try {
      isoList = JSON.parse(challenge.flagSequence);
    } catch (e) {
      isoList = challenge.flagSequence.split(",");
    }

    // Fetch details of countries in the exact sequence order
    const rawCountries = await prisma.country.findMany({
      where: { id: { in: isoList } }
    });

    // Map back to maintain exact isoList sequence
    const countriesMap = new Map(rawCountries.map(c => [c.id, c]));
    const orderedCountries = isoList.map(iso => countriesMap.get(iso)).filter(Boolean);

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

    const questions = orderedCountries.map(c => {
      if (!c) return null;

      // 1. Try picking distractors from same block
      let pool = blockPool.filter(ac => ac.id !== c.id);

      // 2. If block pool has fewer than 3 distractors, supplement from same continent
      if (pool.length < 3) {
        const contPool = allCountries.filter(ac => ac.id !== c.id && ac.continent === c.continent && !pool.some(p => p.id === ac.id));
        pool = [...pool, ...contPool];
      }

      // 3. Fallback to all countries if still fewer than 3
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
      questions
    });
  } catch (error) {
    console.error("Error fetching single challenge:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
