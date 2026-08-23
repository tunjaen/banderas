const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Find latest challenge
  const latestChallenge = await prisma.challenge.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      challenger: true,
      challenged: true
    }
  });

  if (!latestChallenge) {
    console.log("No challenges found in database.");
    return;
  }

  console.log("Found latest challenge to delete:");
  console.log(`ID: ${latestChallenge.id}`);
  console.log(`Challenger: ${latestChallenge.challenger?.name} (${latestChallenge.challengerId})`);
  console.log(`Challenged: ${latestChallenge.challenged?.name} (${latestChallenge.challengedId})`);
  console.log(`Status: ${latestChallenge.status}, WinnerId: ${latestChallenge.winnerId}`);

  // Delete latest challenge
  await prisma.challenge.delete({
    where: { id: latestChallenge.id }
  });

  console.log("✅ Successfully deleted latest test challenge.");

  // If this test challenge was completed, decrement test duels counts
  if (latestChallenge.status === "COMPLETED") {
    if (latestChallenge.winnerId === "DRAW") {
      await prisma.user.update({
        where: { id: latestChallenge.challengerId },
        data: {
          duelsDrawn: { decrement: 1 },
          duelsTotal: { decrement: 1 }
        }
      });
      await prisma.user.update({
        where: { id: latestChallenge.challengedId },
        data: {
          duelsDrawn: { decrement: 1 },
          duelsTotal: { decrement: 1 }
        }
      });
    } else if (latestChallenge.winnerId) {
      await prisma.user.update({
        where: { id: latestChallenge.winnerId },
        data: {
          duelsWon: { decrement: 1 },
          duelsTotal: { decrement: 1 }
        }
      });
      const loserId = latestChallenge.winnerId === latestChallenge.challengerId ? latestChallenge.challengedId : latestChallenge.challengerId;
      await prisma.user.update({
        where: { id: loserId },
        data: {
          duelsLost: { decrement: 1 },
          duelsTotal: { decrement: 1 }
        }
      });
    }
    console.log("✅ Reverted stats updated by test challenge.");
  }
}

main()
  .catch(e => {
    console.error("Error deleting test challenge:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
