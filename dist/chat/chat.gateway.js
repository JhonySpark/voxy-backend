var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, } from '@nestjs/websockets';
import { Optional } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';
let ChatGateway = class ChatGateway {
    chatService;
    channelsService;
    jwtService;
    prisma;
    logger;
    server;
    connectedUsers = new Map();
    userSockets = new Map();
    userStatuses = new Map();
    constructor(chatService, channelsService, jwtService, prisma, logger) {
        this.chatService = chatService;
        this.channelsService = channelsService;
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.logger = logger;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'secretKey',
            });
            const userId = payload.sub;
            client.data.user = payload;
            this.connectedUsers.set(userId, client.id);
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);
            client.join(userId);
            let userStatus = 'ONLINE';
            let customStatus = undefined;
            const existingStatus = this.userStatuses.get(userId);
            if (existingStatus && existingStatus.status !== 'OFFLINE') {
                userStatus = existingStatus.status;
                customStatus = existingStatus.customStatus;
            }
            this.userStatuses.set(userId, { status: userStatus, customStatus });
            this.server.emit('userStatusUpdate', {
                userId,
                status: userStatus,
                customStatus,
            });
            const allStatuses = {};
            for (const [uid, s] of this.userStatuses.entries()) {
                allStatuses[uid] = s;
            }
            client.emit?.('allUserStatuses', allStatuses);
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data.user) {
            const userId = client.data.user.sub;
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                    this.connectedUsers.delete(userId);
                    this.userStatuses.set(userId, { status: 'OFFLINE' });
                    this.server.emit('userStatusUpdate', {
                        userId,
                        status: 'OFFLINE',
                    });
                }
            }
            else {
                this.connectedUsers.delete(userId);
            }
            for (const [channelId, participants] of this.voiceStates.entries()) {
                if (participants.has(client.id)) {
                    const user = participants.get(client.id);
                    const serverId = user?.serverId;
                    participants.delete(client.id);
                    if (participants.size === 0) {
                        this.voiceStates.delete(channelId);
                        this.channelStartTimes.delete(channelId);
                    }
                    if (serverId) {
                        this.server.to(`server-${serverId}`).emit('serverVoiceUpdate', {
                            channelId,
                            participants: Array.from(participants.values()),
                            startedAt: this.channelStartTimes.get(channelId)
                        });
                    }
                }
            }
        }
    }
    async handleMessage(data, client) {
        const senderId = client.data.user.sub;
        const message = await this.chatService.saveMessage(senderId, data.receiverId, data.content, data.attachmentId, data.replyToId);
        this.server.to(data.receiverId).emit('newMessage', message);
        client.emit('messageSent', message);
        return message;
    }
    handleJoinChannel(data, client) {
        client.join(data.channelId);
    }
    handleLeaveChannel(data, client) {
        client.leave(data.channelId);
    }
    async handleChannelMessage(data, client) {
        const senderId = client.data.user.sub;
        try {
            const message = await this.channelsService.saveChannelMessage(data.channelId, senderId, data.content, data.attachmentId, data.replyToId);
            client.emit('channelMessageSent', message);
            client.to(data.channelId).emit('newChannelMessage', message);
            return message;
        }
        catch (e) {
            return { error: 'Unauthorized' };
        }
    }
    async handleDeleteChannelMessage(data, client) {
        const senderId = client.data.user.sub;
        try {
            await this.channelsService.deleteChannelMessage(data.channelId, data.messageId, senderId);
            this.server.to(data.channelId).emit('channelMessageDeleted', {
                channelId: data.channelId,
                messageId: data.messageId,
            });
            client.emit('channelMessageDeleted', {
                channelId: data.channelId,
                messageId: data.messageId,
            });
            return { success: true };
        }
        catch (e) {
            return { error: e.message || 'Unauthorized' };
        }
    }
    async handleEditMessage(data, client) {
        const senderId = client.data.user.sub;
        try {
            const updated = await this.chatService.editDirectMessage(data.messageId, senderId, data.content);
            this.server.to(updated.receiverId).emit('messageUpdated', updated);
            client.emit('messageUpdated', updated);
            return updated;
        }
        catch (e) {
            return { error: e.message || 'Unauthorized' };
        }
    }
    async handleEditChannelMessage(data, client) {
        const senderId = client.data.user.sub;
        try {
            const updated = await this.channelsService.editChannelMessage(data.channelId, data.messageId, senderId, data.content);
            this.server.to(data.channelId).emit('channelMessageUpdated', updated);
            client.emit('channelMessageUpdated', updated);
            return updated;
        }
        catch (e) {
            return { error: e.message || 'Unauthorized' };
        }
    }
    async handleToggleMessageReaction(data, client) {
        const userId = client.data.user.sub;
        try {
            const updated = await this.chatService.toggleReaction(data.messageId, userId, data.emoji);
            this.server.to(updated.receiverId).emit('messageReactionUpdated', updated);
            this.server.to(updated.senderId).emit('messageReactionUpdated', updated);
            client.emit('messageReactionUpdated', updated);
            return updated;
        }
        catch (e) {
            return { error: e.message || 'Error' };
        }
    }
    async handleToggleChannelMessageReaction(data, client) {
        const userId = client.data.user.sub;
        try {
            const updated = await this.channelsService.toggleChannelMessageReaction(data.channelId, data.messageId, userId, data.emoji);
            this.server.to(data.channelId).emit('channelMessageReactionUpdated', updated);
            client.emit('channelMessageReactionUpdated', updated);
            return updated;
        }
        catch (e) {
            return { error: e.message || 'Error' };
        }
    }
    handleServerDeleted(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverDeleted', { serverId: data.serverId });
        this.server.emit('serverDeleted', { serverId: data.serverId });
    }
    handleServerMemberAction(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverUpdated');
        this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
        if (data.targetUserId) {
            this.server.to(data.targetUserId).emit('serverMembershipChanged', { serverId: data.serverId });
        }
    }
    voiceStates = new Map();
    channelStartTimes = new Map();
    handleJoinServer(data, client) {
        client.join(`server-${data.serverId}`);
        for (const [channelId, participantsMap] of this.voiceStates.entries()) {
            const participants = Array.from(participantsMap.values());
            if (participants.length > 0 && participants[0].serverId === data.serverId) {
                client.emit('serverVoiceUpdate', {
                    channelId,
                    participants,
                    startedAt: this.channelStartTimes.get(channelId)
                });
            }
        }
    }
    handleLeaveServer(data, client) {
        client.leave(`server-${data.serverId}`);
    }
    handleFriendAction(data, client) {
        this.server.to(data.targetId).emit('friendActionUpdate');
    }
    handleChannelCreated(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverUpdated');
    }
    handleServerUpdated(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverUpdated');
    }
    handleMemberKicked(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
        this.server.to(data.targetUserId).emit('memberKicked', { serverId: data.serverId });
    }
    handleMemberBanned(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
        this.server.to(data.targetUserId).emit('memberBanned', { serverId: data.serverId, reason: data.reason });
    }
    handleMemberMuted(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverMemberMuted', data);
        this.server.to(data.targetUserId).emit('serverMemberMuted', data);
    }
    handleServerSuspended(data, client) {
        this.server.to(`server-${data.serverId}`).emit('serverSuspended', data);
    }
    handleAccountSuspended(data, client) {
        this.server.to(data.targetUserId).emit('accountSuspended', data);
    }
    handleUserProfileUpdated(data, client) {
        const userId = client.data?.user?.sub || data.userId;
        this.server.emit('userProfileUpdated', { ...data, userId });
        for (const [channelId, participants] of this.voiceStates.entries()) {
            let changed = false;
            let targetServerId = null;
            for (const user of participants.values()) {
                if (user.userId === userId) {
                    if (data.avatarUrl !== undefined)
                        user.avatarUrl = data.avatarUrl;
                    if (data.displayName !== undefined)
                        user.displayName = data.displayName;
                    changed = true;
                    targetServerId = user.serverId;
                }
            }
            if (changed && targetServerId) {
                this.server.to(`server-${targetServerId}`).emit('serverVoiceUpdate', {
                    channelId,
                    participants: Array.from(participants.values()),
                    startedAt: this.channelStartTimes.get(channelId),
                });
            }
        }
    }
    async handleJoinVoice(data, client) {
        client.join(`voice-${data.channelId}`);
        if (!this.voiceStates.has(data.channelId)) {
            this.voiceStates.set(data.channelId, new Map());
            this.channelStartTimes.set(data.channelId, Date.now());
        }
        const participants = this.voiceStates.get(data.channelId);
        for (const [socketId, user] of participants.entries()) {
            if (user.userId === client.data.user.sub && socketId !== client.id) {
                participants.delete(socketId);
            }
        }
        let avatarUrl = data.avatarUrl;
        let displayName = client.data.user.username;
        if (this.prisma) {
            try {
                const userRecord = await this.prisma.user.findUnique({
                    where: { id: client.data.user.sub },
                    select: { avatarUrl: true, displayName: true },
                });
                if (userRecord) {
                    avatarUrl = userRecord.avatarUrl || avatarUrl;
                    displayName = userRecord.displayName || displayName;
                }
            }
            catch (_) { }
        }
        participants.set(client.id, {
            userId: client.data.user.sub,
            username: client.data.user.username,
            displayName,
            avatarUrl,
            socketId: client.id,
            serverId: data.serverId,
            isMuted: false
        });
        client.to(`voice-${data.channelId}`).emit('userJoinedVoice', {
            userId: client.data.user.sub,
            username: client.data.user.username,
            displayName,
            avatarUrl,
            socketId: client.id
        });
        this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
            channelId: data.channelId,
            participants: Array.from(participants.values()),
            startedAt: this.channelStartTimes.get(data.channelId)
        });
        this.logger?.logBusinessEvent('VOICE_USER_JOINED', {
            userId: client.data.user.sub,
            channelId: data.channelId,
            serverId: data.serverId,
        });
    }
    handleLeaveVoice(data, client) {
        client.leave(`voice-${data.channelId}`);
        if (this.voiceStates.has(data.channelId)) {
            this.voiceStates.get(data.channelId).delete(client.id);
            if (this.voiceStates.get(data.channelId).size === 0) {
                this.voiceStates.delete(data.channelId);
                this.channelStartTimes.delete(data.channelId);
            }
        }
        client.to(`voice-${data.channelId}`).emit('userLeftVoice', { userId: client.data.user.sub, username: client.data.user.username, socketId: client.id });
        this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
            channelId: data.channelId,
            participants: Array.from(this.voiceStates.get(data.channelId)?.values() || []),
            startedAt: this.channelStartTimes.get(data.channelId)
        });
        this.logger?.logBusinessEvent('VOICE_USER_LEFT', {
            userId: client.data.user.sub,
            channelId: data.channelId,
            serverId: data.serverId,
        });
    }
    handleUpdateVoiceMute(data, client) {
        const channelState = this.voiceStates.get(data.channelId);
        if (channelState && channelState.has(client.id)) {
            const user = channelState.get(client.id);
            user.isMuted = data.isMuted;
            this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
                channelId: data.channelId,
                participants: Array.from(channelState.values()),
                startedAt: this.channelStartTimes.get(data.channelId)
            });
        }
    }
    handleWebrtcSignal(data, client) {
        this.server.to(data.to).emit('webrtcSignal', {
            from: client.id,
            userId: client.data.user.sub,
            username: client.data.user.username,
            signal: data.signal
        });
    }
    handleGetUserStatuses(client) {
        const allStatuses = {};
        for (const [uid, s] of this.userStatuses.entries()) {
            allStatuses[uid] = s;
        }
        client.emit('allUserStatuses', allStatuses);
    }
    async handleUpdateStatus(data, client) {
        const userId = client.data?.user?.sub;
        if (!userId || !data?.status)
            return;
        this.userStatuses.set(userId, {
            status: data.status,
            customStatus: data.customStatus,
        });
        this.server.emit('userStatusUpdate', {
            userId,
            status: data.status,
            customStatus: data.customStatus,
        });
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('sendMessage'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    SubscribeMessage('joinChannel'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinChannel", null);
__decorate([
    SubscribeMessage('leaveChannel'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveChannel", null);
__decorate([
    SubscribeMessage('sendChannelMessage'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleChannelMessage", null);
__decorate([
    SubscribeMessage('deleteChannelMessage'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteChannelMessage", null);
__decorate([
    SubscribeMessage('editMessage'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEditMessage", null);
__decorate([
    SubscribeMessage('editChannelMessage'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEditChannelMessage", null);
__decorate([
    SubscribeMessage('toggleMessageReaction'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleToggleMessageReaction", null);
__decorate([
    SubscribeMessage('toggleChannelMessageReaction'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleToggleChannelMessageReaction", null);
__decorate([
    SubscribeMessage('serverDeleted'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleServerDeleted", null);
__decorate([
    SubscribeMessage('serverMemberAction'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleServerMemberAction", null);
__decorate([
    SubscribeMessage('joinServer'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinServer", null);
__decorate([
    SubscribeMessage('leaveServer'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveServer", null);
__decorate([
    SubscribeMessage('friendAction'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleFriendAction", null);
__decorate([
    SubscribeMessage('channelCreated'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleChannelCreated", null);
__decorate([
    SubscribeMessage('serverUpdated'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleServerUpdated", null);
__decorate([
    SubscribeMessage('memberKicked'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMemberKicked", null);
__decorate([
    SubscribeMessage('memberBanned'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMemberBanned", null);
__decorate([
    SubscribeMessage('memberMuted'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMemberMuted", null);
__decorate([
    SubscribeMessage('serverSuspended'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleServerSuspended", null);
__decorate([
    SubscribeMessage('accountSuspended'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleAccountSuspended", null);
__decorate([
    SubscribeMessage('userProfileUpdated'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleUserProfileUpdated", null);
__decorate([
    SubscribeMessage('joinVoice'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinVoice", null);
__decorate([
    SubscribeMessage('leaveVoice'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveVoice", null);
__decorate([
    SubscribeMessage('updateVoiceMute'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleUpdateVoiceMute", null);
__decorate([
    SubscribeMessage('webrtcSignal'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleWebrtcSignal", null);
__decorate([
    SubscribeMessage('getUserStatuses'),
    __param(0, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleGetUserStatuses", null);
__decorate([
    SubscribeMessage('updateStatus'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleUpdateStatus", null);
ChatGateway = __decorate([
    WebSocketGateway({ cors: { origin: '*' } }),
    __param(3, Optional()),
    __param(4, Optional()),
    __metadata("design:paramtypes", [ChatService,
        ChannelsService,
        JwtService,
        PrismaService,
        BetterStackLoggerService])
], ChatGateway);
export { ChatGateway };
//# sourceMappingURL=chat.gateway.js.map