import type { IChatRepository } from '../core/ports/repositories/chat.repository.port.js';
import type { IFriendshipRepository } from '../core/ports/repositories/friendship.repository.port.js';
export declare class ChatService {
    private readonly chatRepo;
    private readonly friendshipRepo?;
    constructor(chatRepo: IChatRepository, friendshipRepo?: IFriendshipRepository | undefined);
    saveMessage(senderId: string, receiverId: string, content: string, attachmentId?: string, replyToId?: string): Promise<any>;
    getMessagesBetweenUsers(userId1: string, userId2: string): Promise<any[]>;
    editDirectMessage(messageId: string, userId: string, newContent: string): Promise<any>;
    toggleReaction(messageId: string, userId: string, emoji: string): Promise<any>;
}
