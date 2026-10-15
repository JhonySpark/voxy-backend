import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_USER_ID = 'b62f0902-38e3-48a6-af00-c464c56072b4';

async function run() {
  console.log('--- Iniciando limpeza de cosméticos ---');

  // 1. Remover propriedade de todas as molduras de todos os usuários, EXCETO o admin
  const deletedUserCosmetics = await prisma.userCosmetic.deleteMany({
    where: {
      userId: { not: ADMIN_USER_ID },
    },
  });
  console.log(`Removidas ${deletedUserCosmetics.count} entradas de cosméticos de outros usuários.`);

  // 2. Desequipar molduras de todos os outros usuários
  const unequippedUsers = await prisma.user.updateMany({
    where: {
      id: { not: ADMIN_USER_ID },
    },
    data: {
      equippedFrameSlug: null,
    },
  });
  console.log(`Desequipadas molduras de ${unequippedUsers.count} outros usuários.`);

  // 3. Garantir que o usuário admin tenha todos os 4 cosméticos em seu inventário
  const allCosmetics = await prisma.cosmeticItem.findMany();
  for (const item of allCosmetics) {
    await prisma.userCosmetic.upsert({
      where: {
        userId_cosmeticItemId: {
          userId: ADMIN_USER_ID,
          cosmeticItemId: item.id,
        },
      },
      update: {},
      create: {
        userId: ADMIN_USER_ID,
        cosmeticItemId: item.id,
      },
    });
  }
  console.log(`Garantidos ${allCosmetics.length} itens no inventário do admin ${ADMIN_USER_ID}.`);

  // 4. Atualizar o item 'beta-pioneer' para ser a moldura lendária Sovereign Spikes
  await prisma.cosmeticItem.updateMany({
    where: { slug: 'beta-pioneer' },
    data: {
      name: 'Sovereign Spikes',
      description: 'Moldura lendária de prestígio supremo com chassi de obsidiana, coroa imperial e órbitas astrais. Concedida exclusivamente pela administração.',
      rarity: 'LEGENDARY',
      assetUrl: '/cosmetics/frames/beta-pioneer.svg',
      previewUrl: '/cosmetics/frames/beta-pioneer.svg',
      isDefault: false,
      isAvailable: false,
    },
  });

  // 5. Configurar as outras molduras com isDefault = false para ninguém receber automaticamente
  await prisma.cosmeticItem.updateMany({
    where: { slug: { in: ['neon-mint', 'cyber-circuit', 'cosmic-violet'] } },
    data: {
      isDefault: false,
      rarity: 'COMMON',
    },
  });

  console.log('--- Limpeza e sincronização concluída com sucesso! ---');
}

run()
  .catch((e) => {
    console.error('Erro na execução:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
