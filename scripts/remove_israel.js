const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const deleted = await prisma.country.deleteMany({
      where: {
        id: 'ISR'
      }
    });
    console.log(`Deleted ${deleted.count} country (ISR).`);
  } catch (e) {
    console.error("Error or already deleted:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
