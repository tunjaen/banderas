import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Fetch 3 distractor option choices for each country
    const allCountries = await prisma.country.findMany({ select: { id: true, name: true, nameEn: true, capital: true, capitalEn: true, isoCode: true } });

    const questions = orderedCountries.map(c => {
      if (!c) return null;
      const distractors = allCountries
        .filter(ac => ac.id !== c.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
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
