import { ChatService } from './chat.service.js';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getMessages(req: any, friendId: string): Promise<any[]>;
    editMessage(req: any, messageId: string, content: string): Promise<any>;
    toggleReaction(req: any, messageId: string, emoji: string): Promise<any>;
}
