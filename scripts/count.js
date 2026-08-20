const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.country.count().then(count => console.log('Total countries:', count)).finally(() => prisma.$disconnect());
