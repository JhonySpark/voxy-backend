import type { IChatRepository } from '../core/ports/repositories/chat.repository.port.js';
export declare class ChatService {
    private readonly chatRepo;
    constructor(chatRepo: IChatRepository);
    saveMessage(senderId: string, receiverId: string, content: string, attachmentId?: string): Promise<any>;
    getMessagesBetweenUsers(userId1: string, userId2: string): Promise<any[]>;
}
