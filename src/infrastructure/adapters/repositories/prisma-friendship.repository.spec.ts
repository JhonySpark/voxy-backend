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
});
