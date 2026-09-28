import { describe, it, expect, vi } from 'vitest';
import { PrismaChannelRepository } from './prisma-channel.repository.js';
import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../../../modules/servers/domain/value-objects/channel-type.vo.js';

describe('PrismaChannelRepository', () => {
  let repo: PrismaChannelRepository;
  let prismaMock: {
    channel: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    channelMessage: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      channel: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      channelMessage: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
    repo = new PrismaChannelRepository(prismaMock as any);
  });

  const domainChannel = Channel.create(
    {
      name: 'rules',
      type: ChannelType.text(),
      serverId: 's1',
    },
    'c1'
  ).getValue();

  it('should create channel and map to domain', async () => {
    prismaMock.channel.create.mockResolvedValue({
      id: 'c1',
      name: 'rules',
      type: 'TEXT',
      serverId: 's1',
      createdAt: new Date(),
    });

    const created = await repo.create(domainChannel);
    expect(prismaMock.channel.create).toHaveBeenCalled();
    expect(created.id).toBe('c1');
    expect(created.name).toBe('rules');
    expect(created.type.isText()).toBe(true);
  });

  it('should find channel by id or return null', async () => {
    prismaMock.channel.findUnique.mockResolvedValueOnce({
      id: 'c1',
      name: 'rules',
      type: 'TEXT',
      serverId: 's1',
    }).mockResolvedValueOnce(null);

    const found = await repo.findById('c1');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('rules');

    const notFound = await repo.findById('c999');
    expect(notFound).toBeNull();
  });

  it('should find server channels', async () => {
    prismaMock.channel.findMany.mockResolvedValue([
      { id: 'c1', name: 'rules', type: 'TEXT', serverId: 's1' },
      { id: 'c2', name: 'voice', type: 'VOICE', serverId: 's1' },
    ]);

    const channels = await repo.findServerChannels('s1');
    expect(channels).toHaveLength(2);
    expect(channels[1].type.isVoice()).toBe(true);
  });

  it('should save and retrieve messages for a channel', async () => {
    prismaMock.channelMessage.create.mockResolvedValue({ id: 'm1', content: 'hey', channelId: 'c1', senderId: 'u1' });
    prismaMock.channelMessage.findMany.mockResolvedValue([{ id: 'm1', content: 'hey' }]);

    const saved = await repo.saveMessage('c1', 'u1', 'hey');
    expect(prismaMock.channelMessage.create).toHaveBeenCalled();
    expect(saved.id).toBe('m1');

    const messages = await repo.getMessages('c1');
    expect(prismaMock.channelMessage.findMany).toHaveBeenCalled();
    expect(messages).toHaveLength(1);
  });
});
