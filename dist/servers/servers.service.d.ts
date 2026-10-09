import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecurityAuditService } from '../moderation/security-audit.service.js';
export declare class ServersService {
    private readonly serverRepo;
    private readonly prisma;
    private readonly auditService;
    constructor(serverRepo: IServerRepository, prisma: PrismaService, auditService: SecurityAuditService);
    private generateInviteCode;
    createServer(ownerId: string, name: string, is18Plus?: boolean, iconUrl?: string, iconKey?: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        is18Plus: boolean;
        iconUrl: any;
        iconKey: any;
        inviteCode: string | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../core/enums/server-role.enum.js").ServerRoleEnum;
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
        is18Plus: boolean;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../core/enums/server-role.enum.js").ServerRoleEnum;
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
        is18Plus: boolean;
        isSuspended: boolean;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
            serverId: string;
        }[];
    }[]>;
    getServerById(serverId: string, userId: string): Promise<{
        id: string;
        name: string;
        ownerId: string;
        is18Plus: boolean;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../core/enums/server-role.enum.js").ServerRoleEnum;
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
        is18Plus: boolean;
        iconUrl: string | null;
        iconKey: string | null | undefined;
        inviteCode: string | undefined;
        channels: {
            id: string;
            name: string;
            type: import("../core/enums/channel-type.enum.js").ChannelTypeEnum;
            serverId: string;
        }[];
        members: {
            id: string;
            userId: string;
            role: import("../core/enums/server-role.enum.js").ServerRoleEnum;
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
        canMuteMembers: any;
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
    leaveServer(serverId: string, userId: string): Promise<{
        success: boolean;
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
    muteMember(serverId: string, requesterUserId: string, targetUserId: string, reason?: string, durationMinutes?: number): Promise<{
        success: boolean;
        isMuted: boolean;
        mutedUntil: Date | undefined;
    }>;
    unmuteMember(serverId: string, requesterUserId: string, targetUserId: string): Promise<{
        success: boolean;
        isMuted: boolean;
    }>;
    getServerAuditLogs(serverId: string, requesterUserId: string, filter: any): Promise<{
        logs: import("../core/ports/repositories/security-audit-log.repository.port.js").SecurityAuditLogWithActor[];
        total: number;
    }>;
}
