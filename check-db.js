const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const msgs = await prisma.channelMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log(msgs);
}

run().catch(console.error).finally(()=>prisma.$disconnect());
