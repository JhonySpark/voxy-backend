import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

vi.mock('livekit-server-sdk', () => {
  return {
    AccessToken: class {
      addGrant = vi.fn();
      toJwt = vi.fn().mockResolvedValue('mock_livekit_jwt');
    },
  };
});

describe('ChannelsService', () => {
  let service: ChannelsService;
  let prisma: {
    serverMember: { findUnique: ReturnType<typeof vi.fn> };
    channel: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
    channelMessage: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      serverMember: { findUnique: vi.fn() },
      channel: { findUnique: vi.fn(), create: vi.fn() },
      channelMessage: { findMany: vi.fn(), create: vi.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChannel', () => {
    it('should throw ForbiddenException if user is not OWNER', async () => {
      prisma.serverMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(service.createChannel('s1', 'u1', 'new-channel')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not member at all', async () => {
      prisma.serverMember.findUnique.mockResolvedValue(null);

      await expect(service.createChannel('s1', 'u1', 'new-channel')).rejects.toThrow(ForbiddenException);
    });

    it('should create channel if user is OWNER', async () => {
      prisma.serverMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      const mockChannel = { id: 'c1', name: 'general', type: 'TEXT', serverId: 's1' };
      prisma.channel.create.mockResolvedValue(mockChannel);

      const result = await service.createChannel('s1', 'u1', 'general', 'TEXT');

      expect(prisma.channel.create).toHaveBeenCalledWith({
        data: {
          name: 'general',
          type: 'TEXT',
          serverId: 's1',
        },
      });
      expect(result).toEqual(mockChannel);
    });
  });

  describe('getChannelMessages', () => {
    it('should throw NotFoundException if channel does not exist', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);

      await expect(service.getChannelMessages('c1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member of server', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prisma.serverMember.findUnique.mockResolvedValue(null);

      await expect(service.getChannelMessages('c1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should return channel messages if user is a member', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prisma.serverMember.findUnique.mockResolvedValue({ id: 'sm1' });
      const mockMessages = [{ id: 'm1', content: 'hello' }];
      prisma.channelMessage.findMany.mockResolvedValue(mockMessages);

      const result = await service.getChannelMessages('c1', 'u1');

      expect(prisma.channelMessage.findMany).toHaveBeenCalledWith({
        where: { channelId: 'c1' },
        orderBy: { createdAt: 'asc' },
        include: { sender: true },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('saveChannelMessage', () => {
    it('should throw NotFoundException if channel not found', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);

      await expect(service.saveChannelMessage('c1', 'u1', 'hello')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if sender not member', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prisma.serverMember.findUnique.mockResolvedValue(null);

      await expect(service.saveChannelMessage('c1', 'u1', 'hello')).rejects.toThrow(ForbiddenException);
    });

    it('should create channel message if sender is member', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prisma.serverMember.findUnique.mockResolvedValue({ id: 'sm1' });
      const mockSaved = { id: 'm1', content: 'hello', channelId: 'c1', senderId: 'u1' };
      prisma.channelMessage.create.mockResolvedValue(mockSaved);

      const result = await service.saveChannelMessage('c1', 'u1', 'hello');

      expect(prisma.channelMessage.create).toHaveBeenCalledWith({
        data: {
          content: 'hello',
          senderId: 'u1',
          channelId: 'c1',
        },
        include: { sender: true },
      });
      expect(result).toEqual(mockSaved);
    });
  });

  describe('getVoiceToken', () => {
    it('should throw NotFoundException if channel not found', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);

      await expect(service.getVoiceToken('c1', { sub: 'u1', username: 'user1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not member', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prisma.serverMember.findUnique.mockResolvedValue(null);

      await expect(service.getVoiceToken('c1', { sub: 'u1', username: 'user1' })).rejects.toThrow(ForbiddenException);
    });

    it('should return token when user is member', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prisma.serverMember.findUnique.mockResolvedValue({ id: 'sm1' });

      const result = await service.getVoiceToken('c1', { sub: 'u1', username: 'user1' });

      expect(result).toEqual({ token: 'mock_livekit_jwt' });
    });
  });
});
