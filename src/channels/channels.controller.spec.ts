import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsController } from './channels.controller.js';
import { ChannelsService } from './channels.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

describe('ChannelsController', () => {
  let controller: ChannelsController;
  let channelsService: {
    createChannel: ReturnType<typeof vi.fn>;
    getChannelMessages: ReturnType<typeof vi.fn>;
    getVoiceToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    channelsService = {
      createChannel: vi.fn(),
      getChannelMessages: vi.fn(),
      getVoiceToken: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        { provide: ChannelsService, useValue: channelsService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChannelsController>(ChannelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a channel in server', async () => {
    const req = { user: { sub: 'u1' } };
    channelsService.createChannel.mockResolvedValue({ id: 'c1', name: 'general' });

    const result = await controller.createChannel(req, 's1', 'general', 'TEXT');

    expect(channelsService.createChannel).toHaveBeenCalledWith('s1', 'u1', 'general', 'TEXT');
    expect(result).toEqual({ id: 'c1', name: 'general' });
  });

  it('should get channel messages', async () => {
    const req = { user: { sub: 'u1' } };
    channelsService.getChannelMessages.mockResolvedValue([{ id: 'm1' }]);

    const result = await controller.getMessages(req, 'c1');

    expect(channelsService.getChannelMessages).toHaveBeenCalledWith('c1', 'u1');
    expect(result).toEqual([{ id: 'm1' }]);
  });

  it('should get voice token for channel', async () => {
    const req = { user: { sub: 'u1', username: 'testuser' } };
    channelsService.getVoiceToken.mockResolvedValue({ token: 'jwt123' });

    const result = await controller.getVoiceToken(req, 'c1');

    expect(channelsService.getVoiceToken).toHaveBeenCalledWith('c1', req.user);
    expect(result).toEqual({ token: 'jwt123' });
  });

  it('should get voice token for channel via GET', async () => {
    const req = { user: { sub: 'u1', username: 'testuser' } };
    channelsService.getVoiceToken.mockResolvedValue({ token: 'jwt123' });

    const result = await controller.getVoiceTokenGet(req, 'c1');

    expect(channelsService.getVoiceToken).toHaveBeenCalledWith('c1', req.user);
    expect(result).toEqual({ token: 'jwt123' });
  });
});
