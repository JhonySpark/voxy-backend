import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { Server } from '../modules/servers/domain/entities/server.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ServersService {
  constructor(
    @Inject(SERVER_REPOSITORY) private readonly serverRepo: IServerRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createServer(
    ownerId: string,
    name: string,
    iconUrl?: string,
    iconKey?: string,
  ) {
    const serverOrError = Server.create(name, ownerId);
    if (serverOrError.isFailure) {
      throw new ForbiddenException(serverOrError.error);
    }

    const server = serverOrError.getValue();
    const created = await this.serverRepo.create(server);

    if ((iconUrl || iconKey) && this.prisma?.server) {
      await this.prisma.server.update({
        where: { id: created.id },
        data: {
          iconUrl: iconUrl || null,
          iconKey: iconKey || null,
        },
      });
    }

    return {
      id: created.id,
      name: created.name,
      ownerId: created.ownerId,
      iconUrl: (created as any).iconUrl || iconUrl,
      iconKey: (created as any).iconKey || iconKey,
      channels: created.channels.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type.value,
        serverId: c.serverId,
      })),
      members: created.members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role.value,
        serverId: m.serverId,
      })),
    };
  }

  async updateServer(
    userId: string,
    serverId: string,
    data: { name?: string; iconUrl?: string; iconKey?: string },
  ) {
    if (!this.prisma?.server) {
      throw new ForbiddenException('Database service not available');
    }

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: { members: true },
    });

    if (!server) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    const isOwner = server.ownerId === userId;
    const isServerAdmin = server.members.some(
      (m: any) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
    );

    if (!isOwner && !isServerAdmin) {
      throw new ForbiddenException('Apenas o proprietário ou administradores podem editar este servidor.');
    }

    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.iconUrl !== undefined ? { iconUrl: data.iconUrl } : {}),
        ...(data.iconKey !== undefined ? { iconKey: data.iconKey } : {}),
      },
    });

    return this.getServerById(serverId, userId);
  }

  async getUserServers(userId: string) {
    const servers = await this.serverRepo.findUserServers(userId);
    return servers.map(s => ({
      id: s.id,
      name: s.name,
      ownerId: s.ownerId,
      iconUrl: (s as any).iconUrl,
      iconKey: (s as any).iconKey,
      channels: s.channels.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type.value,
        serverId: c.serverId,
      })),
    }));
  }

  async getServerById(serverId: string, userId: string) {
    const isMember = await this.serverRepo.isMember(serverId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const server = await this.serverRepo.findById(serverId);
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return {
      id: server.id,
      name: server.name,
      ownerId: server.ownerId,
      iconUrl: (server as any).iconUrl,
      iconKey: (server as any).iconKey,
      channels: server.channels.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type.value,
        serverId: c.serverId,
      })),
      members: server.members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role.value,
        serverId: m.serverId,
        user: { id: m.userId, username: m.username || '' },
      })),
    };
  }

  async joinServer(serverId: string, userId: string) {
    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Server not found');

    const isMember = await this.serverRepo.isMember(serverId, userId);
    if (!isMember) {
      await this.serverRepo.addMember(serverId, userId, 'MEMBER');
    }

    return this.getServerById(serverId, userId);
  }
}
