import { AccessToken } from 'livekit-server-sdk';
const at = new AccessToken('devkey', 'secret', {
  identity: 'user-1',
  name: 'testuser',
});
at.addGrant({ roomJoin: true, room: 'room-1' });
at.toJwt().then(console.log).catch(console.error);
