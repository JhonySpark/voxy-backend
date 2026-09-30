import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service.js';
import { CHANNEL_REPOSITORY, IChannelRepository } from '../core/ports/repositories/channel.repository.port.js';
import { SERVER_REPOSITORY, IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { VOICE_ENGINE_PORT, IVoiceEnginePort } from '../core/ports/voice-engine.port.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Channel } from '../modules/servers/domain/entities/channel.entity.js';
import { ChannelType } from '../modules/servers/domain/value-objects/channel-type.vo.js';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let channelRepo: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    getMessages: ReturnType<typeof vi.fn>;
    saveMessage: ReturnType<typeof vi.fn>;
  };
  let serverRepo: {
    getMemberRole: ReturnType<typeof vi.fn>;
    isMember: ReturnType<typeof vi.fn>;
  };
  let voiceEngine: {
    generateAccessToken: ReturnType<typeof vi.fn>;
  };

  const createDomainChannel = (id: string, name: string, serverId: string, type: 'TEXT' | 'VOICE' = 'TEXT') => {
    return Channel.create(
      {
        name,
        serverId,
        type: ChannelType.create(type).getValue(),
      },
      id
    ).getValue();
  };

  beforeEach(async () => {
    channelRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      getMessages: vi.fn(),
      saveMessage: vi.fn(),
    };
    serverRepo = {
      getMemberRole: vi.fn(),
      isMember: vi.fn(),
    };
    voiceEngine = {
      generateAccessToken: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: CHANNEL_REPOSITORY, useValue: channelRepo },
        { provide: SERVER_REPOSITORY, useValue: serverRepo },
        { provide: VOICE_ENGINE_PORT, useValue: voiceEngine },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChannel', () => {
    it('should throw ForbiddenException if user is not OWNER', async () => {
      serverRepo.getMemberRole.mockResolvedValue('MEMBER');

      await expect(service.createChannel('s1', 'u1', 'new-channel')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not member at all', async () => {
      serverRepo.getMemberRole.mockResolvedValue(null);

      await expect(service.createChannel('s1', 'u1', 'new-channel')).rejects.toThrow(ForbiddenException);
    });

    it('should create channel if user is OWNER', async () => {
      serverRepo.getMemberRole.mockResolvedValue('OWNER');
      const domainChannel = createDomainChannel('c1', 'general', 's1', 'TEXT');
      channelRepo.create.mockResolvedValue(domainChannel);

      const result = await service.createChannel('s1', 'u1', 'general', 'TEXT');

      expect(channelRepo.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'c1',
        name: 'general',
        type: 'TEXT',
        serverId: 's1',
      });
    });

    it('should throw ForbiddenException if channel name is invalid', async () => {
      serverRepo.getMemberRole.mockResolvedValue('OWNER');

      await expect(service.createChannel('s1', 'u1', '')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getChannelMessages', () => {
    it('should throw NotFoundException if channel does not exist', async () => {
      channelRepo.findById.mockResolvedValue(null);

      await expect(service.getChannelMessages('c1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member of server', async () => {
      const channel = createDomainChannel('c1', 'general', 's1');
      channelRepo.findById.mockResolvedValue(channel);
      serverRepo.isMember.mockResolvedValue(false);

      await expect(service.getChannelMessages('c1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should return channel messages if user is a member', async () => {
      const channel = createDomainChannel('c1', 'general', 's1');
      channelRepo.findById.mockResolvedValue(channel);
      serverRepo.isMember.mockResolvedValue(true);
      const mockMessages = [{ id: 'm1', content: 'hello' }];
      channelRepo.getMessages.mockResolvedValue(mockMessages);

      const result = await service.getChannelMessages('c1', 'u1');

      expect(channelRepo.getMessages).toHaveBeenCalledWith('c1');
      expect(result).toEqual(mockMessages);
    });
  });

  describe('saveChannelMessage', () => {
    it('should throw NotFoundException if channel not found', async () => {
      channelRepo.findById.mockResolvedValue(null);

      await expect(service.saveChannelMessage('c1', 'u1', 'hello')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if sender not member', async () => {
      const channel = createDomainChannel('c1', 'general', 's1');
      channelRepo.findById.mockResolvedValue(channel);
      serverRepo.isMember.mockResolvedValue(false);

      await expect(service.saveChannelMessage('c1', 'u1', 'hello')).rejects.toThrow(ForbiddenException);
    });

    it('should create channel message if sender is member', async () => {
      const channel = createDomainChannel('c1', 'general', 's1');
      channelRepo.findById.mockResolvedValue(channel);
      serverRepo.isMember.mockResolvedValue(true);
      const mockSaved = { id: 'm1', content: 'hello', channelId: 'c1', senderId: 'u1' };
      channelRepo.saveMessage.mockResolvedValue(mockSaved);

      const result = await service.saveChannelMessage('c1', 'u1', 'hello');

      expect(channelRepo.saveMessage).toHaveBeenCalledWith('c1', 'u1', 'hello', undefined);
      expect(result).toEqual(mockSaved);
    });
  });

  describe('getVoiceToken', () => {
    it('should throw NotFoundException if channel not found', async () => {
      channelRepo.findById.mockResolvedValue(null);

      await expect(service.getVoiceToken('c1', { sub: 'u1', username: 'user1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not member', async () => {
      const channel = createDomainChannel('c1', 'voice-room', 's1', 'VOICE');
      channelRepo.findById.mockResolvedValue(channel);
      serverRepo.isMember.mockResolvedValue(false);

      await expect(service.getVoiceToken('c1', { sub: 'u1', username: 'user1' })).rejects.toThrow(ForbiddenException);
    });

    it('should return token when user is member', async () => {
      const channel = createDomainChannel('c1', 'voice-room', 's1', 'VOICE');
      channelRepo.findById.mockResolvedValue(channel);
      serverRepo.isMember.mockResolvedValue(true);
      voiceEngine.generateAccessToken.mockResolvedValue('mock_voice_token');

      const result = await service.getVoiceToken('c1', { sub: 'u1', username: 'user1' });

      expect(voiceEngine.generateAccessToken).toHaveBeenCalledWith({
        roomName: 'c1',
        participantId: 'u1',
        participantName: 'user1',
      });
      expect(result).toEqual({ token: 'mock_voice_token' });
    });
  });
});
