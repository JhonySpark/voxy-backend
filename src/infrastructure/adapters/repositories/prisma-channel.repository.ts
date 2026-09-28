import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IChannelRepository } from '../../../core/ports/repositories/channel.repository.port.js';
import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../../../modules/servers/domain/value-objects/channel-type.vo.js';

@Injectable()
export class PrismaChannelRepository implements IChannelRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: any): Channel | null {
    if (!raw) return null;
    return Channel.create(
      {
        name: raw.name,
        type: ChannelType.create(raw.type).getValue(),
        serverId: raw.serverId,
        createdAt: raw.createdAt,
      },
      raw.id
    ).getValue();
  }

  async create(channel: Channel): Promise<Channel> {
    const raw = await this.prisma.channel.create({
      data: {
        id: channel.id,
        name: channel.name,
        type: channel.type.value,
        serverId: channel.serverId,
        createdAt: channel.createdAt,
      },
    });

    return this.toDomain(raw)!;
  }

  async findById(id: string): Promise<Channel | null> {
    const raw = await this.prisma.channel.findUnique({
      where: { id },
    });
    return this.toDomain(raw);
  }

  async findServerChannels(serverId: string): Promise<Channel[]> {
    const rawList = await this.prisma.channel.findMany({
      where: { serverId },
    });
    return rawList.map(raw => this.toDomain(raw)!);
  }

  async saveMessage(channelId: string, senderId: string, content: string): Promise<any> {
    return this.prisma.channelMessage.create({
      data: {
        channelId,
        senderId,
        content,
      },
      include: {
        sender: true,
      },
    });
  }

  async getMessages(channelId: string): Promise<any[]> {
    return this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });
  }
}
