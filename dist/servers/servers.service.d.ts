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
    getUserPermissions(serverId: string, userId: string): Promise<{
        role: string;
        canInvite: any;
        canDeleteMessages: any;
        canKickMembers: any;
        canBanMembers: any;
        canManageChannels: any;
        canManageServer: any;
    }>;
    addMembers(serverId: string, requesterUserId: string, targetUserIds: string[]): Promise<{
        added: string[];
        success: boolean;
    }>;
    deleteServer(serverId: string, requesterUserId: string): Promise<{
        success: boolean;
    }>;
    getServerMembers(serverId: string, requesterUserId: string): Promise<any[]>;
    updateMemberRole(serverId: string, requesterUserId: string, targetUserId: string, newRole: string): Promise<{
        success: boolean;
        role: string;
    }>;
    kickMember(serverId: string, requesterUserId: string, targetUserId: string): Promise<{
        success: boolean;
    }>;
    banMember(serverId: string, requesterUserId: string, targetUserId: string, reason?: string): Promise<{
        success: boolean;
    }>;
    unbanMember(serverId: string, requesterUserId: string, targetUserId: string): Promise<{
        success: boolean;
    }>;
    getServerBans(serverId: string, requesterUserId: string): Promise<any[]>;
    getRolePermissions(serverId: string, requesterUserId: string): Promise<any[]>;
    updateRolePermissions(serverId: string, requesterUserId: string, role: string, permissions: any): Promise<any>;
}
