import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class ServersService {
    private readonly serverRepo;
    private readonly prisma;
    constructor(serverRepo: IServerRepository, prisma: PrismaService);
    private generateInviteCode;
    createServer(ownerId: string, name: string, iconUrl?: string, iconKey?: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: any;
        iconKey: any;
        inviteCode: string | undefined;
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
    updateServer(userId: string, serverId: string, data: {
        name?: string;
        iconUrl?: string;
        iconKey?: string;
    }): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
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
    getUserServers(userId: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../modules/servers/domain/value-objects/channel-type.vo.js").ChannelTypeValue;
            serverId: string;
        }[];
    }[]>;
    getServerById(serverId: string, userId: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
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
    joinServer(inviteCode: string, userId: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
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
