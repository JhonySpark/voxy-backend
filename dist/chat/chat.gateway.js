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
let ChatGateway = class ChatGateway {
    chatService;
    channelsService;
    jwtService;
    prisma;
    server;
    connectedUsers = new Map();
    constructor(chatService, channelsService, jwtService, prisma) {
        this.chatService = chatService;
        this.channelsService = channelsService;
        this.jwtService = jwtService;
        this.prisma = prisma;
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
            client.join(userId);
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data.user) {
            this.connectedUsers.delete(client.data.user.sub);
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
        const message = await this.chatService.saveMessage(senderId, data.receiverId, data.content, data.attachmentId);
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
            const message = await this.channelsService.saveChannelMessage(data.channelId, senderId, data.content, data.attachmentId);
            this.server.to(data.channelId).emit('newChannelMessage', message);
            return message;
        }
        catch (e) {
            return { error: 'Unauthorized' };
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
ChatGateway = __decorate([
    WebSocketGateway({ cors: { origin: '*' } }),
    __param(3, Optional()),
    __metadata("design:paramtypes", [ChatService,
        ChannelsService,
        JwtService,
        PrismaService])
], ChatGateway);
export { ChatGateway };
//# sourceMappingURL=chat.gateway.js.map