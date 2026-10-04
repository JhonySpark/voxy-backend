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
    deleteFriend(req: any, friendId: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    removeFriend(req: any, friendId: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    blockUser(req: any, targetId: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    unblockUser(req: any, targetId: string): Promise<{
        success: boolean;
        targetId: string;
    }>;
    getBlockedUsers(req: any): Promise<any[]>;
    getRelationshipStatus(req: any, targetId: string): Promise<{
        isFriend: boolean;
        isPending: boolean;
        isBlocked: boolean;
        hasBlocked: boolean;
    }>;
    getFriends(req: any): Promise<any[]>;
    getRequests(req: any): Promise<any[]>;
}
