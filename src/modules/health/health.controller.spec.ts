import { describe, it, expect, vi } from 'vitest';
import { HealthController } from './health.controller.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

describe('HealthController', () => {
  it('should return ok when database is healthy', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    const result = await controller.checkHealth();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.timestamp).toBeDefined();
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should throw ServiceUnavailableException when database fails', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('DB connection timeout')),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    await expect(controller.checkHealth()).rejects.toThrow();
  });
});
