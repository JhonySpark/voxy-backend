import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { Server } from '../modules/servers/domain/entities/server.entity.js';

@Injectable()
export class ServersService {
  constructor(
    @Inject(SERVER_REPOSITORY) private readonly serverRepo: IServerRepository,
  ) {}

  async createServer(ownerId: string, name: string) {
    const serverOrError = Server.create(name, ownerId);
    if (serverOrError.isFailure) {
      throw new ForbiddenException(serverOrError.error);
    }

    const server = serverOrError.getValue();
    const created = await this.serverRepo.create(server);

    return {
      id: created.id,
      name: created.name,
      ownerId: created.ownerId,
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

  async getUserServers(userId: string) {
    const servers = await this.serverRepo.findUserServers(userId);
    return servers.map(s => ({
      id: s.id,
      name: s.name,
      ownerId: s.ownerId,
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
