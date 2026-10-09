import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private channelsService;
    private jwtService;
    private prisma?;
    private logger?;
    server: Server;
    private connectedUsers;
    private userSockets;
    private userStatuses;
    constructor(chatService: ChatService, channelsService: ChannelsService, jwtService: JwtService, prisma?: PrismaService | undefined, logger?: BetterStackLoggerService | undefined);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleMessage(data: {
        receiverId: string;
        content: string;
        attachmentId?: string;
        replyToId?: string;
    }, client: Socket): Promise<any>;
    handleJoinChannel(data: {
        channelId: string;
    }, client: Socket): void;
    handleLeaveChannel(data: {
        channelId: string;
    }, client: Socket): void;
    handleChannelMessage(data: {
        channelId: string;
        content: string;
        attachmentId?: string;
        replyToId?: string;
    }, client: Socket): Promise<any>;
    handleDeleteChannelMessage(data: {
        channelId: string;
        messageId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleEditMessage(data: {
        messageId: string;
        content: string;
    }, client: Socket): Promise<any>;
    handleEditChannelMessage(data: {
        channelId: string;
        messageId: string;
        content: string;
    }, client: Socket): Promise<any>;
    handleToggleMessageReaction(data: {
        messageId: string;
        emoji: string;
    }, client: Socket): Promise<any>;
    handleToggleChannelMessageReaction(data: {
        channelId: string;
        messageId: string;
        emoji: string;
    }, client: Socket): Promise<any>;
    handleServerDeleted(data: {
        serverId: string;
    }, client: Socket): void;
    handleServerMemberAction(data: {
        serverId: string;
        targetUserId?: string;
        targetUserIds?: string[];
        serverName?: string;
    }, client: Socket): void;
    handleServerMembersAdded(data: {
        serverId: string;
        userIds: string[];
        serverName?: string;
    }, client: Socket): void;
    private voiceStates;
    private channelStartTimes;
    private channelServerMap;
    private voiceDisconnectTimeouts;
    handleJoinServer(data: {
        serverId: string;
    }, client: Socket): void;
    handleLeaveServer(data: {
        serverId: string;
    }, client: Socket): void;
    handleFriendAction(data: {
        targetId: string;
        actionType?: string;
        sender?: any;
    }, client: Socket): void;
    handleChannelCreated(data: {
        serverId: string;
    }, client: Socket): void;
    handleServerUpdated(data: {
        serverId: string;
    }, client: Socket): void;
    handleMemberKicked(data: {
        serverId: string;
        targetUserId: string;
        serverName?: string;
    }, client: Socket): void;
    handleMemberBanned(data: {
        serverId: string;
        targetUserId: string;
        reason?: string;
        serverName?: string;
    }, client: Socket): void;
    handleMemberMuted(data: {
        serverId: string;
        targetUserId: string;
        isMuted: boolean;
        mutedReason?: string;
        mutedUntil?: string;
    }, client: Socket): void;
    handleServerSuspended(data: {
        serverId: string;
        reason: string;
    }, client: Socket): void;
    handleAccountSuspended(data: {
        targetUserId: string;
        reason: string;
    }, client: Socket): void;
    handleUserProfileUpdated(data: {
        userId: string;
        displayName?: string | null;
        bio?: string | null;
        avatarUrl?: string | null;
        bannerUrl?: string | null;
        bannerColor?: string | null;
    }, client: Socket): void;
    handleJoinVoice(data: {
        serverId: string;
        channelId: string;
        avatarUrl?: string;
    }, client: Socket): Promise<void>;
    handleLeaveVoice(data: {
        serverId: string;
        channelId: string;
    }, client: Socket): void;
    handleUpdateVoiceMute(data: {
        serverId: string;
        channelId: string;
        isMuted: boolean;
    }, client: Socket): void;
    handleWebrtcSignal(data: {
        to: string;
        signal: any;
    }, client: Socket): void;
    handleGetUserStatuses(client: Socket): void;
    handleUpdateStatus(data: {
        status: string;
        customStatus?: string;
    }, client: Socket): Promise<void>;
}
