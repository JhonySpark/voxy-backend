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
    getFriends(userId: string): Promise<any[]>;
    getPendingRequests(userId: string): Promise<any[]>;
}
