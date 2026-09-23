import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself');
    }
    
    // Check if request already exists
    const existing = await this.prisma.friendship.findUnique({
      where: {
        userId_friendId: { userId, friendId }
      }
    });

    if (existing) {
      throw new BadRequestException('Friend request already sent');
    }

    return this.prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'PENDING'
      }
    });
  }

  async acceptFriendRequest(userId: string, friendId: string) {
    return this.prisma.friendship.update({
      where: {
        userId_friendId: { userId: friendId, friendId: userId }
      },
      data: {
        status: 'ACCEPTED'
      }
    });
  }

  async rejectFriendRequest(userId: string, friendId: string) {
    return this.prisma.friendship.delete({
      where: {
        userId_friendId: { userId: friendId, friendId: userId }
      }
    });
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: true,
        friend: true
      }
    });

    return friendships.map((f: any) => f.userId === userId ? f.friend : f.user);
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING'
      },
      include: { user: true }
    });
    return requests.map((r: any) => r.user);
  }
}
