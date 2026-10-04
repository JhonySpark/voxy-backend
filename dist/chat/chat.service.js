var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { CHAT_REPOSITORY } from '../core/ports/repositories/chat.repository.port.js';
import { FRIENDSHIP_REPOSITORY } from '../core/ports/repositories/friendship.repository.port.js';
let ChatService = class ChatService {
    chatRepo;
    friendshipRepo;
    constructor(chatRepo, friendshipRepo) {
        this.chatRepo = chatRepo;
        this.friendshipRepo = friendshipRepo;
    }
    async saveMessage(senderId, receiverId, content, attachmentId, replyToId) {
        if (this.friendshipRepo) {
            const blocked = await this.friendshipRepo.isBlocked(senderId, receiverId);
            if (blocked) {
                throw new BadRequestException('Não é possível enviar mensagens para este usuário.');
            }
        }
        return this.chatRepo.saveDirectMessage(senderId, receiverId, content, attachmentId, replyToId);
    }
    async getMessagesBetweenUsers(userId1, userId2) {
        return this.chatRepo.getDirectMessages(userId1, userId2);
    }
    async editDirectMessage(messageId, userId, newContent) {
        const trimmed = (newContent || '').trim();
        if (!trimmed)
            throw new BadRequestException('Message content cannot be empty');
        const message = await this.chatRepo.findMessageById(messageId);
        if (!message)
            throw new NotFoundException('Message not found');
        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only edit your own messages');
        }
        return this.chatRepo.updateDirectMessage(messageId, trimmed);
    }
    async toggleReaction(messageId, userId, emoji) {
        const trimmedEmoji = (emoji || '').trim();
        if (!trimmedEmoji)
            throw new BadRequestException('Emoji cannot be empty');
        const message = await this.chatRepo.findMessageById(messageId);
        if (!message)
            throw new NotFoundException('Message not found');
        if (message.senderId !== userId && message.receiverId !== userId) {
            throw new ForbiddenException('You can only react to messages in your conversations');
        }
        return this.chatRepo.toggleReaction(messageId, userId, trimmedEmoji);
    }
};
ChatService = __decorate([
    Injectable(),
    __param(0, Inject(CHAT_REPOSITORY)),
    __param(1, Optional()),
    __param(1, Inject(FRIENDSHIP_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], ChatService);
export { ChatService };
//# sourceMappingURL=chat.service.js.map