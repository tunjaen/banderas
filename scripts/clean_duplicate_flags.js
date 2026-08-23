const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const duplicates = ['SJM', 'UMI', 'MAF'];
  
  try {
    console.log("Cleaning up duplicate countries from DB:", duplicates);
    
    // Delete progress records for duplicates first
    await prisma.userProgress.deleteMany({
      where: { countryId: { in: duplicates } }
    });

    // Delete country records
    const deleted = await prisma.country.deleteMany({
      where: { id: { in: duplicates } }
    });
    console.log(`Deleted ${deleted.count} duplicate country records from DB.`);

    // Clean prisma/countries.json
    const jsonPath = 'prisma/countries.json';
    if (fs.existsSync(jsonPath)) {
      const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const filtered = list.filter(c => !duplicates.includes(c.id));
      fs.writeFileSync(jsonPath, JSON.stringify(filtered, null, 2), 'utf8');
      console.log(`Updated ${jsonPath}. Total remaining countries: ${filtered.length}`);
    }

  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
