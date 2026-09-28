import { describe, it, expect, vi } from 'vitest';
import { LivekitVoiceAdapter } from './livekit-voice.adapter.js';

const mockAddGrant = vi.fn();
const mockToJwt = vi.fn().mockResolvedValue('mock_livekit_token');

vi.mock('livekit-server-sdk', () => {
  return {
    AccessToken: class {
      constructor(public apiKey: string, public apiSecret: string, public options: any) {}
      addGrant = mockAddGrant;
      toJwt = mockToJwt;
    },
  };
});

describe('LivekitVoiceAdapter', () => {
  const adapter = new LivekitVoiceAdapter();

  it('should generate access token for livekit room', async () => {
    const token = await adapter.generateAccessToken({
      roomName: 'room-1',
      participantId: 'p-1',
      participantName: 'Alice',
    });

    expect(mockAddGrant).toHaveBeenCalledWith({ roomJoin: true, room: 'room-1' });
    expect(mockToJwt).toHaveBeenCalled();
    expect(token).toBe('mock_livekit_token');
  });
});
