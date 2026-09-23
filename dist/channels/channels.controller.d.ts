import { ChannelsService } from './channels.service.js';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    createChannel(req: any, serverId: string, name: string, type: 'TEXT' | 'VOICE'): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        serverId: string;
        type: string;
    }>;
    getMessages(req: any, channelId: string): Promise<({
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
    getVoiceToken(req: any, channelId: string): Promise<{
        token: string;
    }>;
}
