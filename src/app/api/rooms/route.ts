import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Fetch pool of countries according to scope
    const allCountries = await prisma.country.findMany({
      select: { id: true, name: true, nameEn: true, capital: true, capitalEn: true, isoCode: true, continent: true }
    });

    let pool = allCountries;
    if (scope && scope !== "Mundo" && scope !== "world") {
      const filtered = allCountries.filter(c => c.continent.toLowerCase().includes(scope.toLowerCase()));
      if (filtered.length >= 4) {
        pool = filtered;
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
