import type { IFriendshipRepository } from '../core/ports/repositories/friendship.repository.port.js';
export declare class FriendsService {
    private readonly friendshipRepo;
    constructor(friendshipRepo: IFriendshipRepository);
    sendFriendRequest(userId: string, friendId: string): Promise<{
        id: string;
        userId: string;
        friendId: string;
        status: import("../modules/friends/domain/entities/friendship.entity.js").FriendshipStatusType;
    }>;
    acceptFriendRequest(userId: string, friendId: string): Promise<{
        status: string;
    }>;
    rejectFriendRequest(userId: string, friendId: string): Promise<{
        success: boolean;
    }>;
    removeFriend(userId: string, friendId: string): Promise<{
        success: boolean;
    }>;
    blockUser(userId: string, targetId: string): Promise<{
        success: boolean;
    }>;
    unblockUser(userId: string, targetId: string): Promise<{
        success: boolean;
    }>;
    getBlockedUsers(userId: string): Promise<any[]>;
    getUserRelationshipStatus(userId: string, targetId: string): Promise<{
        isFriend: boolean;
        isPending: boolean;
        isBlocked: boolean;
        hasBlocked: boolean;
    }>;
    getFriends(userId: string): Promise<any[]>;
    getPendingRequests(userId: string): Promise<any[]>;
}
