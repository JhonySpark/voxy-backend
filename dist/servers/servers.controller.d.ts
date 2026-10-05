import { ServersService } from './servers.service.js';
export declare class ServersController {
    private readonly serversService;
    constructor(serversService: ServersService);
    createServer(req: any, name: string, is18Plus?: boolean, iconUrl?: string, iconKey?: string): Promise<{
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
    updateServer(req: any, serverId: string, body: {
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
    getUserServers(req: any): Promise<{
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
    joinServer(req: any, inviteCode: string): Promise<{
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
    getServerById(req: any, id: string): Promise<{
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
    deleteServer(req: any, serverId: string): Promise<{
        success: boolean;
    }>;
    getServerMembers(req: any, serverId: string): Promise<any[]>;
    addMembers(req: any, serverId: string, userIds: string[]): Promise<{
        added: string[];
        success: boolean;
    }>;
    updateMemberRole(req: any, serverId: string, targetUserId: string, role: string): Promise<{
        success: boolean;
        role: string;
    }>;
    kickMember(req: any, serverId: string, targetUserId: string): Promise<{
        success: boolean;
    }>;
    muteMember(req: any, serverId: string, targetUserId: string, reason?: string, durationMinutes?: number): Promise<{
        success: boolean;
        isMuted: boolean;
        mutedUntil: Date | undefined;
    }>;
    unmuteMember(req: any, serverId: string, targetUserId: string): Promise<{
        success: boolean;
        isMuted: boolean;
    }>;
    getServerBans(req: any, serverId: string): Promise<any[]>;
    banMember(req: any, serverId: string, targetUserId: string, reason?: string): Promise<{
        success: boolean;
    }>;
    unbanMember(req: any, serverId: string, targetUserId: string): Promise<{
        success: boolean;
    }>;
    getRolePermissions(req: any, serverId: string): Promise<any[]>;
    updateRolePermissions(req: any, serverId: string, role: string, permissions: any): Promise<any>;
    getMyPermissions(req: any, serverId: string): Promise<{
        role: string;
        canInvite: any;
        canDeleteMessages: any;
        canKickMembers: any;
        canBanMembers: any;
        canMuteMembers: any;
        canManageChannels: any;
        canManageServer: any;
    }>;
}
