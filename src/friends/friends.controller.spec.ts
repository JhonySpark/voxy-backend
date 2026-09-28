import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';

describe('FriendsController', () => {
  let controller: FriendsController;
  let friendsService: {
    sendFriendRequest: ReturnType<typeof vi.fn>;
    acceptFriendRequest: ReturnType<typeof vi.fn>;
    rejectFriendRequest: ReturnType<typeof vi.fn>;
    getFriends: ReturnType<typeof vi.fn>;
    getPendingRequests: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    friendsService = {
      sendFriendRequest: vi.fn(),
      acceptFriendRequest: vi.fn(),
      rejectFriendRequest: vi.fn(),
      getFriends: vi.fn(),
      getPendingRequests: vi.fn(),
    };
    prisma = {
      user: {
        findFirst: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [
        { provide: FriendsService, useValue: friendsService },
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FriendsController>(FriendsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendRequest', () => {
    it('should throw NotFoundException if user is not found by username', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        controller.sendRequest({ user: { sub: 'u1' } }, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });

    it('should send friend request if user found', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u2', username: 'bob' });
      friendsService.sendFriendRequest.mockResolvedValue({ id: 'f1' });

      const result = await controller.sendRequest({ user: { sub: 'u1' } }, 'bob');

      expect(friendsService.sendFriendRequest).toHaveBeenCalledWith('u1', 'u2');
      expect(result).toEqual({ success: true, targetId: 'u2' });
    });
  });

  describe('acceptRequest', () => {
    it('should accept friend request', async () => {
      const result = await controller.acceptRequest({ user: { sub: 'u1' } }, 'u2');

      expect(friendsService.acceptFriendRequest).toHaveBeenCalledWith('u1', 'u2');
      expect(result).toEqual({ success: true, targetId: 'u2' });
    });
  });

  describe('rejectRequest', () => {
    it('should reject friend request', async () => {
      const result = await controller.rejectRequest({ user: { sub: 'u1' } }, 'u2');

      expect(friendsService.rejectFriendRequest).toHaveBeenCalledWith('u1', 'u2');
      expect(result).toEqual({ success: true, targetId: 'u2' });
    });
  });

  describe('getFriends', () => {
    it('should return friends list', async () => {
      friendsService.getFriends.mockResolvedValue([{ id: 'u2', username: 'bob' }]);

      const result = await controller.getFriends({ user: { sub: 'u1' } });

      expect(friendsService.getFriends).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: 'u2', username: 'bob' }]);
    });
  });

  describe('getRequests', () => {
    it('should return pending requests', async () => {
      friendsService.getPendingRequests.mockResolvedValue([{ id: 'u3', username: 'charlie' }]);

      const result = await controller.getRequests({ user: { sub: 'u1' } });

      expect(friendsService.getPendingRequests).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: 'u3', username: 'charlie' }]);
    });
  });
});
