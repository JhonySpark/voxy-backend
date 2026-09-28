import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

describe('FriendsService', () => {
  let service: FriendsService;
  let prisma: {
    friendship: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      friendship: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendFriendRequest', () => {
    it('should throw BadRequestException if adding yourself', async () => {
      await expect(service.sendFriendRequest('u1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if request already exists', async () => {
      prisma.friendship.findUnique.mockResolvedValue({ id: 'f1', status: 'PENDING' });

      await expect(service.sendFriendRequest('u1', 'u2')).rejects.toThrow(BadRequestException);
    });

    it('should create friendship with status PENDING', async () => {
      prisma.friendship.findUnique.mockResolvedValue(null);
      const mockFriendship = { id: 'f1', userId: 'u1', friendId: 'u2', status: 'PENDING' };
      prisma.friendship.create.mockResolvedValue(mockFriendship);

      const result = await service.sendFriendRequest('u1', 'u2');

      expect(prisma.friendship.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          friendId: 'u2',
          status: 'PENDING',
        },
      });
      expect(result).toEqual(mockFriendship);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should update status to ACCEPTED', async () => {
      const mockAccepted = { id: 'f1', status: 'ACCEPTED' };
      prisma.friendship.update.mockResolvedValue(mockAccepted);

      const result = await service.acceptFriendRequest('u1', 'u2');

      expect(prisma.friendship.update).toHaveBeenCalledWith({
        where: {
          userId_friendId: { userId: 'u2', friendId: 'u1' },
        },
        data: {
          status: 'ACCEPTED',
        },
      });
      expect(result).toEqual(mockAccepted);
    });
  });

  describe('rejectFriendRequest', () => {
    it('should delete the friendship', async () => {
      prisma.friendship.delete.mockResolvedValue({ id: 'f1' });

      const result = await service.rejectFriendRequest('u1', 'u2');

      expect(prisma.friendship.delete).toHaveBeenCalledWith({
        where: {
          userId_friendId: { userId: 'u2', friendId: 'u1' },
        },
      });
      expect(result).toEqual({ id: 'f1' });
    });
  });

  describe('getFriends', () => {
    it('should return friends mapping the other user', async () => {
      const mockFriendships = [
        { userId: 'u1', friendId: 'u2', user: { id: 'u1' }, friend: { id: 'u2', username: 'friendA' } },
        { userId: 'u3', friendId: 'u1', user: { id: 'u3', username: 'friendB' }, friend: { id: 'u1' } },
      ];
      prisma.friendship.findMany.mockResolvedValue(mockFriendships);

      const result = await service.getFriends('u1');

      expect(result).toEqual([
        { id: 'u2', username: 'friendA' },
        { id: 'u3', username: 'friendB' },
      ]);
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending requests users', async () => {
      const mockRequests = [
        { user: { id: 'u2', username: 'requester' } },
      ];
      prisma.friendship.findMany.mockResolvedValue(mockRequests);

      const result = await service.getPendingRequests('u1');

      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: {
          friendId: 'u1',
          status: 'PENDING',
        },
        include: { user: true },
      });
      expect(result).toEqual([{ id: 'u2', username: 'requester' }]);
    });
  });
});
