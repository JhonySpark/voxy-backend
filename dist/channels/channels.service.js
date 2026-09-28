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
import { Injectable, ForbiddenException, NotFoundException, Inject, } from '@nestjs/common';
import { CHANNEL_REPOSITORY } from '../core/ports/repositories/channel.repository.port.js';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import { VOICE_ENGINE_PORT } from '../core/ports/voice-engine.port.js';
import { Channel } from '../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../modules/servers/domain/value-objects/channel-type.vo.js';
let ChannelsService = class ChannelsService {
    channelRepo;
    serverRepo;
    voiceEngine;
    constructor(channelRepo, serverRepo, voiceEngine) {
        this.channelRepo = channelRepo;
        this.serverRepo = serverRepo;
        this.voiceEngine = voiceEngine;
    }
    async createChannel(serverId, userId, name, type = 'TEXT') {
        const role = await this.serverRepo.getMemberRole(serverId, userId);
        if (!role || role !== 'OWNER') {
            throw new ForbiddenException('Only the owner can create channels');
        }
        const channelOrError = Channel.create({
            name,
            type: ChannelType.create(type).getValue(),
            serverId,
        });
        if (channelOrError.isFailure) {
            throw new ForbiddenException(channelOrError.error);
        }
        const channel = channelOrError.getValue();
        const created = await this.channelRepo.create(channel);
        return {
            id: created.id,
            name: created.name,
            type: created.type.value,
            serverId: created.serverId,
        };
    }
    async getChannelMessages(channelId, userId) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.serverRepo.isMember(channel.serverId, userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        return this.channelRepo.getMessages(channelId);
    }
    async saveChannelMessage(channelId, senderId, content) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.serverRepo.isMember(channel.serverId, senderId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        return this.channelRepo.saveMessage(channelId, senderId, content);
    }
    async getVoiceToken(channelId, user) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.serverRepo.isMember(channel.serverId, user.sub);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        const token = await this.voiceEngine.generateAccessToken({
            roomName: channelId,
            participantId: user.sub,
            participantName: user.username,
        });
        return { token };
    }
};
ChannelsService = __decorate([
    Injectable(),
    __param(0, Inject(CHANNEL_REPOSITORY)),
    __param(1, Inject(SERVER_REPOSITORY)),
    __param(2, Inject(VOICE_ENGINE_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object])
], ChannelsService);
export { ChannelsService };
//# sourceMappingURL=channels.service.js.map