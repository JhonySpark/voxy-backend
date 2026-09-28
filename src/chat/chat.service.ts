import { Injectable, Inject } from '@nestjs/common';
import { CHAT_REPOSITORY } from '../core/ports/repositories/chat.repository.port.js';
import type { IChatRepository } from '../core/ports/repositories/chat.repository.port.js';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chatRepo: IChatRepository,
  ) {}

  async saveMessage(senderId: string, receiverId: string, content: string) {
    return this.chatRepo.saveDirectMessage(senderId, receiverId, content);
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string) {
    return this.chatRepo.getDirectMessages(userId1, userId2);
  }
}
