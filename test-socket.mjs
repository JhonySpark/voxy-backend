import { io } from 'socket.io-client';

async function test() {
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@voxy.com', password: '123456' })
  });
  const data = await loginRes.json();
  const token = data.access_token;
  
  const serverRes = await fetch('http://localhost:3000/servers', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const servers = await serverRes.json();
  const channel = servers[0]?.channels?.find(c => c.type === 'TEXT');

  if (!channel) return console.log('No channel');

  console.log('Got token, connecting to socket... channelId:', channel.id);

  const socket = io('http://localhost:3000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected successfully, id:', socket.id);
    socket.emit('joinChannel', { channelId: channel.id });
    console.log('Emitted joinChannel');
    
    setTimeout(() => {
      console.log('Emitting test message...');
      socket.emit('sendChannelMessage', { channelId: channel.id, content: 'hello from script' });
    }, 1000);
  });

  socket.on('newChannelMessage', (msg) => {
    console.log('Received newChannelMessage:', msg);
    process.exit(0);
  });

  setTimeout(() => {
    console.log('Test timeout');
    process.exit(0);
  }, 5000);
}

test().catch(console.error);
