import type { IChannelRepository } from '../core/ports/repositories/channel.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import type { IVoiceEnginePort } from '../core/ports/voice-engine.port.js';
export declare class ChannelsService {
    private readonly channelRepo;
    private readonly serverRepo;
    private readonly voiceEngine;
    constructor(channelRepo: IChannelRepository, serverRepo: IServerRepository, voiceEngine: IVoiceEnginePort);
    createChannel(serverId: string, userId: string, name: string, type?: 'TEXT' | 'VOICE'): Promise<{
        id: string;
        name: string;
        type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
        serverId: string;
    }>;
    getChannelMessages(channelId: string, userId: string): Promise<any[]>;
    saveChannelMessage(channelId: string, senderId: string, content: string): Promise<any>;
    getVoiceToken(channelId: string, user: {
        sub: string;
        username: string;
    }): Promise<{
        token: string;
    }>;
}
