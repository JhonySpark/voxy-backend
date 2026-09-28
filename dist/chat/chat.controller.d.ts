import { ChatService } from './chat.service.js';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getMessages(req: any, friendId: string): Promise<any[]>;
}
