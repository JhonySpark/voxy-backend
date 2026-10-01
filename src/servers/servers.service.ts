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

  private async generateInviteCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      const code = `VOXY-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
      const existing = await this.prisma.server.findUnique({ where: { inviteCode: code }, select: { id: true } });
      if (!existing) return code;
    }
    throw new ForbiddenException('Não foi possível gerar um código de convite único.');
  }

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
    server.setInviteCode(await this.generateInviteCode());
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
      inviteCode: created.inviteCode,
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
    return servers.map(s => {
      const version = s.updatedAt ? `?v=${new Date(s.updatedAt).getTime()}` : '';
      const baseIconUrl = s.iconUrl ? s.iconUrl.split('?')[0] : null;
      return {
        id: s.id,
        name: s.name,
        ownerId: s.ownerId,
        iconUrl: baseIconUrl ? `${baseIconUrl}${version}` : null,
        iconKey: s.iconKey,
        inviteCode: s.inviteCode,
        channels: s.channels.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type.value,
          serverId: c.serverId,
        })),
      };
    });
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

    const version = server.updatedAt ? `?v=${new Date(server.updatedAt).getTime()}` : '';
    const baseIconUrl = server.iconUrl ? server.iconUrl.split('?')[0] : null;

    return {
      id: server.id,
      name: server.name,
      ownerId: server.ownerId,
      iconUrl: baseIconUrl ? `${baseIconUrl}${version}` : null,
      iconKey: server.iconKey,
      inviteCode: server.inviteCode,
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

  async joinServer(inviteCode: string, userId: string) {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const isLegacyId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(inviteCode);
    const invite = isLegacyId
      ? { id: inviteCode }
      : await this.prisma.server.findUnique({ where: { inviteCode: normalizedInviteCode }, select: { id: true } });
    // Mantém compatibilidade com os UUIDs que já haviam sido compartilhados
    // antes dos códigos amigáveis, inclusive bases legadas.
    const serverId = invite?.id || inviteCode;
    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Server not found');

    const isMember = await this.serverRepo.isMember(serverId, userId);
    if (!isMember) {
      await this.serverRepo.addMember(serverId, userId, 'MEMBER');
    }

    return this.getServerById(serverId, userId);
  }
}
