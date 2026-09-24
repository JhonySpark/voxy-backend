import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async createChannel(
    serverId: string,
    userId: string,
    name: string,
    type: 'TEXT' | 'VOICE' = 'TEXT',
  ) {
    // Optimized: Only check if the specific user is an OWNER of this server
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can create channels');
    }

    return this.prisma.channel.create({
      data: {
        name,
        type,
        serverId,
      },
    });
  }

  async getChannelMessages(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) throw new NotFoundException('Channel not found');

    // Check membership efficiently
    const isMember = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: channel.serverId,
          userId,
        },
      },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });
  }

  async saveChannelMessage(
    channelId: string,
    senderId: string,
    content: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) throw new NotFoundException('Channel not found');

    // Security check: Make sure sender is actually in the server!
    const isMember = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: channel.serverId,
          userId: senderId,
        },
      },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return this.prisma.channelMessage.create({
      data: {
        content,
        senderId,
        channelId,
      },
      include: {
        sender: true,
      },
    });
  }

  async getVoiceToken(channelId: string, user: any) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) throw new NotFoundException('Channel not found');

    const isMember = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: channel.serverId,
          userId: user.sub,
        },
      },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.sub,
      name: user.username,
    });

    at.addGrant({ roomJoin: true, room: channelId });

    return { token: await at.toJwt() };
  }
}
