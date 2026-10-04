import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IChatRepository } from '../../../core/ports/repositories/chat.repository.port.js';

const MESSAGE_INCLUDE: Prisma.MessageInclude = {
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
export class PrismaChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      return this.prisma.message.findUnique({
        where: { id: msg.id },
        include: MESSAGE_INCLUDE,
      });
    }

    return msg;
  }

  async getDirectMessages(userId1: string, userId2: string): Promise<any[]> {
    return this.prisma.message.findMany({
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
  }

  async findMessageById(messageId: string): Promise<any | null> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: MESSAGE_INCLUDE,
    });
  }

  async updateDirectMessage(messageId: string, content: string): Promise<any> {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: MESSAGE_INCLUDE,
    });
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

    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: MESSAGE_INCLUDE,
    });
  }
}

