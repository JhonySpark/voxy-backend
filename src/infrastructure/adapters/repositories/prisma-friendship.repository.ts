import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IFriendshipRepository } from '../../../core/ports/repositories/friendship.repository.port.js';
import { Friendship } from '../../../modules/friends/domain/entities/friendship.entity.js';

@Injectable()
export class PrismaFriendshipRepository implements IFriendshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: any): Friendship | null {
    if (!raw) return null;
    return Friendship.create(
      {
        userId: raw.userId,
        friendId: raw.friendId,
        status: raw.status,
        createdAt: raw.createdAt,
      },
      raw.id
    ).getValue();
  }

  async findFriendship(userId: string, friendId: string): Promise<Friendship | null> {
    const raw = await this.prisma.friendship.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });
    return this.toDomain(raw);
  }

  async create(friendship: Friendship): Promise<Friendship> {
    const raw = await this.prisma.friendship.create({
      data: {
        id: friendship.id,
        userId: friendship.userId,
        friendId: friendship.friendId,
        status: friendship.status,
        createdAt: friendship.createdAt,
      },
    });

    return this.toDomain(raw)!;
  }

  async updateStatus(userId: string, friendId: string, status: string): Promise<void> {
    await this.prisma.friendship.update({
      where: {
        userId_friendId: { userId, friendId },
      },
      data: { status },
    });
  }

  async delete(userId: string, friendId: string): Promise<void> {
    await this.prisma.friendship.delete({
      where: {
        userId_friendId: { userId, friendId },
      },
    });
  }

  async deleteBidirectional(userId: string, friendId: string): Promise<void> {
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
  }

  async blockUser(userId: string, blockedId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.blockedUser.upsert({
        where: {
          userId_blockedId: { userId, blockedId },
        },
        create: { userId, blockedId },
        update: {},
      }),
      this.prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId: blockedId },
            { userId: blockedId, friendId: userId },
          ],
        },
      }),
    ]);
  }

  async unblockUser(userId: string, blockedId: string): Promise<void> {
    await this.prisma.blockedUser.deleteMany({
      where: {
        userId,
        blockedId,
      },
    });
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const count = await this.prisma.blockedUser.count({
      where: {
        OR: [
          { userId: userId1, blockedId: userId2 },
          { userId: userId2, blockedId: userId1 },
        ],
      },
    });
    return count > 0;
  }

  async hasBlocked(userId: string, targetId: string): Promise<boolean> {
    const block = await this.prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: { userId, blockedId: targetId },
      },
    });
    return !!block;
  }

  async findBlockedUsers(userId: string): Promise<any[]> {
    const blocks = await this.prisma.blockedUser.findMany({
      where: { userId },
      include: { blocked: true },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b: any) => {
      const u = b.blocked;
      if (u && u.avatarUrl) {
        const version = u.updatedAt ? `?v=${new Date(u.updatedAt).getTime()}` : '';
        return {
          ...u,
          avatarUrl: `${u.avatarUrl.split('?')[0]}${version}`,
          bannerUrl: u.bannerUrl ? `${u.bannerUrl.split('?')[0]}${version}` : u.bannerUrl,
        };
      }
      return u;
    });
  }

  async findFriends(userId: string): Promise<any[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: true,
        friend: true,
      },
    });

    return friendships.map((f: any) => {
      const u = f.userId === userId ? f.friend : f.user;
      if (u && u.avatarUrl) {
        const version = u.updatedAt ? `?v=${new Date(u.updatedAt).getTime()}` : '';
        return {
          ...u,
          avatarUrl: `${u.avatarUrl.split('?')[0]}${version}`,
          bannerUrl: u.bannerUrl ? `${u.bannerUrl.split('?')[0]}${version}` : u.bannerUrl,
        };
      }
      return u;
    });
  }

  async findPendingRequests(userId: string): Promise<any[]> {
    const requests = await this.prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: { user: true },
    });

    return requests.map((r: any) => r.user);
  }
}
