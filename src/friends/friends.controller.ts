import { Controller, Post, Get, Delete, UseGuards, Request, Body, Param, NotFoundException } from '@nestjs/common';
import { FriendsService } from './friends.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@UseGuards(AuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService, private prisma: PrismaService) {}

  @Post('request')
  async sendRequest(@Request() req: any, @Body('username') username: string) {
    const friend = await this.prisma.user.findFirst({ 
      where: { username: { equals: username, mode: 'insensitive' } } 
    });
    if (!friend) throw new NotFoundException('User not found');
    await this.friendsService.sendFriendRequest(req.user.sub, friend.id);
    return { success: true, targetId: friend.id };
  }

  @Post('accept/:friendId')
  async acceptRequest(@Request() req: any, @Param('friendId') friendId: string) {
    await this.friendsService.acceptFriendRequest(req.user.sub, friendId);
    return { success: true, targetId: friendId };
  }

  @Post('reject/:friendId')
  async rejectRequest(@Request() req: any, @Param('friendId') friendId: string) {
    await this.friendsService.rejectFriendRequest(req.user.sub, friendId);
    return { success: true, targetId: friendId };
  }

  @Delete(':friendId')
  async deleteFriend(@Request() req: any, @Param('friendId') friendId: string) {
    await this.friendsService.removeFriend(req.user.sub, friendId);
    return { success: true, targetId: friendId };
  }

  @Post('remove/:friendId')
  async removeFriend(@Request() req: any, @Param('friendId') friendId: string) {
    await this.friendsService.removeFriend(req.user.sub, friendId);
    return { success: true, targetId: friendId };
  }

  @Post('block/:targetId')
  async blockUser(@Request() req: any, @Param('targetId') targetId: string) {
    await this.friendsService.blockUser(req.user.sub, targetId);
    return { success: true, targetId };
  }

  @Post('unblock/:targetId')
  async unblockUser(@Request() req: any, @Param('targetId') targetId: string) {
    await this.friendsService.unblockUser(req.user.sub, targetId);
    return { success: true, targetId };
  }

  @Get('blocked')
  async getBlockedUsers(@Request() req: any) {
    return this.friendsService.getBlockedUsers(req.user.sub);
  }

  @Get('status/:targetId')
  async getRelationshipStatus(@Request() req: any, @Param('targetId') targetId: string) {
    return this.friendsService.getUserRelationshipStatus(req.user.sub, targetId);
  }

  @Get()
  async getFriends(@Request() req: any) {
    return this.friendsService.getFriends(req.user.sub);
  }

  @Get('requests')
  async getRequests(@Request() req: any) {
    return this.friendsService.getPendingRequests(req.user.sub);
  }
}

