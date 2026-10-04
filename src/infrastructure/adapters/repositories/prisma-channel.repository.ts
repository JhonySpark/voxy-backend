import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IChannelRepository } from '../../../core/ports/repositories/channel.repository.port.js';
import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../../../modules/servers/domain/value-objects/channel-type.vo.js';

const CHANNEL_MESSAGE_INCLUDE = {
  sender: true,
  attachments: true,
  replyTo: {
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      attachments: true,
    },
  },
  reactions: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
};

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

  async update(channel: Channel): Promise<Channel> {
    const raw = await this.prisma.channel.update({
      where: { id: channel.id },
      data: { name: channel.name },
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

  async delete(channelId: string): Promise<void> {
    await this.prisma.channel.delete({ where: { id: channelId } });
  }

  async saveMessage(
    channelId: string,
    senderId: string,
    content: string,
    attachmentId?: string,
    replyToId?: string,
  ): Promise<any> {
    const msg = await this.prisma.channelMessage.create({
      data: {
        channelId,
        senderId,
        content,
        replyToId: replyToId || undefined,
      },
      include: CHANNEL_MESSAGE_INCLUDE,
    });

    if (attachmentId) {
      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: { channelMessageId: msg.id },
      });
      return this.prisma.channelMessage.findUnique({
        where: { id: msg.id },
        include: CHANNEL_MESSAGE_INCLUDE,
      });
    }

    return msg;
  }

  async getMessages(channelId: string): Promise<any[]> {
    return this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      include: CHANNEL_MESSAGE_INCLUDE,
    });
  }

  async findMessageById(messageId: string): Promise<any | null> {
    return this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
      },
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.prisma.channelMessage.delete({
      where: { id: messageId },
    });
  }

  async updateMessage(messageId: string, content: string): Promise<any> {
    return this.prisma.channelMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: CHANNEL_MESSAGE_INCLUDE,
    });
  }

  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    const existing = await this.prisma.channelMessageReaction.findUnique({
      where: {
        channelMessageId_userId: {
          channelMessageId: messageId,
          userId,
        },
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await this.prisma.channelMessageReaction.delete({
          where: { id: existing.id },
        });
      } else {
        await this.prisma.channelMessageReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await this.prisma.channelMessageReaction.create({
        data: {
          channelMessageId: messageId,
          userId,
          emoji,
        },
      });
    }

    return this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      include: CHANNEL_MESSAGE_INCLUDE,
    });
  }
}
