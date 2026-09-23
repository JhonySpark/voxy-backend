var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let FriendsService = class FriendsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendFriendRequest(userId, friendId) {
        if (userId === friendId) {
            throw new BadRequestException('Cannot add yourself');
        }
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
    async acceptFriendRequest(userId, friendId) {
        return this.prisma.friendship.update({
            where: {
                userId_friendId: { userId: friendId, friendId: userId }
            },
            data: {
                status: 'ACCEPTED'
            }
        });
    }
    async rejectFriendRequest(userId, friendId) {
        return this.prisma.friendship.delete({
            where: {
                userId_friendId: { userId: friendId, friendId: userId }
            }
        });
    }
    async getFriends(userId) {
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
        return friendships.map((f) => f.userId === userId ? f.friend : f.user);
    }
    async getPendingRequests(userId) {
        const requests = await this.prisma.friendship.findMany({
            where: {
                friendId: userId,
                status: 'PENDING'
            },
            include: { user: true }
        });
        return requests.map((r) => r.user);
    }
};
FriendsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], FriendsService);
export { FriendsService };
//# sourceMappingURL=friends.service.js.map