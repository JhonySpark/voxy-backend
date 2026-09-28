import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service.js';
import { FRIENDSHIP_REPOSITORY, IFriendshipRepository } from '../core/ports/repositories/friendship.repository.port.js';
import { BadRequestException } from '@nestjs/common';
import { Friendship } from '../modules/friends/domain/entities/friendship.entity.js';

describe('FriendsService', () => {
  let service: FriendsService;
  let friendshipRepo: {
    findFriendship: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    findFriends: ReturnType<typeof vi.fn>;
    findPendingRequests: ReturnType<typeof vi.fn>;
  };

  const createMockFriendship = (id: string, userId: string, friendId: string, status: 'PENDING' | 'ACCEPTED' = 'PENDING') => {
    return Friendship.create({ userId, friendId, status }, id).getValue();
  };

  beforeEach(async () => {
    friendshipRepo = {
      findFriendship: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      findFriends: vi.fn(),
      findPendingRequests: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: FRIENDSHIP_REPOSITORY, useValue: friendshipRepo },
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
      const existing = createMockFriendship('f1', 'u1', 'u2', 'PENDING');
      friendshipRepo.findFriendship.mockResolvedValue(existing);

      await expect(service.sendFriendRequest('u1', 'u2')).rejects.toThrow(BadRequestException);
    });

    it('should create friendship with status PENDING', async () => {
      friendshipRepo.findFriendship.mockResolvedValue(null);
      const mockFriendship = createMockFriendship('f1', 'u1', 'u2', 'PENDING');
      friendshipRepo.create.mockResolvedValue(mockFriendship);

      const result = await service.sendFriendRequest('u1', 'u2');

      expect(friendshipRepo.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'f1',
        userId: 'u1',
        friendId: 'u2',
        status: 'PENDING',
      });
    });
  });

  describe('acceptFriendRequest', () => {
    it('should update status to ACCEPTED', async () => {
      friendshipRepo.updateStatus.mockResolvedValue(undefined);

      const result = await service.acceptFriendRequest('u1', 'u2');

      expect(friendshipRepo.updateStatus).toHaveBeenCalledWith('u2', 'u1', 'ACCEPTED');
      expect(result).toEqual({ status: 'ACCEPTED' });
    });
  });

  describe('rejectFriendRequest', () => {
    it('should delete the friendship', async () => {
      friendshipRepo.delete.mockResolvedValue(undefined);

      const result = await service.rejectFriendRequest('u1', 'u2');

      expect(friendshipRepo.delete).toHaveBeenCalledWith('u2', 'u1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getFriends', () => {
    it('should return friends list from repository', async () => {
      const mockFriends = [
        { id: 'u2', username: 'friendA' },
        { id: 'u3', username: 'friendB' },
      ];
      friendshipRepo.findFriends.mockResolvedValue(mockFriends);

      const result = await service.getFriends('u1');

      expect(friendshipRepo.findFriends).toHaveBeenCalledWith('u1');
      expect(result).toEqual(mockFriends);
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending requests users from repository', async () => {
      const mockRequests = [{ id: 'u2', username: 'requester' }];
      friendshipRepo.findPendingRequests.mockResolvedValue(mockRequests);

      const result = await service.getPendingRequests('u1');

      expect(friendshipRepo.findPendingRequests).toHaveBeenCalledWith('u1');
      expect(result).toEqual(mockRequests);
    });
  });
});
