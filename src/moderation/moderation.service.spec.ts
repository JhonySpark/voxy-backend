import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModerationService } from './moderation.service.js';
import {
  ReportTargetTypeEnum,
  ReportReasonEnum,
  ReportStatusEnum,
} from '../core/enums/index.js';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('ModerationService', () => {
  let service: ModerationService;
  let moderationRepo: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    countPending: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    server: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    moderationRepo = {
      create: vi.fn().mockImplementation((r) => Promise.resolve(r)),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn().mockImplementation((r) => Promise.resolve(r)),
      countPending: vi.fn(),
    };
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      server: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new ModerationService(moderationRepo as any, prisma as any);
  });

  describe('createReport', () => {
    it('should throw if reporter is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.createReport('nonexistent', {
          targetType: ReportTargetTypeEnum.USER,
          targetUserId: 'u2',
          reason: ReportReasonEnum.CHILD_SAFETY_EXPLOITATION,
          description: 'Relato suspeito.',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if reporter is suspended', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isSuspended: true });
      await expect(
        service.createReport('u1', {
          targetType: ReportTargetTypeEnum.USER,
          targetUserId: 'u2',
          reason: ReportReasonEnum.CHILD_SAFETY_EXPLOITATION,
          description: 'Relato suspeito.',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if target user reports themselves', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isSuspended: false });
      await expect(
        service.createReport('u1', {
          targetType: ReportTargetTypeEnum.USER,
          targetUserId: 'u1',
          reason: ReportReasonEnum.HARASSMENT_BULLYING,
          description: 'Me reportando.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create a report for user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u1', isSuspended: false }) // reporter
        .mockResolvedValueOnce({ id: 'u2' }); // target user

      const res = await service.createReport('u1', {
        targetType: ReportTargetTypeEnum.USER,
        targetUserId: 'u2',
        reason: ReportReasonEnum.CHILD_SAFETY_EXPLOITATION,
        description: 'Usuário assediando menores no chat.',
      });

      expect(res.targetType).toBe(ReportTargetTypeEnum.USER);
      expect(res.targetUserId).toBe('u2');
      expect(moderationRepo.create).toHaveBeenCalled();
    });
  });

  describe('suspendServer and unsuspendServer', () => {
    it('should suspend server', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 's1', name: 'Comunidade Perigosa' });
      prisma.server.update.mockResolvedValue({ id: 's1', isSuspended: true });

      const res = await service.suspendServer('mod1', 's1', 'Violação reiterada do ECA.');
      expect(res.success).toBe(true);
      expect(prisma.server.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({ isSuspended: true }),
        }),
      );
    });

    it('should unsuspend server', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 's1', name: 'Comunidade Segura' });
      prisma.server.update.mockResolvedValue({ id: 's1', isSuspended: false });

      const res = await service.unsuspendServer('mod1', 's1');
      expect(res.success).toBe(true);
      expect(prisma.server.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({ isSuspended: false }),
        }),
      );
    });
  });

  describe('suspendAccount and unsuspendAccount', () => {
    it('should suspend global account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', username: 'infrator' });
      prisma.user.update.mockResolvedValue({ id: 'u2', isSuspended: true });

      const res = await service.suspendAccount('mod1', 'u2', 'Comportamento predatório em relação a menores.');
      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u2' },
          data: expect.objectContaining({ isSuspended: true }),
        }),
      );
    });

    it('should unsuspend global account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', username: 'infrator' });
      prisma.user.update.mockResolvedValue({ id: 'u2', isSuspended: false });

      const res = await service.unsuspendAccount('mod1', 'u2');
      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u2' },
          data: expect.objectContaining({ isSuspended: false }),
        }),
      );
    });
  });
});
