const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.country.findFirst({where: {name: {contains: 'Andorra'}}});
  console.log("DB Result:", c);
  
  // also check GeoJSON
  const fs = require('fs');
  // I don't have the geojson locally, wait I'll just check DB.
}
main().finally(() => prisma.$disconnect());
