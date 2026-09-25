import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private channelsService: ChannelsService,
    private jwtService: JwtService,
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
      
      // Also join a room specifically for this user to easily send DMs
      client.join(userId);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedUsers.delete(client.data.user.sub);
      
      // Cleanup voice states on sudden disconnect
      for (const [channelId, participants] of this.voiceStates.entries()) {
        if (participants.has(client.id)) {
          const user = participants.get(client.id);
          const serverId = user?.serverId;
          participants.delete(client.id);
          
          if (participants.size === 0) {
            this.voiceStates.delete(channelId);
            this.channelStartTimes.delete(channelId);
          }
          
          if (serverId) {
            this.server.to(`server-${serverId}`).emit('serverVoiceUpdate', {
              channelId,
              participants: Array.from(participants.values()),
              startedAt: this.channelStartTimes.get(channelId)
            });
          }
        }
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    const message = await this.chatService.saveMessage(senderId, data.receiverId, data.content);

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
    @MessageBody() data: { channelId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user.sub;
    try {
      const message = await this.channelsService.saveChannelMessage(data.channelId, senderId, data.content);
      // Broadcast to everyone in the channel
      this.server.to(data.channelId).emit('newChannelMessage', message);
      return message;
    } catch (e) {
      // Forbidden or NotFound
      return { error: 'Unauthorized' };
    }
  }

  private voiceStates = new Map<string, Map<string, { userId: string, username: string, socketId: string, serverId: string, isMuted: boolean }>>(); // channelId -> map of socketId -> user
  private channelStartTimes = new Map<string, number>(); // channelId -> timestamp

  @SubscribeMessage('joinServer')
  handleJoinServer(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    client.join(`server-${data.serverId}`);
    // Send current voice states for this server's channels if needed, but it's simpler to let client request or just wait for updates.
  }

  @SubscribeMessage('leaveServer')
  handleLeaveServer(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`server-${data.serverId}`);
  }

  @SubscribeMessage('friendAction')
  handleFriendAction(@MessageBody() data: { targetId: string }, @ConnectedSocket() client: Socket) {
    this.server.to(data.targetId).emit('friendActionUpdate');
  }

  @SubscribeMessage('channelCreated')
  handleChannelCreated(@MessageBody() data: { serverId: string }, @ConnectedSocket() client: Socket) {
    this.server.to(`server-${data.serverId}`).emit('serverUpdated');
  }

  // WebRTC Signaling
  @SubscribeMessage('joinVoice')
  handleJoinVoice(@MessageBody() data: { serverId: string, channelId: string }, @ConnectedSocket() client: Socket) {
    client.join(`voice-${data.channelId}`);
    
    if (!this.voiceStates.has(data.channelId)) {
      this.voiceStates.set(data.channelId, new Map());
      this.channelStartTimes.set(data.channelId, Date.now());
    }
    const participants = this.voiceStates.get(data.channelId)!;
    
    // Prevent duplicate instances of the same user
    for (const [socketId, user] of participants.entries()) {
      if (user.userId === client.data.user.sub && socketId !== client.id) {
        participants.delete(socketId);
      }
    }

    participants.set(client.id, { 
      userId: client.data.user.sub, 
      username: client.data.user.username, 
      socketId: client.id,
      serverId: data.serverId,
      isMuted: false
    });

    // Notify users in the voice room (for WebRTC)
    client.to(`voice-${data.channelId}`).emit('userJoinedVoice', { userId: client.data.user.sub, username: client.data.user.username, socketId: client.id });
    
    // Notify EVERYONE in the server about the voice state update
    this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
      channelId: data.channelId,
      participants: Array.from(participants.values()),
      startedAt: this.channelStartTimes.get(data.channelId)
    });
  }

  @SubscribeMessage('leaveVoice')
  handleLeaveVoice(@MessageBody() data: { serverId: string, channelId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`voice-${data.channelId}`);
    
    if (this.voiceStates.has(data.channelId)) {
      this.voiceStates.get(data.channelId)!.delete(client.id);
      if (this.voiceStates.get(data.channelId)!.size === 0) {
        this.voiceStates.delete(data.channelId);
        this.channelStartTimes.delete(data.channelId);
      }
    }

    client.to(`voice-${data.channelId}`).emit('userLeftVoice', { userId: client.data.user.sub, username: client.data.user.username, socketId: client.id });
    
    this.server.to(`server-${data.serverId}`).emit('serverVoiceUpdate', {
      channelId: data.channelId,
      participants: Array.from(this.voiceStates.get(data.channelId)?.values() || []),
      startedAt: this.channelStartTimes.get(data.channelId)
    });
  }

  @SubscribeMessage('updateVoiceMute')
  handleUpdateVoiceMute(@MessageBody() data: { serverId: string, channelId: string, isMuted: boolean }, @ConnectedSocket() client: Socket) {
    const channelState = this.voiceStates.get(data.channelId);
    if (channelState && channelState.has(client.id)) {
      const user = channelState.get(client.id)!;
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
}

