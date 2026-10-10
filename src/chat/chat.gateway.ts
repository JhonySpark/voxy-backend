import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Optional } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private userStatuses = new Map<string, { status: string; customStatus?: string }>(); // userId -> status

  constructor(
    private chatService: ChatService,
    private channelsService: ChannelsService,
    private jwtService: JwtService,
    @Optional() private prisma?: PrismaService,
    @Optional() private logger?: BetterStackLoggerService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });
      const userId = payload.sub;
      client.data.user = payload;
      this.connectedUsers.set(userId, client.id);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      
      // Also join a room specifically for this user to easily send DMs
      client.join(userId);

      // Determine user status
      let userStatus = 'ONLINE';
      let customStatus: string | undefined = undefined;

      const existingStatus = this.userStatuses.get(userId);
      if (existingStatus && existingStatus.status !== 'OFFLINE') {
        userStatus = existingStatus.status;
        customStatus = existingStatus.customStatus;
      }

      this.userStatuses.set(userId, { status: userStatus, customStatus });

      // Broadcast status update
      this.server.emit('userStatusUpdate', {
        userId,
        status: userStatus,
        customStatus,
      });

      // Cancel any pending disconnect timeouts for this userId
      for (const [timeoutKey, timeout] of this.voiceDisconnectTimeouts.entries()) {
        const [, timeoutUserId] = timeoutKey.split(':');
        if (timeoutUserId === userId) {
          clearTimeout(timeout);
          this.voiceDisconnectTimeouts.delete(timeoutKey);
        }
      }

      // Update socketId for active voice states
      for (const [, participants] of this.voiceStates.entries()) {
        const user = participants.get(userId);
        if (user) {
          user.socketId = client.id;
        }
      }

      // Send all current statuses to newly connected client
      const allStatuses: Record<string, { status: string; customStatus?: string }> = {};
      for (const [uid, s] of this.userStatuses.entries()) {
        allStatuses[uid] = s;
      }
      client.emit?.('allUserStatuses', allStatuses);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      const userId = client.data.user.sub;
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          this.connectedUsers.delete(userId);
          this.userStatuses.set(userId, { status: 'OFFLINE' });
          this.server.emit('userStatusUpdate', {
            userId,
            status: 'OFFLINE',
          });
        }
      } else {
        this.connectedUsers.delete(userId);
      }

      const remainingSockets = this.userSockets.get(userId);
      const isCompletelyDisconnected = !remainingSockets || remainingSockets.size === 0;
      
      // Cleanup voice states on sudden disconnect
      for (const [channelId, participants] of this.voiceStates.entries()) {
        if (participants.has(userId)) {
          const user = participants.get(userId)!;
          const serverId = user.serverId || this.channelServerMap.get(channelId);

          if (!isCompletelyDisconnected) {
            // User still has another socket connected
            user.socketId = Array.from(remainingSockets!)[0];
            continue;
          }

          // Grace period for sudden disconnect (e.g. temporary network drop / reconnect)
          const timeoutKey = `${channelId}:${userId}`;
          const existingTimeout = this.voiceDisconnectTimeouts.get(timeoutKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeout = setTimeout(() => {
            this.voiceDisconnectTimeouts.delete(timeoutKey);
            const currentParticipants = this.voiceStates.get(channelId);
            if (currentParticipants && currentParticipants.has(userId)) {
              currentParticipants.delete(userId);
              if (currentParticipants.size === 0) {
                this.voiceStates.delete(channelId);
                this.channelStartTimes.delete(channelId);
              }
              if (serverId) {
                this.server.to(`server-${serverId}`).emit('serverVoiceUpdate', {
                  channelId,
                  participants: Array.from(currentParticipants.values()),
                  startedAt: this.channelStartTimes.get(channelId),
                });
              }
            }
          }, 15000);

          this.voiceDisconnectTimeouts.set(timeoutKey, timeout);
        }
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { receiverId: string; content: string; attachmentId?: string; replyToId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    const message = await this.chatService.saveMessage(
      senderId,
      data.receiverId,
      data.content,
      data.attachmentId,
      data.replyToId,
    );

    // Send to receiver if online
    this.server.to(data.receiverId).emit('newMessage', message);
    
    // Send back to sender to confirm
    client.emit('messageSent', message);
    
    return message;
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.channelId);
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.channelId);
  }

  @SubscribeMessage('sendChannelMessage')
  async handleChannelMessage(
    @MessageBody() data: { channelId: string; content: string; attachmentId?: string; replyToId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    try {
      const message = await this.channelsService.saveChannelMessage(
        data.channelId,
        senderId,
        data.content,
        data.attachmentId,
        data.replyToId,
      );
      // Confirma diretamente ao remetente e entrega imediatamente aos demais membros.
      // Isso evita depender da entrada prévia do remetente na sala para atualizar a própria tela.
      client.emit('channelMessageSent', message);
      client.to(data.channelId).emit('newChannelMessage', message);
      return message;
    } catch (e) {
      // Forbidden or NotFound
      return { error: 'Unauthorized' };
    }
  }

  @SubscribeMessage('deleteChannelMessage')
  async handleDeleteChannelMessage(
    @MessageBody() data: { channelId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    try {
      await this.channelsService.deleteChannelMessage(data.channelId, data.messageId, senderId);
      this.server.to(data.channelId).emit('channelMessageDeleted', {
        channelId: data.channelId,
        messageId: data.messageId,
      });
      client.emit('channelMessageDeleted', {
        channelId: data.channelId,
        messageId: data.messageId,
      });
      return { success: true };
    } catch (e: any) {
      return { error: e.message || 'Unauthorized' };
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @MessageBody() data: { messageId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    try {
      const updated = await this.chatService.editDirectMessage(data.messageId, senderId, data.content);
      // Emit to receiver
      this.server.to(updated.receiverId).emit('messageUpdated', updated);
      // Emit back to sender
      client.emit('messageUpdated', updated);
      return updated;
    } catch (e: any) {
      return { error: e.message || 'Unauthorized' };
    }
  }

  @SubscribeMessage('editChannelMessage')
  async handleEditChannelMessage(
    @MessageBody() data: { channelId: string; messageId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    try {
      const updated = await this.channelsService.editChannelMessage(
        data.channelId,
        data.messageId,
        senderId,
        data.content,
      );
      this.server.to(data.channelId).emit('channelMessageUpdated', updated);
      client.emit('channelMessageUpdated', updated);
      return updated;
    } catch (e: any) {
      return { error: e.message || 'Unauthorized' };
    }
  }

  @SubscribeMessage('toggleMessageReaction')
  async handleToggleMessageReaction(
    @MessageBody() data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;
    try {
      const updated = await this.chatService.toggleReaction(data.messageId, userId, data.emoji);
      // Emit to receiver and sender
      this.server.to(updated.receiverId).emit('messageReactionUpdated', updated);
      this.server.to(updated.senderId).emit('messageReactionUpdated', updated);
      client.emit('messageReactionUpdated', updated);
      return updated;
    } catch (e: any) {
      return { error: e.message || 'Error' };
    }
  }

  @SubscribeMessage('toggleChannelMessageReaction')
  async handleToggleChannelMessageReaction(
    @MessageBody() data: { channelId: string; messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;
    try {
      const updated = await this.channelsService.toggleChannelMessageReaction(
        data.channelId,
        data.messageId,
        userId,
        data.emoji,
      );
      this.server.to(data.channelId).emit('channelMessageReactionUpdated', updated);
      client.emit('channelMessageReactionUpdated', updated);
      return updated;
    } catch (e: any) {
      return { error: e.message || 'Error' };
    }
  }

  @SubscribeMessage('serverDeleted')
  handleServerDeleted(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    this.server.to(`server-${data.serverId}`).emit('serverDeleted', { serverId: data.serverId });
    this.server.emit('serverDeleted', { serverId: data.serverId });
  }

  @SubscribeMessage('serverMemberAction')
  handleServerMemberAction(
    @MessageBody() data: { serverId: string; targetUserId?: string; targetUserIds?: string[]; serverName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.serverId) return;
    this.server.to(`server-${data.serverId}`).emit('serverUpdated');
    this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
    if (data.targetUserId) {
      this.server.to(data.targetUserId).emit('serverMembershipChanged', {
        serverId: data.serverId,
        serverName: data.serverName,
      });
    }
    if (Array.isArray(data.targetUserIds)) {
      for (const uid of data.targetUserIds) {
        this.server.to(uid).emit('serverMembershipChanged', {
          serverId: data.serverId,
          serverName: data.serverName,
        });
      }
    }
  }

  @SubscribeMessage('serverMembersAdded')
  handleServerMembersAdded(
    @MessageBody() data: { serverId: string; userIds: string[]; serverName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.serverId) return;
    this.server.to(`server-${data.serverId}`).emit('serverUpdated');
    this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
    if (Array.isArray(data.userIds)) {
      for (const userId of data.userIds) {
        this.server.to(userId).emit('serverMembershipChanged', {
          serverId: data.serverId,
          serverName: data.serverName,
        });
      }
    }
  }

  private voiceStates = new Map<
    string,
    Map<
      string,
      {
        userId: string;
        username: string;
        displayName?: string | null;
        avatarUrl?: string | null;
        socketId: string;
        serverId: string;
        isMuted: boolean;
      }
    >
  >(); // channelId -> map of userId -> user
  private channelStartTimes = new Map<string, number>(); // channelId -> timestamp
  private channelServerMap = new Map<string, string>(); // channelId -> serverId
  private voiceDisconnectTimeouts = new Map<string, NodeJS.Timeout>(); // `${channelId}:${userId}` -> timeout

  @SubscribeMessage('joinServer')
  handleJoinServer(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    if (!data?.serverId) return;
    client.join(`server-${data.serverId}`);
    
    for (const [channelId, participantsMap] of this.voiceStates.entries()) {
      const firstParticipant = participantsMap.values().next().value;
      const serverId = this.channelServerMap.get(channelId) || firstParticipant?.serverId;
      if (serverId && String(serverId) === String(data.serverId)) {
        client.emit('serverVoiceUpdate', {
          channelId,
          participants: Array.from(participantsMap.values()),
          startedAt: this.channelStartTimes.get(channelId)
        });
      }
    }
  }

  @SubscribeMessage('leaveServer')
  handleLeaveServer(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`server-${data.serverId}`);
  }

  @SubscribeMessage('friendAction')
  handleFriendAction(
    @MessageBody() data: { targetId: string; actionType?: string; sender?: any },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.actionType) {
      this.server.to(data.targetId).emit('friendActionUpdate', {
        actionType: data.actionType,
        sender: data.sender || client.data?.user || null,
      });
    } else {
      this.server.to(data.targetId).emit('friendActionUpdate');
    }
  }

  @SubscribeMessage('channelCreated')
  handleChannelCreated(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    this.server.to(`server-${data.serverId}`).emit('serverUpdated');
  }

  @SubscribeMessage('serverUpdated')
  handleServerUpdated(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    this.server.to(`server-${data.serverId}`).emit('serverUpdated');
  }

  @SubscribeMessage('memberKicked')
  handleMemberKicked(
    @MessageBody() data: { serverId: string; targetUserId: string; serverName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.serverId) return;
    this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
    this.server.to(data.targetUserId).emit('memberKicked', {
      serverId: data.serverId,
      userId: data.targetUserId,
      serverName: data.serverName,
    });
  }

  @SubscribeMessage('memberBanned')
  handleMemberBanned(
    @MessageBody() data: { serverId: string; targetUserId: string; reason?: string; serverName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.serverId) return;
    this.server.to(`server-${data.serverId}`).emit('serverMembersUpdated', { serverId: data.serverId });
    this.server.to(data.targetUserId).emit('memberBanned', {
      serverId: data.serverId,
      userId: data.targetUserId,
      reason: data.reason,
      serverName: data.serverName,
    });
  }

  @SubscribeMessage('memberMuted')
  handleMemberMuted(
    @MessageBody() data: { serverId: string; targetUserId: string; isMuted: boolean; mutedReason?: string; mutedUntil?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`server-${data.serverId}`).emit('serverMemberMuted', data);
    this.server.to(data.targetUserId).emit('serverMemberMuted', data);
  }

  @SubscribeMessage('serverSuspended')
  handleServerSuspended(
    @MessageBody() data: { serverId: string; reason: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`server-${data.serverId}`).emit('serverSuspended', data);
  }

  @SubscribeMessage('accountSuspended')
  handleAccountSuspended(
    @MessageBody() data: { targetUserId: string; reason: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.targetUserId).emit('accountSuspended', data);
  }

  @SubscribeMessage('userProfileUpdated')
  handleUserProfileUpdated(
    @MessageBody()
    data: {
      userId: string;
      displayName?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      bannerUrl?: string | null;
      bannerColor?: string | null;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.sub || data.userId;
    this.server.emit('userProfileUpdated', { ...data, userId });

    // Atualiza estados de voz ativos com o novo avatar e displayName
    for (const [channelId, participants] of this.voiceStates.entries()) {
      let changed = false;
      let targetServerId: string | null = null;
      for (const user of participants.values()) {
        if (user.userId === userId) {
          if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
          if (data.displayName !== undefined) user.displayName = data.displayName;
          changed = true;
          targetServerId = user.serverId;
        }
      }
      if (changed && targetServerId) {
        this.server.to(`server-${targetServerId}`).emit('serverVoiceUpdate', {
          channelId,
          participants: Array.from(participants.values()),
          startedAt: this.channelStartTimes.get(channelId),
        });
      }
    }
  }

  // WebRTC Signaling
  @SubscribeMessage('joinVoice')
  async handleJoinVoice(
    @MessageBody() data: { serverId: string; channelId: string; avatarUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;
    client.join(`voice-${data.channelId}`);
    
    // Clear any pending disconnect timeout for this user in this channel
    const timeoutKey = `${data.channelId}:${userId}`;
    const pendingTimeout = this.voiceDisconnectTimeouts.get(timeoutKey);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.voiceDisconnectTimeouts.delete(timeoutKey);
    }

    // Clean up if user was previously in another channel
    for (const [chId, pMap] of this.voiceStates.entries()) {
      if (chId !== data.channelId && pMap.has(userId)) {
        const oldUser = pMap.get(userId)!;
        pMap.delete(userId);
        const oldServerId = oldUser.serverId || this.channelServerMap.get(chId);
        if (pMap.size === 0) {
          this.voiceStates.delete(chId);
          this.channelStartTimes.delete(chId);
        }
        if (oldServerId) {
          this.server.to(`server-${oldServerId}`).emit('serverVoiceUpdate', {
            channelId: chId,
            participants: Array.from(pMap.values()),
            startedAt: this.channelStartTimes.get(chId),
          });
        }
      }
    }

    if (!this.voiceStates.has(data.channelId)) {
      this.voiceStates.set(data.channelId, new Map());
      this.channelStartTimes.set(data.channelId, Date.now());
    }
    this.channelServerMap.set(data.channelId, data.serverId);
    const participants = this.voiceStates.get(data.channelId)!;

    let avatarUrl = data.avatarUrl;
    let displayName = client.data.user.username;
    if (this.prisma) {
      try {
        const userRecord = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true, displayName: true },
        });
        if (userRecord) {
          avatarUrl = userRecord.avatarUrl || avatarUrl;
          displayName = userRecord.displayName || displayName;
        }
      } catch (_) {}
    }

    const isMuted = participants.get(userId)?.isMuted ?? false;

    participants.set(userId, { 
      userId, 
      username: client.data.user.username,
      displayName,
      avatarUrl,
      socketId: client.id,
      serverId: data.serverId,
      isMuted
    });

    // Notify users in the voice room (for WebRTC)
    client.to(`voice-${data.channelId}`).emit('userJoinedVoice', { 
      userId, 
      username: client.data.user.username, 
      displayName,
      avatarUrl,
      socketId: client.id 
    });
    
    // Notify EVERYONE in the server about the voice state update
    this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
      channelId: data.channelId,
      participants: Array.from(participants.values()),
      startedAt: this.channelStartTimes.get(data.channelId)
    });

    this.logger?.logBusinessEvent('VOICE_USER_JOINED', {
      userId,
      channelId: data.channelId,
      serverId: data.serverId,
    });
  }

  @SubscribeMessage('leaveVoice')
  handleLeaveVoice(@MessageBody() data: { serverId: string, channelId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub;
    client.leave(`voice-${data.channelId}`);
    
    const timeoutKey = `${data.channelId}:${userId}`;
    const pendingTimeout = this.voiceDisconnectTimeouts.get(timeoutKey);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.voiceDisconnectTimeouts.delete(timeoutKey);
    }

    if (this.voiceStates.has(data.channelId)) {
      const channelMap = this.voiceStates.get(data.channelId)!;
      channelMap.delete(userId);
      if (channelMap.size === 0) {
        this.voiceStates.delete(data.channelId);
        this.channelStartTimes.delete(data.channelId);
      }
    }

    client.to(`voice-${data.channelId}`).emit('userLeftVoice', { userId, username: client.data.user.username, socketId: client.id });
    
    this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
      channelId: data.channelId,
      participants: Array.from(this.voiceStates.get(data.channelId)?.values() || []),
      startedAt: this.channelStartTimes.get(data.channelId)
    });

    this.logger?.logBusinessEvent('VOICE_USER_LEFT', {
      userId,
      channelId: data.channelId,
      serverId: data.serverId,
    });
  }

  @SubscribeMessage('updateVoiceMute')
  handleUpdateVoiceMute(@MessageBody() data: { serverId: string, channelId: string, isMuted: boolean }, @ConnectedSocket() client: Socket) {
    const channelState = this.voiceStates.get(data.channelId);
    const userId = client.data?.user?.sub;
    if (channelState && userId && channelState.has(userId)) {
      const user = channelState.get(userId)!;
      user.isMuted = data.isMuted;
      
      this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
        channelId: data.channelId,
        participants: Array.from(channelState.values()),
        startedAt: this.channelStartTimes.get(data.channelId)
      });
    }
  }

  @SubscribeMessage('webrtcSignal')
  handleWebrtcSignal(
    @MessageBody() data: { to: string; signal: any },
    @ConnectedSocket() client: Socket,
  ) {
    // Send signal (offer, answer, or ice candidate) to a specific peer
    this.server.to(data.to).emit('webrtcSignal', {
      from: client.id,
      userId: client.data.user.sub,
      username: client.data.user.username,
      signal: data.signal
    });
  }

  @SubscribeMessage('getUserStatuses')
  handleGetUserStatuses(@ConnectedSocket() client: Socket) {
    const allStatuses: Record<string, { status: string; customStatus?: string }> = {};
    for (const [uid, s] of this.userStatuses.entries()) {
      allStatuses[uid] = s;
    }
    client.emit('allUserStatuses', allStatuses);
  }

  @SubscribeMessage('updateStatus')
  async handleUpdateStatus(
    @MessageBody() data: { status: string; customStatus?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.sub;
    if (!userId || !data?.status) return;

    this.userStatuses.set(userId, {
      status: data.status,
      customStatus: data.customStatus,
    });

    this.server.emit('userStatusUpdate', {
      userId,
      status: data.status,
      customStatus: data.customStatus,
    });
  }

  /**
   * Métricas em tempo real para o Painel Administrativo
   */
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  public getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public getVoiceUsersCount(): number {
    let count = 0;
    for (const participants of this.voiceStates.values()) {
      count += participants.size;
    }
    return count;
  }
}

