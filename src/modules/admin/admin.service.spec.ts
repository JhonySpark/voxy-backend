import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
  let service: AdminService;
  let mockPrisma: any;
  let mockChatGateway: any;
  let mockSystemConfigService: any;
  let mockModerationService: any;
  let mockSecurityAuditService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(100),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        update: vi.fn(),
        groupBy: vi.fn().mockResolvedValue([
          { ageClassification: 'ADULT', _count: { id: 70 } },
          { ageClassification: 'TEEN', _count: { id: 30 } },
        ]),
      },
      server: {
        count: vi.fn().mockResolvedValue(15),
        findMany: vi.fn().mockResolvedValue([]),
      },
      moderationReport: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
      },
    };

    mockChatGateway = {
      getOnlineUsersCount: vi.fn().mockReturnValue(42),
      getVoiceUsersCount: vi.fn().mockReturnValue(12),
      getOnlineUserIds: vi.fn().mockReturnValue(['user-1', 'user-2']),
    };

    mockSystemConfigService = {
      getAppStatus: vi.fn().mockResolvedValue({
        allowRegistrations: true,
        maxBetaUsers: 50,
        currentUsers: 100,
        remainingSlots: 0,
        isBetaOpen: false,
      }),
      getConfig: vi.fn().mockResolvedValue({
        allowRegistrations: true,
        maxBetaUsers: 50,
      }),
      updateConfig: vi.fn().mockResolvedValue({}),
    };

    mockModerationService = {
      resolveReport: vi.fn().mockResolvedValue({}),
      suspendAccount: vi.fn().mockResolvedValue({}),
      suspendServer: vi.fn().mockResolvedValue({}),
      unsuspendServer: vi.fn().mockResolvedValue({}),
    };

    mockSecurityAuditService = {
      record: vi.fn().mockResolvedValue({}),
      getGlobalAuditLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
    };

    service = new AdminService(
      mockPrisma,
      mockChatGateway,
      mockSystemConfigService,
      mockModerationService,
      mockSecurityAuditService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return consolidated dashboard stats including online and voice users', async () => {
    const stats = await service.getDashboardStats();

    expect(stats.onlineUsers).toBe(42);
    expect(stats.voiceUsers).toBe(12);
    expect(stats.totalUsers).toBe(100);
    expect(stats.totalServers).toBe(15);
    expect(stats.ageDemographics.ADULT).toBe(70);
    expect(stats.ageDemographics.TEEN).toBe(30);
    expect(mockChatGateway.getOnlineUsersCount).toHaveBeenCalled();
    expect(mockChatGateway.getVoiceUsersCount).toHaveBeenCalled();
  });

  it('should enrich users with isOnline status', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'user-1', username: 'online_user', email: 'u1@test.com' },
      { id: 'user-3', username: 'offline_user', email: 'u3@test.com' },
    ]);

    const result = await service.getUsers({ page: '1', limit: '20' });

    expect(result.users).toHaveLength(2);
    expect(result.users[0].isOnline).toBe(true);
    expect(result.users[1].isOnline).toBe(false);
  });
});
