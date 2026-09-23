import { ChatService } from './chat.service.js';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getMessages(req: any, friendId: string): Promise<({
        sender: {
            id: string;
            username: string;
            email: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        receiverId: string;
        senderId: string;
    })[]>;
}
