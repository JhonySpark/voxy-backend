var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { FRIENDSHIP_REPOSITORY } from '../core/ports/repositories/friendship.repository.port.js';
import { Friendship } from '../modules/friends/domain/entities/friendship.entity.js';
let FriendsService = class FriendsService {
    friendshipRepo;
    constructor(friendshipRepo) {
        this.friendshipRepo = friendshipRepo;
    }
    async sendFriendRequest(userId, friendId) {
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
    async acceptFriendRequest(userId, friendId) {
        await this.friendshipRepo.updateStatus(friendId, userId, 'ACCEPTED');
        return {
            status: 'ACCEPTED',
        };
    }
    async rejectFriendRequest(userId, friendId) {
        await this.friendshipRepo.delete(friendId, userId);
        return {
            success: true,
        };
    }
    async getFriends(userId) {
        return this.friendshipRepo.findFriends(userId);
    }
    async getPendingRequests(userId) {
        return this.friendshipRepo.findPendingRequests(userId);
    }
};
FriendsService = __decorate([
    Injectable(),
    __param(0, Inject(FRIENDSHIP_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], FriendsService);
export { FriendsService };
//# sourceMappingURL=friends.service.js.map