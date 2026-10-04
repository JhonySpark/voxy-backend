import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServersController } from './servers.controller.js';
import { ServersService } from './servers.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

describe('ServersController', () => {
  let controller: ServersController;
  let serversService: {
    createServer: ReturnType<typeof vi.fn>;
    getUserServers: ReturnType<typeof vi.fn>;
    getServerById: ReturnType<typeof vi.fn>;
    joinServer: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    serversService = {
      createServer: vi.fn(),
      getUserServers: vi.fn(),
      getServerById: vi.fn(),
      joinServer: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServersController],
      providers: [
        { provide: ServersService, useValue: serversService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ServersController>(ServersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create server for authenticated user', async () => {
    const req = { user: { sub: 'u1' } };
    serversService.createServer.mockResolvedValue({ id: 's1', name: 'Server A' });

    const result = await controller.createServer(req, 'Server A');

    expect(serversService.createServer).toHaveBeenCalledWith('u1', 'Server A', undefined, undefined, undefined);
    expect(result).toEqual({ id: 's1', name: 'Server A' });
  });

  it('should return user servers', async () => {
    const req = { user: { sub: 'u1' } };
    serversService.getUserServers.mockResolvedValue([{ id: 's1' }]);

    const result = await controller.getUserServers(req);

    expect(serversService.getUserServers).toHaveBeenCalledWith('u1');
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('should return server by id', async () => {
    const req = { user: { sub: 'u1' } };
    serversService.getServerById.mockResolvedValue({ id: 's1' });

    const result = await controller.getServerById(req, 's1');

    expect(serversService.getServerById).toHaveBeenCalledWith('s1', 'u1');
    expect(result).toEqual({ id: 's1' });
  });

  it('should join server with invite code', async () => {
    const req = { user: { sub: 'u1' } };
    serversService.joinServer.mockResolvedValue({ id: 's1' });

    const result = await controller.joinServer(req, 'invite123');

    expect(serversService.joinServer).toHaveBeenCalledWith('invite123', 'u1');
    expect(result).toEqual({ id: 's1' });
  });
});
