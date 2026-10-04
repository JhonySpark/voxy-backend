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

    if (await this.friendshipRepo.isBlocked(userId, friendId)) {
      throw new BadRequestException('Não é possível enviar pedido de amizade para este usuário.');
    }

    const existing =
      (await this.friendshipRepo.findFriendship(userId, friendId)) ||
      (await this.friendshipRepo.findFriendship(friendId, userId));

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('Vocês já são amigos');
      }
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

  async removeFriend(userId: string, friendId: string) {
    await this.friendshipRepo.deleteBidirectional(userId, friendId);
    return {
      success: true,
    };
  }

  async blockUser(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException('Não é possível bloquear a si mesmo.');
    }
    await this.friendshipRepo.blockUser(userId, targetId);
    return {
      success: true,
    };
  }

  async unblockUser(userId: string, targetId: string) {
    await this.friendshipRepo.unblockUser(userId, targetId);
    return {
      success: true,
    };
  }

  async getBlockedUsers(userId: string) {
    return this.friendshipRepo.findBlockedUsers(userId);
  }

  async getUserRelationshipStatus(userId: string, targetId: string) {
    if (userId === targetId) {
      return { isFriend: false, isPending: false, isBlocked: false, hasBlocked: false };
    }

    const [f1, f2, isBlocked, hasBlocked] = await Promise.all([
      this.friendshipRepo.findFriendship(userId, targetId),
      this.friendshipRepo.findFriendship(targetId, userId),
      this.friendshipRepo.isBlocked(userId, targetId),
      this.friendshipRepo.hasBlocked(userId, targetId),
    ]);

    const friendship = f1 || f2;

    return {
      isFriend: friendship?.status === 'ACCEPTED',
      isPending: friendship?.status === 'PENDING',
      isBlocked,
      hasBlocked,
    };
  }

  async getFriends(userId: string) {
    return this.friendshipRepo.findFriends(userId);
  }

  async getPendingRequests(userId: string) {
    return this.friendshipRepo.findPendingRequests(userId);
  }
}
