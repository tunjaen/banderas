import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        continent: true,
        continentEn: true,
        capital: true,
        capitalEn: true,
        isoCode: true,
        lat: true,
        lng: true,
      }
    });

    let userProgressMap: Record<string, string> = {};
    if (userId) {
      const progress = await prisma.userProgress.findMany({
        where: { userId },
        select: { countryId: true, status: true }
      });
      progress.forEach(p => {
        userProgressMap[p.countryId] = p.status;
      });
    }

    const result = countries.map(c => ({
      ...c,
      status: userProgressMap[c.id] || "Nuevo"
    }));

    return NextResponse.json({ countries: result });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
