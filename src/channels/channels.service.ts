import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
  Optional,
} from '@nestjs/common';
import { CHANNEL_REPOSITORY } from '../core/ports/repositories/channel.repository.port.js';
import type { IChannelRepository } from '../core/ports/repositories/channel.repository.port.js';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { VOICE_ENGINE_PORT } from '../core/ports/voice-engine.port.js';
import type { IVoiceEnginePort } from '../core/ports/voice-engine.port.js';
import { Channel } from '../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../modules/servers/domain/value-objects/channel-type.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgeClassificationEnum } from '../core/enums/index.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';

@Injectable()
export class ChannelsService {
  constructor(
    @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
    @Inject(SERVER_REPOSITORY) private readonly serverRepo: IServerRepository,
    @Inject(VOICE_ENGINE_PORT) private readonly voiceEngine: IVoiceEnginePort,
    private readonly prisma: PrismaService,
    @Optional() private readonly logger?: BetterStackLoggerService,
  ) {}

  async createChannel(
    serverId: string,
    userId: string,
    name: string,
    type: 'TEXT' | 'VOICE' = 'TEXT',
  ) {
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

  async getChannelMessages(channelId: string, userId: string) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const isMember = await this.serverRepo.isMember(channel.serverId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return this.channelRepo.getMessages(channelId);
  }

  async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const role = await this.serverRepo.getMemberRole(channel.serverId, userId);
    if (role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can delete channels');
    }

    await this.channelRepo.delete(channelId);
  }

  async renameChannel(channelId: string, userId: string, name: string) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

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

  async saveChannelMessage(
    channelId: string,
    senderId: string,
    content: string,
    attachmentId?: string,
    replyToId?: string,
  ) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const isMember = await this.serverRepo.isMember(channel.serverId, senderId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return this.channelRepo.saveMessage(channelId, senderId, content, attachmentId, replyToId);
  }

  async deleteChannelMessage(channelId: string, messageId: string, userId: string) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const message = await this.channelRepo.findMessageById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId === userId) {
      await this.channelRepo.deleteMessage(messageId);
      return { success: true };
    }

    const role = await this.serverRepo.getMemberRole(channel.serverId, userId);
    if (!role) throw new ForbiddenException('You are not a member of this server');

    if (role === 'OWNER') {
      await this.channelRepo.deleteMessage(messageId);
      return { success: true };
    }

    const rolePerms = await this.serverRepo.getRolePermissions(channel.serverId);
    const custom = rolePerms.find((p: any) => p.role === role);
    const canDeleteMessages = custom?.canDeleteMessages ?? (role === 'ADMIN' || role === 'MODERATOR');

    if (!canDeleteMessages) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    await this.channelRepo.deleteMessage(messageId);
    return { success: true };
  }

  async editChannelMessage(channelId: string, messageId: string, userId: string, newContent: string) {
    const trimmed = (newContent || '').trim();
    if (!trimmed) throw new BadRequestException('Message content cannot be empty');

    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const message = await this.channelRepo.findMessageById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.channelRepo.updateMessage(messageId, trimmed);
  }

  async toggleChannelMessageReaction(channelId: string, messageId: string, userId: string, emoji: string) {
    const trimmedEmoji = (emoji || '').trim();
    if (!trimmedEmoji) throw new BadRequestException('Emoji cannot be empty');

    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const isMember = await this.serverRepo.isMember(channel.serverId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const message = await this.channelRepo.findMessageById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    return this.channelRepo.toggleReaction(messageId, userId, trimmedEmoji);
  }

  async getVoiceToken(channelId: string, user: { sub: string; username: string }, isScreen: boolean = false) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

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
}
