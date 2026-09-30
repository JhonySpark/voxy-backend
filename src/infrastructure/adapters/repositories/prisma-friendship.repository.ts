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
