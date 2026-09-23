import { PrismaService } from '../prisma/prisma.service.js';
export declare class FriendsService {
    private prisma;
    constructor(prisma: PrismaService);
    sendFriendRequest(userId: string, friendId: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        friendId: string;
        userId: string;
    }>;
    acceptFriendRequest(userId: string, friendId: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        friendId: string;
        userId: string;
    }>;
    rejectFriendRequest(userId: string, friendId: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        friendId: string;
        userId: string;
    }>;
    getFriends(userId: string): Promise<any[]>;
    getPendingRequests(userId: string): Promise<any[]>;
}
