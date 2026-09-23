import { FriendsService } from './friends.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class FriendsController {
    private friendsService;
    private prisma;
    constructor(friendsService: FriendsService, prisma: PrismaService);
    sendRequest(req: any, username: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    acceptRequest(req: any, friendId: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    rejectRequest(req: any, friendId: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    getFriends(req: any): Promise<any[]>;
    getRequests(req: any): Promise<any[]>;
}
