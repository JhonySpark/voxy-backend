import { Injectable, Inject, BadRequestException, Optional } from '@nestjs/common';
import { CHAT_REPOSITORY } from '../core/ports/repositories/chat.repository.port.js';
import type { IChatRepository } from '../core/ports/repositories/chat.repository.port.js';
import { FRIENDSHIP_REPOSITORY } from '../core/ports/repositories/friendship.repository.port.js';
import type { IFriendshipRepository } from '../core/ports/repositories/friendship.repository.port.js';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chatRepo: IChatRepository,
    @Optional() @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepo?: IFriendshipRepository,
  ) {}

  async saveMessage(senderId: string, receiverId: string, content: string, attachmentId?: string, replyToId?: string) {
    if (this.friendshipRepo) {
      const blocked = await this.friendshipRepo.isBlocked(senderId, receiverId);
      if (blocked) {
        throw new BadRequestException('Não é possível enviar mensagens para este usuário.');
      }
    }
    return this.chatRepo.saveDirectMessage(senderId, receiverId, content, attachmentId, replyToId);
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string) {
    return this.chatRepo.getDirectMessages(userId1, userId2);
  }
}
