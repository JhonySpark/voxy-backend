import { Injectable, Inject, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IChannelRepository, MessagePageOptions } from '../../../core/ports/repositories/channel.repository.port.js';
import { STORAGE_PORT } from '../../../core/ports/storage.port.js';
import type { IStoragePort } from '../../../core/ports/storage.port.js';
import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../../../modules/servers/domain/value-objects/channel-type.vo.js';

const CHANNEL_MESSAGE_INCLUDE: Prisma.ChannelMessageInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bannerUrl: true,
      bannerColor: true,
      bio: true,
      equippedFrameSlug: true,
    },
  },
  attachments: true,
  replyTo: {
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          equippedFrameSlug: true,
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
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(STORAGE_PORT) private readonly storagePort?: IStoragePort,
  ) {}

  private async enrichAttachmentUrls(att: any): Promise<any> {
    if (!att || !this.storagePort) return att;
    try {
      const downloadUrl = att.fileKey
        ? await this.storagePort.getPresignedDownloadUrl(att.fileKey, 86400)
        : att.url;
      const thumbnailUrl = att.thumbnailKey
        ? await this.storagePort.getPresignedDownloadUrl(att.thumbnailKey, 86400)
        : downloadUrl;
      return {
        ...att,
        downloadUrl,
        thumbnailUrl,
      };
    } catch {
      return att;
    }
  }

  private async enrichMessage(msg: any): Promise<any> {
    if (!msg || !this.storagePort) return msg;

    const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
    const hasReplyAttachments =
      Array.isArray(msg.replyTo?.attachments) && msg.replyTo.attachments.length > 0;

    if (!hasAttachments && !hasReplyAttachments) {
      return msg;
    }

    const [enrichedAttachments, enrichedReplyAttachments] = await Promise.all([
      hasAttachments
        ? Promise.all(msg.attachments.map((att: any) => this.enrichAttachmentUrls(att)))
        : Promise.resolve(msg.attachments),
      hasReplyAttachments
        ? Promise.all(msg.replyTo.attachments.map((att: any) => this.enrichAttachmentUrls(att)))
        : Promise.resolve(msg.replyTo?.attachments),
    ]);

    return {
      ...msg,
      ...(hasAttachments ? { attachments: enrichedAttachments } : {}),
      ...(hasReplyAttachments
        ? {
            replyTo: {
              ...msg.replyTo,
              attachments: enrichedReplyAttachments,
            },
          }
        : {}),
    };
  }

  private toDomain(raw: any): Channel | null {
    if (!raw) return null;
    return Channel.create(
      {
        name: raw.name,
        type: ChannelType.create(raw.type).getValue(),
        serverId: raw.serverId,
        icon: raw.icon ?? 'hash',
        isRestricted: Boolean(raw.isRestricted),
        allowedRoles: Array.isArray(raw.allowedRoles) ? raw.allowedRoles : [],
        userLimit: typeof raw.userLimit === 'number' ? raw.userLimit : 0,
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
        icon: channel.icon ?? 'hash',
        isRestricted: channel.isRestricted,
        allowedRoles: channel.allowedRoles,
        userLimit: channel.userLimit,
        serverId: channel.serverId,
        createdAt: channel.createdAt,
      },
    });

    return this.toDomain(raw)!;
  }

  async update(channel: Channel): Promise<Channel> {
    const raw = await this.prisma.channel.update({
      where: { id: channel.id },
      data: {
        name: channel.name,
        icon: channel.icon,
        isRestricted: channel.isRestricted,
        allowedRoles: channel.allowedRoles,
        userLimit: channel.userLimit,
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
      const updated = await this.prisma.channelMessage.findUnique({
        where: { id: msg.id },
        include: CHANNEL_MESSAGE_INCLUDE,
      });
      return this.enrichMessage(updated);
    }

    return this.enrichMessage(msg);
  }

  async getMessages(channelId: string, options: MessagePageOptions = {}): Promise<any[]> {
    const { before, limit = 50 } = options;

    // Busca as mais recentes primeiro (usa o índice channelId+createdAt) e
    // devolve em ordem cronológica, como o cliente espera
    const messages = await this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      include: CHANNEL_MESSAGE_INCLUDE,
    });

    const ordered = messages.reverse();
    return Promise.all(ordered.map((m) => this.enrichMessage(m)));
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
    const updated = await this.prisma.channelMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: CHANNEL_MESSAGE_INCLUDE,
    });
    return this.enrichMessage(updated);
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

    const updated = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      include: CHANNEL_MESSAGE_INCLUDE,
    });
    return this.enrichMessage(updated);
  }
}
