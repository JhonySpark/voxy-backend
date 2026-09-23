async function test() {
  try {
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: '123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
    
    if (loginData.access_token) {
      const tokenRes = await fetch('http://localhost:3000/channels/1/voice-token', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + loginData.access_token
        }
      });
      console.log('Token fetch status:', tokenRes.status);
      const tokenData = await tokenRes.json();
      console.log('Token Data:', tokenData);
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}
test();
