const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/auth/login', {
      email: 'test@test.com', 
      password: '123'
    });
    console.log('Login:', loginRes.data);
  } catch (e) {
    console.error('Login failed:', e.response?.data || e.message);
  }
}
test();
