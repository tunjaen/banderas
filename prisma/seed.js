const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, 'countries.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const countries = JSON.parse(rawData);

  console.log(`Seeding ${countries.length} countries...`);

  for (const country of countries) {
    if (country.id === 'ISR') continue; // Ensure Israel is not seeded

    await prisma.country.upsert({
      where: { id: country.id },
      update: {
        nameEn: country.nameEn || "",
        continentEn: country.continentEn || "",
        capitalEn: country.capitalEn || "",
      },
      create: {
        id: country.id,
        name: country.name,
        nameEn: country.nameEn || "",
        continent: country.continent,
        continentEn: country.continentEn || "",
        capital: country.capital,
        capitalEn: country.capitalEn || "",
        isoCode: country.isoCode,
        lat: country.lat,
        lng: country.lng,
      },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
