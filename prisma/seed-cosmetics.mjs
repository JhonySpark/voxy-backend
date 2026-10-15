import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INITIAL_COSMETICS = [
  {
    slug: 'beta-pioneer',
    name: 'Obsidian Pioneer',
    description: 'Moldura lendária concedida exclusivamente aos pioneiros do Beta do Voxy.',
    type: 'AVATAR_FRAME',
    rarity: 'LEGENDARY',
    assetUrl: '/cosmetics/frames/beta-pioneer.svg',
    previewUrl: '/cosmetics/frames/beta-pioneer.svg',
    price: 0,
    isAvailable: false,
    isDefault: false,
    metadata: {
      exclusive: true,
      glowColor: '#34d399',
      animated: true,
      badgeLabel: 'Beta Pioneer',
    },
  },
  {
    slug: 'neon-mint',
    name: 'Neon Mint',
    description: 'Anel minimalista pulsante no verde esmeralda icônico do Voxy.',
    type: 'AVATAR_FRAME',
    rarity: 'COMMON',
    assetUrl: '/cosmetics/frames/neon-mint.svg',
    previewUrl: '/cosmetics/frames/neon-mint.svg',
    price: 0,
    isAvailable: true,
    isDefault: true,
    metadata: {
      glowColor: '#34d399',
      animated: true,
    },
  },
  {
    slug: 'cyber-circuit',
    name: 'Cyber Circuit',
    description: 'Circuitos cibernéticos com iluminação neon ciano futurista.',
    type: 'AVATAR_FRAME',
    rarity: 'COMMON',
    assetUrl: '/cosmetics/frames/cyber-circuit.svg',
    previewUrl: '/cosmetics/frames/cyber-circuit.svg',
    price: 0,
    isAvailable: true,
    isDefault: true,
    metadata: {
      glowColor: '#38bdf8',
      animated: true,
    },
  },
  {
    slug: 'cosmic-violet',
    name: 'Cosmic Violet',
    description: 'Aura mística estelar com gradiente em tons de violeta e magenta.',
    type: 'AVATAR_FRAME',
    rarity: 'COMMON',
    assetUrl: '/cosmetics/frames/cosmic-violet.svg',
    previewUrl: '/cosmetics/frames/cosmic-violet.svg',
    price: 0,
    isAvailable: true,
    isDefault: true,
    metadata: {
      glowColor: '#a855f7',
      animated: true,
    },
  },
];

async function seed() {
  console.log('--- Iniciando Seed de Cosméticos ---');

  // 1. Inserir ou atualizar os 4 cosméticos
  const createdItems = [];
  for (const item of INITIAL_COSMETICS) {
    const upserted = await prisma.cosmeticItem.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        type: item.type,
        rarity: item.rarity,
        assetUrl: item.assetUrl,
        previewUrl: item.previewUrl,
        isAvailable: item.isAvailable,
        isDefault: item.isDefault,
        metadata: item.metadata,
      },
      create: item,
    });
    createdItems.push(upserted);
    console.log(`[Cosmético] ${upserted.slug} (${upserted.rarity}) pronto.`);
  }

  // 2. Conceder molduras para usuários existentes no inventário
  const users = await prisma.user.findMany({
    select: { id: true, username: true, equippedFrameSlug: true },
  });
  console.log(`Total de usuários encontrados para vincular cosméticos: ${users.length}`);

  const defaultItems = createdItems.filter((i) => i.isDefault || i.slug === 'beta-pioneer');

  for (const user of users) {
    // Vincular todos os itens iniciais (incluindo o Beta Pioneer para todos que já existem no Beta)
    for (const item of defaultItems) {
      await prisma.userCosmetic.upsert({
        where: {
          userId_cosmeticItemId: {
            userId: user.id,
            cosmeticItemId: item.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          cosmeticItemId: item.id,
        },
      });
    }
  }

  // 3. Garantir que ninguém comece com moldura equipada forçadamente
  await prisma.user.updateMany({
    data: { equippedFrameSlug: null },
  });
  console.log('Todos os usuários foram atualizados para começar sem moldura equipada (equippedFrameSlug = null).');

  console.log('--- Seed de Cosméticos Finalizado com Sucesso! ---');
}

seed()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
