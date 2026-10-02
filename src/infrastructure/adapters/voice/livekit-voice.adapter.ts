import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { CreateVoiceTokenOptions, IVoiceEnginePort } from '../../../core/ports/voice-engine.port.js';

@Injectable()
export class LivekitVoiceAdapter implements IVoiceEnginePort {
  async generateAccessToken(options: CreateVoiceTokenOptions): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: options.participantId,
      name: options.participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: options.roomName,
      canUpdateOwnMetadata: options.canUpdateOwnMetadata === true,
    });

    return at.toJwt();
  }
}
