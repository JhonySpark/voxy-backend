import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) {}

  async createServer(ownerId: string, name: string) {
    return this.prisma.server.create({
      data: {
        name,
        ownerId,
        members: {
          create: [{ userId: ownerId, role: 'OWNER' }]
        },
        channels: {
          create: [{ name: 'geral', type: 'TEXT' }, { name: 'Voz Geral', type: 'VOICE' }]
        }
      },
      include: {
        channels: true
      }
    });
  }

  async getUserServers(userId: string) {
    return this.prisma.server.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        channels: true
      }
    });
  }

  async getServerById(serverId: string, userId: string) {
    // Optimized: Only return the server if the user is a member, otherwise throw Forbidden early
    const isMember = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId
        }
      }
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        channels: true,
        // Only include members if truly needed in the frontend. Assuming frontend needs it for right sidebar:
        members: {
          include: { user: { select: { id: true, username: true } } } // Don't fetch passwords/emails
        }
      }
    });

    return server;
  }

  async joinServer(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true }
    });

    if (!server) throw new NotFoundException('Server not found');
    
    // Check if already a member efficiently
    const isMember = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId
        }
      }
    });

    if (isMember) {
      return this.getServerById(serverId, userId);
    }

    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        members: {
          create: { userId, role: 'MEMBER' }
        }
      }
    });

    return this.getServerById(serverId, userId);
  }
}
