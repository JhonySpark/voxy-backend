import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServersService } from './servers.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ServersService', () => {
  let service: ServersService;
  let prisma: {
    server: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    serverMember: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      server: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      serverMember: {
        findUnique: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ServersService>(ServersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createServer', () => {
    it('should create a server with owner member and default channels', async () => {
      const mockCreated = { id: 's1', name: 'My Server', ownerId: 'u1', channels: [] };
      prisma.server.create.mockResolvedValue(mockCreated);

      const result = await service.createServer('u1', 'My Server');

      expect(prisma.server.create).toHaveBeenCalledWith({
        data: {
          name: 'My Server',
          ownerId: 'u1',
          members: {
            create: [{ userId: 'u1', role: 'OWNER' }],
          },
          channels: {
            create: [
              { name: 'geral', type: 'TEXT' },
              { name: 'Voz Geral', type: 'VOICE' },
            ],
          },
        },
        include: {
          channels: true,
        },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('getUserServers', () => {
    it('should return all servers where user is a member', async () => {
      const mockServers = [{ id: 's1', name: 'Server 1', channels: [] }];
      prisma.server.findMany.mockResolvedValue(mockServers);

      const result = await service.getUserServers('u1');

      expect(prisma.server.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: { userId: 'u1' },
          },
        },
        include: {
          channels: true,
        },
      });
      expect(result).toEqual(mockServers);
    });
  });

  describe('getServerById', () => {
    it('should throw ForbiddenException if user is not a member', async () => {
      prisma.serverMember.findUnique.mockResolvedValue(null);

      await expect(service.getServerById('s1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should return the server if user is a member', async () => {
      prisma.serverMember.findUnique.mockResolvedValue({ id: 'sm1', serverId: 's1', userId: 'u1' });
      const mockServer = { id: 's1', name: 'Server 1', channels: [], members: [] };
      prisma.server.findUnique.mockResolvedValue(mockServer);

      const result = await service.getServerById('s1', 'u1');

      expect(prisma.serverMember.findUnique).toHaveBeenCalledWith({
        where: {
          serverId_userId: { serverId: 's1', userId: 'u1' },
        },
      });
      expect(prisma.server.findUnique).toHaveBeenCalledWith({
        where: { id: 's1' },
        include: {
          channels: true,
          members: {
            include: { user: { select: { id: true, username: true } } },
          },
        },
      });
      expect(result).toEqual(mockServer);
    });
  });

  describe('joinServer', () => {
    it('should throw NotFoundException if server does not exist', async () => {
      prisma.server.findUnique.mockResolvedValue(null);

      await expect(service.joinServer('invalid_id', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should return server without adding member if already a member', async () => {
      prisma.server.findUnique.mockImplementation(({ where }) => {
        if (where.id === 's1') return Promise.resolve({ id: 's1', name: 'Voxy' });
        return Promise.resolve(null);
      });
      prisma.serverMember.findUnique.mockResolvedValue({ id: 'sm1', serverId: 's1', userId: 'u1' });

      const result = await service.joinServer('s1', 'u1');

      expect(prisma.server.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should add user as member and return server if not yet a member', async () => {
      prisma.server.findUnique.mockImplementation(({ where }) => {
        if (where.id === 's1') return Promise.resolve({ id: 's1', name: 'Voxy' });
        return Promise.resolve(null);
      });
      // First check in joinServer: not member
      // Second check in getServerById: is member
      prisma.serverMember.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'sm2', serverId: 's1', userId: 'u2' });

      prisma.server.update.mockResolvedValue({ id: 's1' });

      const result = await service.joinServer('s1', 'u2');

      expect(prisma.server.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: {
          members: {
            create: { userId: 'u2', role: 'MEMBER' },
          },
        },
      });
      expect(result).toBeDefined();
    });
  });
});
