import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { FRIENDSHIP_REPOSITORY } from '../core/ports/repositories/friendship.repository.port.js';
import type { IFriendshipRepository } from '../core/ports/repositories/friendship.repository.port.js';
import { Friendship } from '../modules/friends/domain/entities/friendship.entity.js';

@Injectable()
export class FriendsService {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepo: IFriendshipRepository,
  ) {}

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself');
    }

    const existing = await this.friendshipRepo.findFriendship(userId, friendId);
    if (existing) {
      throw new BadRequestException('Friend request already sent');
    }

    const friendship = Friendship.create({
      userId,
      friendId,
      status: 'PENDING',
    }).getValue();

    const created = await this.friendshipRepo.create(friendship);
    return {
      id: created.id,
      userId: created.userId,
      friendId: created.friendId,
      status: created.status,
    };
  }

  async acceptFriendRequest(userId: string, friendId: string) {
    await this.friendshipRepo.updateStatus(friendId, userId, 'ACCEPTED');
    return {
      status: 'ACCEPTED',
    };
  }

  async rejectFriendRequest(userId: string, friendId: string) {
    await this.friendshipRepo.delete(friendId, userId);
    return {
      success: true,
    };
  }

  async getFriends(userId: string) {
    return this.friendshipRepo.findFriends(userId);
  }

  async getPendingRequests(userId: string) {
    return this.friendshipRepo.findPendingRequests(userId);
  }
}
