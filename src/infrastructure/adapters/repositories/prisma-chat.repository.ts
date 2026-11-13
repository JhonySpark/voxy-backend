import { Injectable, Inject, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IChatRepository } from '../../../core/ports/repositories/chat.repository.port.js';
import { STORAGE_PORT } from '../../../core/ports/storage.port.js';
import type { IStoragePort } from '../../../core/ports/storage.port.js';

const MESSAGE_INCLUDE: Prisma.MessageInclude = {
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
export class PrismaChatRepository implements IChatRepository {
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

  async saveDirectMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachmentId?: string,
    replyToId?: string,
  ): Promise<any> {
    const msg = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        replyToId: replyToId || undefined,
      },
      include: MESSAGE_INCLUDE,
    });

    if (attachmentId) {
      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: { messageId: msg.id },
      });
      const updated = await this.prisma.message.findUnique({
        where: { id: msg.id },
        include: MESSAGE_INCLUDE,
      });
      return this.enrichMessage(updated);
    }

    return this.enrichMessage(msg);
  }

  async getDirectMessages(userId1: string, userId2: string): Promise<any[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: MESSAGE_INCLUDE,
    });
    return Promise.all(messages.map((m) => this.enrichMessage(m)));
  }

  async findMessageById(messageId: string): Promise<any | null> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: MESSAGE_INCLUDE,
    });
    return this.enrichMessage(msg);
  }

  async updateDirectMessage(messageId: string, content: string): Promise<any> {
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: MESSAGE_INCLUDE,
    });
    return this.enrichMessage(updated);
  }

  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await this.prisma.messageReaction.delete({
          where: { id: existing.id },
        });
      } else {
        await this.prisma.messageReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    const updated = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: MESSAGE_INCLUDE,
    });
    return this.enrichMessage(updated);
  }
}

