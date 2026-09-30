import { ServersService } from './servers.service.js';
export declare class ServersController {
    private readonly serversService;
    constructor(serversService: ServersService);
    createServer(req: any, name: string, iconUrl?: string, iconKey?: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: any;
        iconKey: any;
        channels: {
            id: string;
            name: string;
            type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../modules/servers/domain/value-objects/server-role.vo.js").ServerRoleType;
            serverId: string;
        }[];
    }>;
    updateServer(req: any, serverId: string, body: {
        name?: string;
        iconUrl?: string;
        iconKey?: string;
    }): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../modules/servers/domain/value-objects/server-role.vo.js").ServerRoleType;
            serverId: string;
            user: {
                id: string;
                username: string;
            };
        }[];
    }>;
    getUserServers(req: any): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
            serverId: string;
        }[];
    }[]>;
    getServerById(req: any, id: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../modules/servers/domain/value-objects/server-role.vo.js").ServerRoleType;
            serverId: string;
            user: {
                id: string;
                username: string;
            };
        }[];
    }>;
    joinServer(req: any, inviteCode: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../modules/servers/domain/value-objects/server-role.vo.js").ServerRoleType;
            serverId: string;
            user: {
                id: string;
                username: string;
            };
        }[];
    }>;
}
