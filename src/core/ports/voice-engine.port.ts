export interface CreateVoiceTokenOptions {
  roomName: string;
  participantId: string;
  participantName: string;
}

export interface IVoiceEnginePort {
  generateAccessToken(options: CreateVoiceTokenOptions): Promise<string>;
}

export const VOICE_ENGINE_PORT = Symbol('VOICE_ENGINE_PORT');
