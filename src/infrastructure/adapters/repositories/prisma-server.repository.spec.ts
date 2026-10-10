import { describe, it, expect, vi } from 'vitest';
import { PrismaServerRepository } from './prisma-server.repository.js';
import { Server } from '../../../modules/servers/domain/entities/server.entity.js';

describe('PrismaServerRepository', () => {
  let repo: PrismaServerRepository;
  let prismaMock: {
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

  beforeEach(() => {
    prismaMock = {
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
    repo = new PrismaServerRepository(prismaMock as any);
  });

  const domainServer = Server.create('Devs', 'u1', 's1').getValue();

  it('should create server with channels and members and map to domain', async () => {
    prismaMock.server.create.mockResolvedValue({
      id: 's1',
      name: 'Devs',
      ownerId: 'u1',
      channels: [{ id: 'c1', name: 'geral', type: 'TEXT', serverId: 's1' }],
      members: [{ id: 'm1', userId: 'u1', role: 'OWNER', serverId: 's1', user: { username: 'owner' } }],
    });

    const created = await repo.create(domainServer);
    expect(prismaMock.server.create).toHaveBeenCalled();
    expect(created.id).toBe('s1');
    expect(created.channels).toHaveLength(1);
    expect(created.members).toHaveLength(1);
  });

  it('should find user servers', async () => {
    prismaMock.server.findMany.mockResolvedValue([
      {
        id: 's1',
        name: 'Devs',
        ownerId: 'u1',
        channels: [],
        members: [],
      },
    ]);

    const servers = await repo.findUserServers('u1');
    expect(prismaMock.server.findMany).toHaveBeenCalled();
    expect(servers).toHaveLength(1);
    expect(servers[0].id).toBe('s1');
  });

  it('should find server by id or return null', async () => {
    prismaMock.server.findUnique.mockResolvedValueOnce({
      id: 's1',
      name: 'Devs',
      ownerId: 'u1',
      channels: [],
      members: [],
    }).mockResolvedValueOnce(null);

    const found = await repo.findById('s1');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Devs');

    const notFound = await repo.findById('s999');
    expect(notFound).toBeNull();
  });

  it('should check if user is member', async () => {
    prismaMock.serverMember.findUnique.mockResolvedValueOnce({ id: 'm1' }).mockResolvedValueOnce(null);

    expect(await repo.isMember('s1', 'u1')).toBe(true);
    expect(await repo.isMember('s1', 'u2')).toBe(false);
  });

  it('should get member role', async () => {
    prismaMock.serverMember.findUnique.mockResolvedValueOnce({ role: 'OWNER' }).mockResolvedValueOnce(null);

    expect(await repo.getMemberRole('s1', 'u1')).toBe('OWNER');
    expect(await repo.getMemberRole('s1', 'u2')).toBeNull();
  });

  it('should add member to server', async () => {
    prismaMock.server.update.mockResolvedValue({ id: 's1' });

    await repo.addMember('s1', 'u2', 'MEMBER');
    expect(prismaMock.server.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        members: {
          create: { userId: 'u2', role: 'MEMBER' },
        },
      },
    });
  });

  it('should update server details and icon and map to domain', async () => {
    prismaMock.server.update.mockResolvedValue({
      id: 's1',
      name: 'New Server Name',
      ownerId: 'u1',
      iconUrl: 'https://r2.voxychat.com.br/icon.webp',
      iconKey: 'servers/icon.webp',
      channels: [],
      members: [],
    });

    domainServer.updateName('New Server Name', 'u1');
    domainServer.updateIcon('https://r2.voxychat.com.br/icon.webp', 'servers/icon.webp', 'u1');

    const updated = await repo.update(domainServer);
    expect(prismaMock.server.update).toHaveBeenCalled();
    expect(updated.name).toBe('New Server Name');
    expect(updated.iconUrl).toBe('https://r2.voxychat.com.br/icon.webp');
  });
});
