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
      raw.iconKey,
      raw.createdAt,
      raw.updatedAt,
      raw.inviteCode,
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
        inviteCode: server.inviteCode || `VOXY-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`,
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
        inviteCode: server.inviteCode,
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
        deletedAt: null,
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

    if (!raw || raw.deletedAt) return null;
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

  async removeMember(serverId: string, userId: string): Promise<void> {
    await this.prisma.serverMember.deleteMany({
      where: { serverId, userId },
    });
  }

  async updateMemberRole(serverId: string, userId: string, role: string): Promise<void> {
    await this.prisma.serverMember.update({
      where: {
        serverId_userId: { serverId, userId },
      },
      data: { role },
    });
  }

  async softDelete(serverId: string): Promise<void> {
    await this.prisma.server.update({
      where: { id: serverId },
      data: { deletedAt: new Date() },
    });
  }

  async isBanned(serverId: string, userId: string): Promise<boolean> {
    const ban = await this.prisma.serverBan.findUnique({
      where: {
        serverId_userId: { serverId, userId },
      },
    });
    return !!ban;
  }

  async banMember(serverId: string, userId: string, reason?: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.serverMember.deleteMany({
        where: { serverId, userId },
      }),
      this.prisma.serverBan.upsert({
        where: {
          serverId_userId: { serverId, userId },
        },
        create: {
          serverId,
          userId,
          reason,
        },
        update: {
          reason,
        },
      }),
    ]);
  }

  async unbanMember(serverId: string, userId: string): Promise<void> {
    await this.prisma.serverBan.deleteMany({
      where: { serverId, userId },
    });
  }

  async getServerBans(serverId: string): Promise<any[]> {
    return this.prisma.serverBan.findMany({
      where: { serverId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getServerMembers(serverId: string): Promise<any[]> {
    return this.prisma.serverMember.findMany({
      where: { serverId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRolePermissions(serverId: string): Promise<any[]> {
    return this.prisma.serverRolePermission.findMany({
      where: { serverId },
    });
  }

  async upsertRolePermissions(serverId: string, role: string, permissions: any): Promise<any> {
    return this.prisma.serverRolePermission.upsert({
      where: {
        serverId_role: { serverId, role },
      },
      create: {
        serverId,
        role,
        canInvite: permissions.canInvite ?? true,
        canDeleteMessages: permissions.canDeleteMessages ?? false,
        canKickMembers: permissions.canKickMembers ?? false,
        canBanMembers: permissions.canBanMembers ?? false,
        canManageChannels: permissions.canManageChannels ?? false,
        canManageServer: permissions.canManageServer ?? false,
      },
      update: {
        ...(permissions.canInvite !== undefined ? { canInvite: permissions.canInvite } : {}),
        ...(permissions.canDeleteMessages !== undefined ? { canDeleteMessages: permissions.canDeleteMessages } : {}),
        ...(permissions.canKickMembers !== undefined ? { canKickMembers: permissions.canKickMembers } : {}),
        ...(permissions.canBanMembers !== undefined ? { canBanMembers: permissions.canBanMembers } : {}),
        ...(permissions.canManageChannels !== undefined ? { canManageChannels: permissions.canManageChannels } : {}),
        ...(permissions.canManageServer !== undefined ? { canManageServer: permissions.canManageServer } : {}),
      },
    });
  }
}
