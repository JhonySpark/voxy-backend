const token = 'fake-jwt';
fetch('http://localhost:3000/channels/1/voice-token', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}).then(res => res.text()).then(console.log).catch(console.error);
