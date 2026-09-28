import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service.js';
import { CHAT_REPOSITORY, IChatRepository } from '../core/ports/repositories/chat.repository.port.js';

describe('ChatService', () => {
  let service: ChatService;
  let chatRepo: {
    saveDirectMessage: ReturnType<typeof vi.fn>;
    getDirectMessages: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    chatRepo = {
      saveDirectMessage: vi.fn(),
      getDirectMessages: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: CHAT_REPOSITORY, useValue: chatRepo },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveMessage', () => {
    it('should save message through chat repository port', async () => {
      const mockMessage = { id: 'm1', content: 'hello', senderId: 'u1', receiverId: 'u2' };
      chatRepo.saveDirectMessage.mockResolvedValue(mockMessage);

      const result = await service.saveMessage('u1', 'u2', 'hello');

      expect(chatRepo.saveDirectMessage).toHaveBeenCalledWith('u1', 'u2', 'hello');
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getMessagesBetweenUsers', () => {
    it('should query direct messages through chat repository port', async () => {
      const mockMessages = [{ id: 'm1', content: 'hello' }];
      chatRepo.getDirectMessages.mockResolvedValue(mockMessages);

      const result = await service.getMessagesBetweenUsers('u1', 'u2');

      expect(chatRepo.getDirectMessages).toHaveBeenCalledWith('u1', 'u2');
      expect(result).toEqual(mockMessages);
    });
  });
});
