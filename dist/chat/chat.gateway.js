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
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';
let ChatGateway = class ChatGateway {
    chatService;
    channelsService;
    jwtService;
    server;
    connectedUsers = new Map();
    constructor(chatService, channelsService, jwtService) {
        this.chatService = chatService;
        this.channelsService = channelsService;
        this.jwtService = jwtService;
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
        }
    }
    async handleMessage(data, client) {
        const senderId = client.data.user.sub;
        const message = await this.chatService.saveMessage(senderId, data.receiverId, data.content);
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
            const message = await this.channelsService.saveChannelMessage(data.channelId, senderId, data.content);
            this.server.to(data.channelId).emit('newChannelMessage', message);
            return message;
        }
        catch (e) {
            return { error: 'Unauthorized' };
        }
    }
    voiceStates = new Map();
    handleJoinServer(data, client) {
        client.join(`server-${data.serverId}`);
    }
    handleLeaveServer(data, client) {
        client.leave(`server-${data.serverId}`);
    }
    handleFriendAction(data, client) {
        this.server.to(data.targetId).emit('friendActionUpdate');
    }
    handleJoinVoice(data, client) {
        client.join(`voice-${data.channelId}`);
        if (!this.voiceStates.has(data.channelId)) {
            this.voiceStates.set(data.channelId, new Map());
        }
        this.voiceStates.get(data.channelId).set(client.id, { userId: client.data.user.sub, username: client.data.user.username, socketId: client.id });
        client.to(`voice-${data.channelId}`).emit('userJoinedVoice', { userId: client.data.user.sub, username: client.data.user.username, socketId: client.id });
        this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
            channelId: data.channelId,
            participants: Array.from(this.voiceStates.get(data.channelId).values())
        });
    }
    handleLeaveVoice(data, client) {
        client.leave(`voice-${data.channelId}`);
        if (this.voiceStates.has(data.channelId)) {
            this.voiceStates.get(data.channelId).delete(client.id);
        }
        client.to(`voice-${data.channelId}`).emit('userLeftVoice', { userId: client.data.user.sub, username: client.data.user.username, socketId: client.id });
        this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
            channelId: data.channelId,
            participants: Array.from(this.voiceStates.get(data.channelId)?.values() || [])
        });
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
    SubscribeMessage('joinVoice'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
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
    SubscribeMessage('webrtcSignal'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleWebrtcSignal", null);
ChatGateway = __decorate([
    WebSocketGateway({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [ChatService,
        ChannelsService,
        JwtService])
], ChatGateway);
export { ChatGateway };
//# sourceMappingURL=chat.gateway.js.map