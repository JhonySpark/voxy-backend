import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    prisma = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user in prisma', async () => {
      const input = { username: 'test', email: 'test@example.com', password: 'hash' };
      const expected = { id: 'u1', ...input };
      prisma.user.create.mockResolvedValue(expected);

      const result = await service.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(expected);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const expected = { id: 'u1', username: 'john' };
      prisma.user.findUnique.mockResolvedValue(expected);

      const result = await service.findByUsername('john');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'john' } });
      expect(result).toEqual(expected);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const expected = { id: 'u1', email: 'john@example.com' };
      prisma.user.findUnique.mockResolvedValue(expected);

      const result = await service.findByEmail('john@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const expected = { id: 'u1', username: 'john' };
      prisma.user.findUnique.mockResolvedValue(expected);

      const result = await service.findById('u1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(result).toEqual(expected);
    });
  });
});
