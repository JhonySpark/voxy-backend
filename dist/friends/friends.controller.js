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
import { Controller, Post, Get, UseGuards, Request, Body, Param, NotFoundException } from '@nestjs/common';
import { FriendsService } from './friends.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
let FriendsController = class FriendsController {
    friendsService;
    prisma;
    constructor(friendsService, prisma) {
        this.friendsService = friendsService;
        this.prisma = prisma;
    }
    async sendRequest(req, username) {
        const friend = await this.prisma.user.findFirst({
            where: { username: { equals: username, mode: 'insensitive' } }
        });
        if (!friend)
            throw new NotFoundException('User not found');
        await this.friendsService.sendFriendRequest(req.user.sub, friend.id);
        return { success: true, targetId: friend.id };
    }
    async acceptRequest(req, friendId) {
        await this.friendsService.acceptFriendRequest(req.user.sub, friendId);
        return { success: true, targetId: friendId };
    }
    async rejectRequest(req, friendId) {
        await this.friendsService.rejectFriendRequest(req.user.sub, friendId);
        return { success: true, targetId: friendId };
    }
    async getFriends(req) {
        return this.friendsService.getFriends(req.user.sub);
    }
    async getRequests(req) {
        return this.friendsService.getPendingRequests(req.user.sub);
    }
};
__decorate([
    Post('request'),
    __param(0, Request()),
    __param(1, Body('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "sendRequest", null);
__decorate([
    Post('accept/:friendId'),
    __param(0, Request()),
    __param(1, Param('friendId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "acceptRequest", null);
__decorate([
    Post('reject/:friendId'),
    __param(0, Request()),
    __param(1, Param('friendId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "rejectRequest", null);
__decorate([
    Get(),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getFriends", null);
__decorate([
    Get('requests'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getRequests", null);
FriendsController = __decorate([
    UseGuards(AuthGuard),
    Controller('friends'),
    __metadata("design:paramtypes", [FriendsService, PrismaService])
], FriendsController);
export { FriendsController };
//# sourceMappingURL=friends.controller.js.map