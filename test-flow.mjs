import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  let user = await prisma.user.findUnique({ where: { email: 'test@voxy.com' }});
  if (!user) {
    const passwordHash = await bcrypt.hash('123456', 10);
    user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@voxy.com',
        passwordHash,
      }
    });
  }
  
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@voxy.com', password: '123456' })
  });
  
  const loginData = await loginRes.json();
  console.log('Login token:', loginData.access_token);
  
  if (loginData.access_token) {
    // let's try to fetch a random channel token
    // first find any channel
    const channel = await prisma.channel.findFirst();
    if (channel) {
      const res = await fetch(`http://localhost:3000/channels/${channel.id}/voice-token`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + loginData.access_token
        }
      });
      console.log('Voice Token Status:', res.status);
      console.log('Voice Token Body:', await res.text());
    } else {
      console.log('No channels exist to test.');
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
