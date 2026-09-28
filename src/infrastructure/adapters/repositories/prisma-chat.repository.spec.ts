import { describe, it, expect, vi } from 'vitest';
import { PrismaChatRepository } from './prisma-chat.repository.js';

describe('PrismaChatRepository', () => {
  let repo: PrismaChatRepository;
  let prismaMock: {
    message: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      message: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
    repo = new PrismaChatRepository(prismaMock as any);
  });

  it('should save direct message', async () => {
    const savedMsg = { id: 'm1', senderId: 'u1', receiverId: 'u2', content: 'hello' };
    prismaMock.message.create.mockResolvedValue(savedMsg);

    const result = await repo.saveDirectMessage('u1', 'u2', 'hello');
    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: {
        senderId: 'u1',
        receiverId: 'u2',
        content: 'hello',
      },
      include: {
        sender: true,
      },
    });
    expect(result).toEqual(savedMsg);
  });

  it('should get direct messages between users', async () => {
    const messages = [{ id: 'm1', content: 'hello' }];
    prismaMock.message.findMany.mockResolvedValue(messages);

    const result = await repo.getDirectMessages('u1', 'u2');
    expect(prismaMock.message.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { senderId: 'u1', receiverId: 'u2' },
          { senderId: 'u2', receiverId: 'u1' },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: true,
      },
    });
    expect(result).toEqual(messages);
  });
});
