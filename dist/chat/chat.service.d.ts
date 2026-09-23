import { PrismaService } from '../prisma/prisma.service.js';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    saveMessage(senderId: string, receiverId: string, content: string): Promise<{
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
    }>;
    getMessagesBetweenUsers(userId1: string, userId2: string): Promise<({
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
