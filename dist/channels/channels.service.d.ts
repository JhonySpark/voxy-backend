import { PrismaService } from '../prisma/prisma.service.js';
export declare class ChannelsService {
    private prisma;
    constructor(prisma: PrismaService);
    createChannel(serverId: string, userId: string, name: string, type?: 'TEXT' | 'VOICE'): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        serverId: string;
        type: string;
    }>;
    getChannelMessages(channelId: string, userId: string): Promise<({
        sender: {
            id: string;
            username: string;
            email: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        senderId: string;
        channelId: string;
    })[]>;
    saveChannelMessage(channelId: string, senderId: string, content: string): Promise<{
        sender: {
            id: string;
            username: string;
            email: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        senderId: string;
        channelId: string;
    }>;
    getVoiceToken(channelId: string, user: any): Promise<{
        token: string;
    }>;
}
