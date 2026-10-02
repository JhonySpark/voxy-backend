export interface CreateVoiceTokenOptions {
  roomName: string;
  participantId: string;
  participantName: string;
  canUpdateOwnMetadata?: boolean;
}

export interface IVoiceEnginePort {
  generateAccessToken(options: CreateVoiceTokenOptions): Promise<string>;
}

export const VOICE_ENGINE_PORT = Symbol('VOICE_ENGINE_PORT');
