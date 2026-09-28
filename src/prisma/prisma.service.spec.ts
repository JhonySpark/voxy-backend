import { describe, it, expect, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      $connect = vi.fn();
      $disconnect = vi.fn();
    },
  };
});

vi.mock('pg', () => ({
  Pool: class {},
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {},
}));

describe('PrismaService', () => {
  it('should call $connect on onModuleInit', async () => {
    const service = new PrismaService();
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalled();
  });
});
