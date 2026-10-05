import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServersService } from './servers.service.js';
import { SERVER_REPOSITORY, IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { Server } from '../modules/servers/domain/entities/server.entity.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecurityAuditService } from '../moderation/security-audit.service.js';

describe('ServersService', () => {
  let service: ServersService;
  let serverRepo: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findUserServers: ReturnType<typeof vi.fn>;
    isMember: ReturnType<typeof vi.fn>;
    getMemberRole: ReturnType<typeof vi.fn>;
    addMember: ReturnType<typeof vi.fn>;
  };

  const createDomainServer = (id: string, name: string, ownerId: string) => {
    return Server.create(name, ownerId, id).getValue();
  };

  beforeEach(async () => {
    serverRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findUserServers: vi.fn(),
      isMember: vi.fn(),
      getMemberRole: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      softDelete: vi.fn(),
      isBanned: vi.fn().mockResolvedValue(false),
      banMember: vi.fn(),
      unbanMember: vi.fn(),
      getServerBans: vi.fn().mockResolvedValue([]),
      getServerMembers: vi.fn().mockResolvedValue([]),
      getRolePermissions: vi.fn().mockResolvedValue([]),
      upsertRolePermissions: vi.fn().mockResolvedValue({}),
    };

    const auditServiceMock = {
      record: vi.fn().mockResolvedValue(undefined),
      getServerAuditLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
      getGlobalAuditLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersService,
        { provide: SERVER_REPOSITORY, useValue: serverRepo },
        { provide: PrismaService, useValue: { server: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn().mockResolvedValue([]) } } },
        { provide: SecurityAuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = module.get<ServersService>(ServersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createServer', () => {
    it('should create a server with owner member and default channels', async () => {
      const server = createDomainServer('s1', 'My Server', 'u1');
      serverRepo.create.mockResolvedValue(server);

      const result = await service.createServer('u1', 'My Server');

      expect(serverRepo.create).toHaveBeenCalled();
      expect(result.id).toBe('s1');
      expect(result.name).toBe('My Server');
      expect(result.ownerId).toBe('u1');
      expect(result.channels).toHaveLength(2);
      expect(result.members).toHaveLength(1);
    });

    it('should throw ForbiddenException if server name is invalid', async () => {
      await expect(service.createServer('u1', '')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserServers', () => {
    it('should return all servers where user is a member', async () => {
      const server = createDomainServer('s1', 'Server 1', 'u1');
      serverRepo.findUserServers.mockResolvedValue([server]);

      const result = await service.getUserServers('u1');

      expect(serverRepo.findUserServers).toHaveBeenCalledWith('u1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
      expect(result[0].name).toBe('Server 1');
    });
  });

  describe('getServerById', () => {
    it('should throw ForbiddenException if user is not a member', async () => {
      serverRepo.isMember.mockResolvedValue(false);

      await expect(service.getServerById('s1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if server does not exist', async () => {
      serverRepo.isMember.mockResolvedValue(true);
      serverRepo.findById.mockResolvedValue(null);

      await expect(service.getServerById('s1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should return the server if user is a member', async () => {
      serverRepo.isMember.mockResolvedValue(true);
      const server = createDomainServer('s1', 'Server 1', 'u1');
      serverRepo.findById.mockResolvedValue(server);

      const result = await service.getServerById('s1', 'u1');

      expect(serverRepo.isMember).toHaveBeenCalledWith('s1', 'u1');
      expect(serverRepo.findById).toHaveBeenCalledWith('s1');
      expect(result.id).toBe('s1');
      expect(result.name).toBe('Server 1');
      expect(result.members).toBeDefined();
    });
  });

  describe('joinServer', () => {
    it('should throw NotFoundException if server does not exist', async () => {
      serverRepo.findById.mockResolvedValue(null);

      await expect(service.joinServer('invalid_id', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should return server without adding member if already a member', async () => {
      const server = createDomainServer('s1', 'Voxy', 'u_owner');
      serverRepo.findById.mockResolvedValue(server);
      serverRepo.isMember.mockResolvedValue(true);

      const result = await service.joinServer('s1', 'u1');

      expect(serverRepo.addMember).not.toHaveBeenCalled();
      expect(result.id).toBe('s1');
    });

    it('should add user as member and return server if not yet a member', async () => {
      const server = createDomainServer('s1', 'Voxy', 'u_owner');
      serverRepo.findById.mockResolvedValue(server);
      // First isMember check in joinServer returns false, second in getServerById returns true
      serverRepo.isMember
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      serverRepo.addMember.mockResolvedValue(undefined);

      const result = await service.joinServer('s1', 'u2');

      expect(serverRepo.addMember).toHaveBeenCalledWith('s1', 'u2', 'MEMBER');
      expect(result.id).toBe('s1');
    });
  });
});
