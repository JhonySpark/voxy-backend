require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.cosmeticItem.findMany();
  console.log('Cosmetic items in DB (' + items.length + '):');
  items.forEach(i => {
    console.log(`- Slug: "${i.slug}" | Name: "${i.name}" | Rarity: ${i.rarity} | AssetUrl: "${i.assetUrl}"`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
