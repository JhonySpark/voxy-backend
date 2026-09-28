import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CHANNEL_REPOSITORY } from '../core/ports/repositories/channel.repository.port.js';
import type { IChannelRepository } from '../core/ports/repositories/channel.repository.port.js';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { VOICE_ENGINE_PORT } from '../core/ports/voice-engine.port.js';
import type { IVoiceEnginePort } from '../core/ports/voice-engine.port.js';
import { Channel } from '../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../modules/servers/domain/value-objects/channel-type.vo.js';

@Injectable()
export class ChannelsService {
  constructor(
    @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
    @Inject(SERVER_REPOSITORY) private readonly serverRepo: IServerRepository,
    @Inject(VOICE_ENGINE_PORT) private readonly voiceEngine: IVoiceEnginePort,
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

  async saveChannelMessage(
    channelId: string,
    senderId: string,
    content: string,
  ) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

    const isMember = await this.serverRepo.isMember(channel.serverId, senderId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return this.channelRepo.saveMessage(channelId, senderId, content);
  }

  async getVoiceToken(channelId: string, user: { sub: string; username: string }) {
    const channel = await this.channelRepo.findById(channelId);
    if (!channel) throw new NotFoundException('Channel not found');

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
}
