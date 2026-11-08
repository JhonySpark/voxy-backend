require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando registro oficial do cosmético Kitsune...');

  // 1. Upsert do CosmeticItem
  const cosmetic = await prisma.cosmeticItem.upsert({
    where: { slug: 'kitsune' },
    update: {
      name: 'Kitsune',
      description: 'Moldura mística da raposa espiritual guardiã com máscara Kitsune, cerejeiras e folhas sagradas.',
      type: 'AVATAR_FRAME',
      rarity: 'LEGENDARY',
      assetUrl: '/cosmetics/frames/kitsune.svg',
      previewUrl: '/cosmetics/frames/kitsune.svg',
      isAvailable: true,
      price: 0,
    },
    create: {
      slug: 'kitsune',
      name: 'Kitsune',
      description: 'Moldura mística da raposa espiritual guardiã com máscara Kitsune, cerejeiras e folhas sagradas.',
      type: 'AVATAR_FRAME',
      rarity: 'LEGENDARY',
      assetUrl: '/cosmetics/frames/kitsune.svg',
      previewUrl: '/cosmetics/frames/kitsune.svg',
      isAvailable: true,
      price: 0,
    },
  });

  console.log(`Cosmético registrado/atualizado com sucesso! ID: ${cosmetic.id}, Slug: ${cosmetic.slug}, Rarity: ${cosmetic.rarity}`);

  // 2. Liberar para todos os usuários existentes
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  console.log(`Encontrados ${users.length} usuários na base.`);

  let unlockedCount = 0;
  for (const user of users) {
    const existing = await prisma.userCosmetic.findUnique({
      where: {
        userId_cosmeticItemId: {
          userId: user.id,
          cosmeticItemId: cosmetic.id,
        },
      },
    });

    if (!existing) {
      await prisma.userCosmetic.create({
        data: {
          userId: user.id,
          cosmeticItemId: cosmetic.id,
        },
      });
      unlockedCount++;
    }
  }

  console.log(`Kitsune liberada para ${unlockedCount} usuários (total na base: ${users.length}).`);
}

main()
  .catch((err) => {
    console.error('Erro ao registrar Kitsune:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
