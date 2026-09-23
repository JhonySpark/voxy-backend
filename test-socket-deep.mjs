import { io } from 'socket.io-client';

async function test() {
  const regRes = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test3@voxy.com', password: '123', username: 'test3' })
  });
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test3@voxy.com', password: '123' })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  const data = await loginRes.json();
  const token = data.access_token;
  
  const serverRes = await fetch('http://localhost:3000/servers', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const servers = await serverRes.json();
  
  // Try to find any text channel
  let channelId = null;
  if (servers.length === 0) {
    const createRes = await fetch('http://localhost:3000/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ name: 'Test Server' })
    });
    const newServer = await createRes.json();
    channelId = newServer.channels.find(c => c.type === 'TEXT').id;
  } else {
    for (const s of servers) {
      const ch = s.channels.find(c => c.type === 'TEXT');
      if (ch) { channelId = ch.id; break; }
    }
  }

  console.log('Got token, connecting to socket... channelId:', channelId);

  const socket = io('http://localhost:3000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected successfully, id:', socket.id);
    
    // Listen to all events
    socket.onAny((eventName, ...args) => {
      console.log('Received event:', eventName, args);
    });

    console.log('Emitting joinChannel');
    socket.emit('joinChannel', { channelId });
    
    setTimeout(() => {
      console.log('Emitting test message...');
      socket.emit('sendChannelMessage', { channelId, content: 'hello from test script' }, (ack) => {
        console.log('Ack from sendChannelMessage:', ack);
      });
    }, 1000);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
  });

  setTimeout(() => {
    console.log('Test timeout');
    process.exit(0);
  }, 5000);
}

test().catch(console.error);
