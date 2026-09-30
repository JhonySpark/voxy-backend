import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IServerRepository } from '../../../core/ports/repositories/server.repository.port.js';
import { Server } from '../../../modules/servers/domain/entities/server.entity.js';
import { ServerMember } from '../../../modules/servers/domain/entities/server-member.entity.js';
import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';
import { ServerRole } from '../../../modules/servers/domain/value-objects/server-role.vo.js';
import { ChannelType } from '../../../modules/servers/domain/value-objects/channel-type.vo.js';

@Injectable()
export class PrismaServerRepository implements IServerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: any): Server | null {
    if (!raw) return null;

    const members = (raw.members || []).map((m: any) =>
      ServerMember.create(
        {
          serverId: m.serverId || raw.id,
          userId: m.userId,
          role: ServerRole.create(m.role).getValue(),
          createdAt: m.createdAt,
          username: m.user?.username,
        },
        m.id
      ).getValue()
    );

    const channels = (raw.channels || []).map((c: any) =>
      Channel.create(
        {
          name: c.name,
          type: ChannelType.create(c.type).getValue(),
          serverId: c.serverId || raw.id,
          createdAt: c.createdAt,
        },
        c.id
      ).getValue()
    );

    return Server.create(
      raw.name,
      raw.ownerId,
      raw.id,
      members,
      channels,
      raw.iconUrl,
      raw.iconKey
    ).getValue();
  }

  async create(server: Server): Promise<Server> {
    const raw = await this.prisma.server.create({
      data: {
        id: server.id,
        name: server.name,
        ownerId: server.ownerId,
        iconUrl: server.iconUrl,
        iconKey: server.iconKey,
        members: {
          create: server.members.map(m => ({
            userId: m.userId,
            role: m.role.value,
          })),
        },
        channels: {
          create: server.channels.map(c => ({
            name: c.name,
            type: c.type.value,
          })),
        },
      },
      include: {
        channels: true,
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    return this.toDomain(raw)!;
  }

  async update(server: Server): Promise<Server> {
    const raw = await this.prisma.server.update({
      where: { id: server.id },
      data: {
        name: server.name,
        iconUrl: server.iconUrl,
        iconKey: server.iconKey,
        updatedAt: server.updatedAt,
      },
      include: {
        channels: true,
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    return this.toDomain(raw)!;
  }

  async findUserServers(userId: string): Promise<Server[]> {
    const rawList = await this.prisma.server.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        channels: true,
      },
    });

    return rawList.map(raw => this.toDomain(raw)!);
  }

  async findById(id: string): Promise<Server | null> {
    const raw = await this.prisma.server.findUnique({
      where: { id },
      include: {
        channels: true,
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    return this.toDomain(raw);
  }

  async isMember(serverId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: { serverId, userId },
      },
    });
    return !!member;
  }

  async getMemberRole(serverId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: { serverId, userId },
      },
    });
    return member ? member.role : null;
  }

  async addMember(serverId: string, userId: string, role: string = 'MEMBER'): Promise<void> {
    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        members: {
          create: { userId, role },
        },
      },
    });
  }
}
