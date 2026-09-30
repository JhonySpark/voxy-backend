import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IChatRepository } from '../../../core/ports/repositories/chat.repository.port.js';

@Injectable()
export class PrismaChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveDirectMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachmentId?: string,
  ): Promise<any> {
    const msg = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: true,
        attachments: true,
      },
    });

    if (attachmentId) {
      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: { messageId: msg.id },
      });
      return this.prisma.message.findUnique({
        where: { id: msg.id },
        include: {
          sender: true,
          attachments: true,
        },
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
      include: {
        sender: true,
        attachments: true,
      },
    });
  }
}
