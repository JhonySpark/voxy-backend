import { ChannelsService } from './channels.service.js';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    createChannel(req: any, serverId: string, name: string, type: 'TEXT' | 'VOICE'): Promise<{
        id: string;
        name: string;
        type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
        serverId: string;
    }>;
    deleteChannel(req: any, channelId: string): Promise<{
        success: boolean;
    }>;
    renameChannel(req: any, channelId: string, name: string): Promise<{
        id: string;
        name: string;
        type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
        serverId: string;
    }>;
    getMessages(req: any, channelId: string): Promise<any[]>;
    deleteMessage(req: any, channelId: string, messageId: string): Promise<{
        success: boolean;
    }>;
    getVoiceToken(req: any, channelId: string, screen?: string): Promise<{
        token: string;
    }>;
    getVoiceTokenGet(req: any, channelId: string, screen?: string): Promise<{
        token: string;
    }>;
}
