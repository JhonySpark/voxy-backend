import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const msgs = await prisma.channelMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Last messages in DB:', msgs.map(m => m.content));
}

run().catch(console.error).finally(()=>prisma.$disconnect());
