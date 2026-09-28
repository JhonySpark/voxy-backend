import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    message: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      message: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveMessage', () => {
    it('should create message in prisma', async () => {
      const mockMessage = { id: 'm1', content: 'hello', senderId: 'u1', receiverId: 'u2' };
      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.saveMessage('u1', 'u2', 'hello');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          senderId: 'u1',
          receiverId: 'u2',
          content: 'hello',
        },
        include: {
          sender: true,
        },
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getMessagesBetweenUsers', () => {
    it('should query messages between two users in both directions', async () => {
      const mockMessages = [{ id: 'm1', content: 'hello' }];
      prisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessagesBetweenUsers('u1', 'u2');

      expect(prisma.message.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockMessages);
    });
  });
});
