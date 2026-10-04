import type { IChannelRepository } from '../core/ports/repositories/channel.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import type { IVoiceEnginePort } from '../core/ports/voice-engine.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class ChannelsService {
    private readonly channelRepo;
    private readonly serverRepo;
    private readonly voiceEngine;
    private readonly prisma;
    constructor(channelRepo: IChannelRepository, serverRepo: IServerRepository, voiceEngine: IVoiceEnginePort, prisma: PrismaService);
    createChannel(serverId: string, userId: string, name: string, type?: 'TEXT' | 'VOICE'): Promise<{
        id: string;
        name: string;
        type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
        serverId: string;
    }>;
    getChannelMessages(channelId: string, userId: string): Promise<any[]>;
    deleteChannel(channelId: string, userId: string): Promise<void>;
    renameChannel(channelId: string, userId: string, name: string): Promise<{
        id: string;
        name: string;
        type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
        serverId: string;
    }>;
    saveChannelMessage(channelId: string, senderId: string, content: string, attachmentId?: string, replyToId?: string): Promise<any>;
    deleteChannelMessage(channelId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    editChannelMessage(channelId: string, messageId: string, userId: string, newContent: string): Promise<any>;
    toggleChannelMessageReaction(channelId: string, messageId: string, userId: string, emoji: string): Promise<any>;
    getVoiceToken(channelId: string, user: {
        sub: string;
        username: string;
    }, isScreen?: boolean): Promise<{
        token: string;
    }>;
}
