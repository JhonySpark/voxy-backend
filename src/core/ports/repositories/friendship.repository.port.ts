import { Friendship } from '../../../modules/friends/domain/entities/friendship.entity.js';

export interface IFriendshipRepository {
  findFriendship(userId: string, friendId: string): Promise<Friendship | null>;
  create(friendship: Friendship): Promise<Friendship>;
  updateStatus(userId: string, friendId: string, status: string): Promise<void>;
  delete(userId: string, friendId: string): Promise<void>;
  deleteBidirectional(userId: string, friendId: string): Promise<void>;
  findFriends(userId: string): Promise<any[]>;
  findPendingRequests(userId: string): Promise<any[]>;
  blockUser(userId: string, blockedId: string): Promise<void>;
  unblockUser(userId: string, blockedId: string): Promise<void>;
  isBlocked(userId1: string, userId2: string): Promise<boolean>;
  hasBlocked(userId: string, targetId: string): Promise<boolean>;
  findBlockedUsers(userId: string): Promise<any[]>;
}

export const FRIENDSHIP_REPOSITORY = Symbol('FRIENDSHIP_REPOSITORY');
