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
import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Inject, Optional, } from '@nestjs/common';
import { CHANNEL_REPOSITORY } from '../core/ports/repositories/channel.repository.port.js';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import { VOICE_ENGINE_PORT } from '../core/ports/voice-engine.port.js';
import { Channel } from '../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../modules/servers/domain/value-objects/channel-type.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgeClassificationEnum } from '../core/enums/index.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';
let ChannelsService = class ChannelsService {
    channelRepo;
    serverRepo;
    voiceEngine;
    prisma;
    logger;
    constructor(channelRepo, serverRepo, voiceEngine, prisma, logger) {
        this.channelRepo = channelRepo;
        this.serverRepo = serverRepo;
        this.voiceEngine = voiceEngine;
        this.prisma = prisma;
        this.logger = logger;
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
    async deleteChannel(channelId, userId) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const role = await this.serverRepo.getMemberRole(channel.serverId, userId);
        if (role !== 'OWNER') {
            throw new ForbiddenException('Only the owner can delete channels');
        }
        await this.channelRepo.delete(channelId);
    }
    async renameChannel(channelId, userId, name) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const role = await this.serverRepo.getMemberRole(channel.serverId, userId);
        if (role !== 'OWNER') {
            throw new ForbiddenException('Only the owner can rename channels');
        }
        const renameResult = channel.rename(name);
        if (renameResult.isFailure) {
            throw new ForbiddenException(renameResult.error);
        }
        const updated = await this.channelRepo.update(channel);
        return {
            id: updated.id,
            name: updated.name,
            type: updated.type.value,
            serverId: updated.serverId,
        };
    }
    async saveChannelMessage(channelId, senderId, content, attachmentId, replyToId) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.serverRepo.isMember(channel.serverId, senderId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        return this.channelRepo.saveMessage(channelId, senderId, content, attachmentId, replyToId);
    }
    async deleteChannelMessage(channelId, messageId, userId) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const message = await this.channelRepo.findMessageById(messageId);
        if (!message)
            throw new NotFoundException('Message not found');
        if (message.senderId === userId) {
            await this.channelRepo.deleteMessage(messageId);
            return { success: true };
        }
        const role = await this.serverRepo.getMemberRole(channel.serverId, userId);
        if (!role)
            throw new ForbiddenException('You are not a member of this server');
        if (role === 'OWNER') {
            await this.channelRepo.deleteMessage(messageId);
            return { success: true };
        }
        const rolePerms = await this.serverRepo.getRolePermissions(channel.serverId);
        const custom = rolePerms.find((p) => p.role === role);
        const canDeleteMessages = custom?.canDeleteMessages ?? (role === 'ADMIN' || role === 'MODERATOR');
        if (!canDeleteMessages) {
            throw new ForbiddenException('You do not have permission to delete this message');
        }
        await this.channelRepo.deleteMessage(messageId);
        return { success: true };
    }
    async editChannelMessage(channelId, messageId, userId, newContent) {
        const trimmed = (newContent || '').trim();
        if (!trimmed)
            throw new BadRequestException('Message content cannot be empty');
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const message = await this.channelRepo.findMessageById(messageId);
        if (!message)
            throw new NotFoundException('Message not found');
        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only edit your own messages');
        }
        return this.channelRepo.updateMessage(messageId, trimmed);
    }
    async toggleChannelMessageReaction(channelId, messageId, userId, emoji) {
        const trimmedEmoji = (emoji || '').trim();
        if (!trimmedEmoji)
            throw new BadRequestException('Emoji cannot be empty');
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.serverRepo.isMember(channel.serverId, userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        const message = await this.channelRepo.findMessageById(messageId);
        if (!message)
            throw new NotFoundException('Message not found');
        return this.channelRepo.toggleReaction(messageId, userId, trimmedEmoji);
    }
    async getVoiceToken(channelId, user, isScreen = false) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel)
            throw new NotFoundException('Channel not found');
        const userDb = await this.prisma.user.findUnique({
            where: { id: user.sub },
            select: { ageClassification: true },
        });
        if (userDb?.ageClassification === AgeClassificationEnum.CHILD) {
            throw new ForbiddenException('Acesso restrito para menores de 13 anos.');
        }
        const serverMeta = await this.prisma.server.findUnique({
            where: { id: channel.serverId },
            select: { is18Plus: true },
        });
        if (serverMeta?.is18Plus && userDb?.ageClassification !== AgeClassificationEnum.ADULT) {
            throw new ForbiddenException('Este canal pertence a um servidor restrito para maiores de 18 anos (+18).');
        }
        const isMember = await this.serverRepo.isMember(channel.serverId, user.sub);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        const token = await this.voiceEngine.generateAccessToken({
            roomName: channelId,
            participantId: isScreen ? `${user.sub}#screen` : user.sub,
            participantName: isScreen ? `${user.username} (Tela)` : user.username,
            canUpdateOwnMetadata: isScreen,
        });
        this.logger?.logBusinessEvent('LIVEKIT_TOKEN_ISSUED', {
            userId: user.sub,
            channelId,
            serverId: channel.serverId,
            isScreen: Boolean(isScreen),
        });
        return { token };
    }
};
ChannelsService = __decorate([
    Injectable(),
    __param(0, Inject(CHANNEL_REPOSITORY)),
    __param(1, Inject(SERVER_REPOSITORY)),
    __param(2, Inject(VOICE_ENGINE_PORT)),
    __param(4, Optional()),
    __metadata("design:paramtypes", [Object, Object, Object, PrismaService,
        BetterStackLoggerService])
], ChannelsService);
export { ChannelsService };
//# sourceMappingURL=channels.service.js.map