import { describe, it, expect, vi } from 'vitest';
import { PrismaFriendshipRepository } from './prisma-friendship.repository.js';
import { Friendship } from '../../../modules/friends/domain/entities/friendship.entity.js';

describe('PrismaFriendshipRepository', () => {
  let repo: PrismaFriendshipRepository;
  let prismaMock: {
    friendship: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      friendship: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
    };
    repo = new PrismaFriendshipRepository(prismaMock as any);
  });

  const domainFriendship = Friendship.create(
    {
      userId: 'u1',
      friendId: 'u2',
      status: 'PENDING',
    },
    'f1'
  ).getValue();

  it('should create friendship and map to domain', async () => {
    prismaMock.friendship.create.mockResolvedValue({
      id: 'f1',
      userId: 'u1',
      friendId: 'u2',
      status: 'PENDING',
      createdAt: new Date(),
    });

    const created = await repo.create(domainFriendship);
    expect(prismaMock.friendship.create).toHaveBeenCalled();
    expect(created.id).toBe('f1');
    expect(created.userId).toBe('u1');
    expect(created.friendId).toBe('u2');
  });

  it('should find friendship or return null', async () => {
    prismaMock.friendship.findUnique.mockResolvedValueOnce({
      id: 'f1',
      userId: 'u1',
      friendId: 'u2',
      status: 'PENDING',
    }).mockResolvedValueOnce(null);

    const found = await repo.findFriendship('u1', 'u2');
    expect(found).not.toBeNull();
    expect(found?.status).toBe('PENDING');

    const notFound = await repo.findFriendship('u1', 'u3');
    expect(notFound).toBeNull();
  });

  it('should update friendship status', async () => {
    prismaMock.friendship.update.mockResolvedValue({ id: 'f1' });

    await repo.updateStatus('u1', 'u2', 'ACCEPTED');
    expect(prismaMock.friendship.update).toHaveBeenCalledWith({
      where: {
        userId_friendId: { userId: 'u1', friendId: 'u2' },
      },
      data: { status: 'ACCEPTED' },
    });
  });

  it('should delete friendship', async () => {
    prismaMock.friendship.delete.mockResolvedValue({ id: 'f1' });

    await repo.delete('u1', 'u2');
    expect(prismaMock.friendship.delete).toHaveBeenCalledWith({
      where: {
        userId_friendId: { userId: 'u1', friendId: 'u2' },
      },
    });
  });

  it('should find friends mapping opposite user', async () => {
    prismaMock.friendship.findMany.mockResolvedValue([
      { userId: 'u1', friendId: 'u2', user: { id: 'u1' }, friend: { id: 'u2', username: 'bob' } },
      { userId: 'u3', friendId: 'u1', user: { id: 'u3', username: 'charlie' }, friend: { id: 'u1' } },
    ]);

    const friends = await repo.findFriends('u1');
    expect(friends).toEqual([
      { id: 'u2', username: 'bob' },
      { id: 'u3', username: 'charlie' },
    ]);
  });

  it('should find pending requests', async () => {
    prismaMock.friendship.findMany.mockResolvedValue([
      { user: { id: 'u2', username: 'bob' } },
    ]);

    const pending = await repo.findPendingRequests('u1');
    expect(pending).toEqual([{ id: 'u2', username: 'bob' }]);
  });

  it('should delete friendship bidirectionally', async () => {
    prismaMock.friendship.deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    await repo.deleteBidirectional('u1', 'u2');
    expect(prismaMock.friendship.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { userId: 'u1', friendId: 'u2' },
          { userId: 'u2', friendId: 'u1' },
        ],
      },
    });
  });

  it('should block user and remove friendship in transaction', async () => {
    (prismaMock as any).$transaction = vi.fn().mockResolvedValue([{}, { count: 1 }]);
    (prismaMock as any).blockedUser = {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    };
    prismaMock.friendship.deleteMany = vi.fn();

    await repo.blockUser('u1', 'u2');
    expect((prismaMock as any).$transaction).toHaveBeenCalled();
  });

  it('should unblock user', async () => {
    (prismaMock as any).blockedUser = {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    };

    await repo.unblockUser('u1', 'u2');
    expect((prismaMock as any).blockedUser.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', blockedId: 'u2' },
    });
  });

  it('should check isBlocked and hasBlocked', async () => {
    (prismaMock as any).blockedUser = {
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn().mockResolvedValue({ id: 'b1' }),
    };

    const blocked = await repo.isBlocked('u1', 'u2');
    expect(blocked).toBe(true);

    const hasBlocked = await repo.hasBlocked('u1', 'u2');
    expect(hasBlocked).toBe(true);
  });

  it('should find blocked users list', async () => {
    (prismaMock as any).blockedUser = {
      findMany: vi.fn().mockResolvedValue([
        { blocked: { id: 'u2', username: 'badguy', avatarUrl: null } },
      ]),
    };

    const list = await repo.findBlockedUsers('u1');
    expect(list).toEqual([{ id: 'u2', username: 'badguy', avatarUrl: null }]);
  });
});
