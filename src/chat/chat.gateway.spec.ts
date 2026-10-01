import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: { saveMessage: ReturnType<typeof vi.fn> };
  let channelsService: { saveChannelMessage: ReturnType<typeof vi.fn> };
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };
  let mockServer: { to: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    chatService = { saveMessage: vi.fn() };
    channelsService = { saveChannelMessage: vi.fn() };
    jwtService = { verifyAsync: vi.fn() };
    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatService },
        { provide: ChannelsService, useValue: channelsService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should verify token and connect user', async () => {
      const mockSocket: any = {
        id: 'sock1',
        handshake: { auth: { token: 'valid_token' }, headers: {} },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn(),
      };
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', username: 'user1' });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid_token', { secret: expect.any(String) });
      expect(mockSocket.join).toHaveBeenCalledWith('u1');
      expect(mockSocket.data.user).toEqual({ sub: 'u1', username: 'user1' });
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect if token is missing', async () => {
      const mockSocket: any = {
        handshake: { auth: {}, headers: {} },
        disconnect: vi.fn(),
      };

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      const mockSocket: any = {
        handshake: { auth: { token: 'bad_token' }, headers: {} },
        disconnect: vi.fn(),
      };
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user when disconnected', () => {
      const mockSocket: any = {
        id: 'sock1',
        data: { user: { sub: 'u1' } },
      };

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('handleMessage', () => {
    it('should save direct message and emit to receiver and sender', async () => {
      const mockSocket: any = {
        id: 'sock1',
        data: { user: { sub: 'u1' } },
        emit: vi.fn(),
      };
      const mockSaved = { id: 'm1', content: 'hi', senderId: 'u1', receiverId: 'u2' };
      chatService.saveMessage.mockResolvedValue(mockSaved);

      const result = await gateway.handleMessage({ receiverId: 'u2', content: 'hi' }, mockSocket);

      expect(chatService.saveMessage).toHaveBeenCalledWith('u1', 'u2', 'hi', undefined);
      expect(mockServer.to).toHaveBeenCalledWith('u2');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', mockSaved);
      expect(mockSocket.emit).toHaveBeenCalledWith('messageSent', mockSaved);
      expect(result).toEqual(mockSaved);
    });
  });

  describe('channel join and leave', () => {
    it('should join channel room', () => {
      const mockSocket: any = { join: vi.fn() };
      gateway.handleJoinChannel({ channelId: 'c1' }, mockSocket);
      expect(mockSocket.join).toHaveBeenCalledWith('c1');
    });

    it('should leave channel room', () => {
      const mockSocket: any = { leave: vi.fn() };
      gateway.handleLeaveChannel({ channelId: 'c1' }, mockSocket);
      expect(mockSocket.leave).toHaveBeenCalledWith('c1');
    });
  });

  describe('handleChannelMessage', () => {
    it('should save channel message and broadcast to channel', async () => {
      const mockSocket: any = {
        data: { user: { sub: 'u1' } },
        emit: vi.fn(),
        to: vi.fn().mockReturnThis(),
      };
      const mockSaved = { id: 'cm1', content: 'hello channel', channelId: 'c1', senderId: 'u1' };
      channelsService.saveChannelMessage.mockResolvedValue(mockSaved);

      const result = await gateway.handleChannelMessage({ channelId: 'c1', content: 'hello channel' }, mockSocket);

      expect(channelsService.saveChannelMessage).toHaveBeenCalledWith('c1', 'u1', 'hello channel', undefined);
      expect(mockSocket.emit).toHaveBeenCalledWith('channelMessageSent', mockSaved);
      expect(mockSocket.to).toHaveBeenCalledWith('c1');
      expect(mockSocket.emit).toHaveBeenCalledWith('newChannelMessage', mockSaved);
      expect(result).toEqual(mockSaved);
    });

    it('should return error object if unauthorized', async () => {
      const mockSocket: any = {
        data: { user: { sub: 'u1' } },
      };
      channelsService.saveChannelMessage.mockRejectedValue(new Error('Forbidden'));

      const result = await gateway.handleChannelMessage({ channelId: 'c1', content: 'hello channel' }, mockSocket);

      expect(result).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('server and friend events', () => {
    it('should handle joinServer and leaveServer', () => {
      const mockSocket: any = { join: vi.fn(), leave: vi.fn(), emit: vi.fn() };
      gateway.handleJoinServer({ serverId: 's1' }, mockSocket);
      expect(mockSocket.join).toHaveBeenCalledWith('server-s1');

      gateway.handleLeaveServer({ serverId: 's1' }, mockSocket);
      expect(mockSocket.leave).toHaveBeenCalledWith('server-s1');
    });

    it('should handle friendAction', () => {
      const mockSocket: any = {};
      gateway.handleFriendAction({ targetId: 'u2' }, mockSocket);
      expect(mockServer.to).toHaveBeenCalledWith('u2');
      expect(mockServer.emit).toHaveBeenCalledWith('friendActionUpdate');
    });

    it('should handle channelCreated', () => {
      const mockSocket: any = {};
      gateway.handleChannelCreated({ serverId: 's1' }, mockSocket);
      expect(mockServer.to).toHaveBeenCalledWith('server-s1');
      expect(mockServer.emit).toHaveBeenCalledWith('serverUpdated');
    });
  });

  describe('voice signaling and state', () => {
    it('should handle joinVoice and leaveVoice', () => {
      const mockSocket: any = {
        id: 'sock1',
        data: { user: { sub: 'u1', username: 'user1' } },
        join: vi.fn(),
        leave: vi.fn(),
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };

      gateway.handleJoinVoice({ serverId: 's1', channelId: 'ch1' }, mockSocket);
      expect(mockSocket.join).toHaveBeenCalledWith('voice-ch1');
      expect(mockServer.to).toHaveBeenCalledWith('server-s1');

      gateway.handleUpdateVoiceMute({ serverId: 's1', channelId: 'ch1', isMuted: true }, mockSocket);
      expect(mockServer.to).toHaveBeenCalledWith('server-s1');

      gateway.handleLeaveVoice({ serverId: 's1', channelId: 'ch1' }, mockSocket);
      expect(mockSocket.leave).toHaveBeenCalledWith('voice-ch1');
    });

    it('should emit serverVoiceUpdate when joining server with active voice channels', () => {
      const socket1: any = {
        id: 'sock1',
        data: { user: { sub: 'u1', username: 'user1' } },
        join: vi.fn(),
        leave: vi.fn(),
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      gateway.handleJoinVoice({ serverId: 's1', channelId: 'ch1' }, socket1);

      const socket2: any = {
        id: 'sock2',
        join: vi.fn(),
        emit: vi.fn(),
      };
      gateway.handleJoinServer({ serverId: 's1' }, socket2);

      expect(socket2.emit).toHaveBeenCalledWith('serverVoiceUpdate', expect.objectContaining({
        channelId: 'ch1',
      }));
    });

    it('should replace previous socket instance when same user joins from another socket', () => {
      const socketOld: any = {
        id: 'sock_old',
        data: { user: { sub: 'u1', username: 'user1' } },
        join: vi.fn(),
        leave: vi.fn(),
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      gateway.handleJoinVoice({ serverId: 's1', channelId: 'ch1' }, socketOld);

      const socketNew: any = {
        id: 'sock_new',
        data: { user: { sub: 'u1', username: 'user1' } },
        join: vi.fn(),
        leave: vi.fn(),
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      gateway.handleJoinVoice({ serverId: 's1', channelId: 'ch1' }, socketNew);

      expect(mockServer.to).toHaveBeenCalledWith('server-s1');
    });

    it('should handle webrtcSignal', () => {
      const mockSocket: any = {
        id: 'sock1',
        data: { user: { sub: 'u1', username: 'user1' } },
      };

      gateway.handleWebrtcSignal({ to: 'sock2', signal: { sdp: 'test' } }, mockSocket);

      expect(mockServer.to).toHaveBeenCalledWith('sock2');
      expect(mockServer.emit).toHaveBeenCalledWith('webrtcSignal', {
        from: 'sock1',
        userId: 'u1',
        username: 'user1',
        signal: { sdp: 'test' },
      });
    });
  });
});
