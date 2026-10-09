import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import type { IServerRepository } from '../core/ports/repositories/server.repository.port.js';
import { Server } from '../modules/servers/domain/entities/server.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgeClassificationEnum, AuditLogActionEnum } from '../core/enums/index.js';
import { SecurityAuditService } from '../moderation/security-audit.service.js';

@Injectable()
export class ServersService {
  constructor(
    @Inject(SERVER_REPOSITORY) private readonly serverRepo: IServerRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: SecurityAuditService,
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
    is18Plus?: boolean,
    iconUrl?: string,
    iconKey?: string,
  ) {
    if (is18Plus) {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { ageClassification: true },
      });
      if (owner?.ageClassification !== AgeClassificationEnum.ADULT) {
        throw new ForbiddenException('Apenas usuários adultos (18+) podem criar servidores para maiores de 18 anos.');
      }
    }

    const serverOrError = Server.create(name, ownerId);
    if (serverOrError.isFailure) {
      throw new ForbiddenException(serverOrError.error);
    }

    const server = serverOrError.getValue();
    server.setInviteCode(await this.generateInviteCode());
    const created = await this.serverRepo.create(server);

    await this.prisma.server.update({
      where: { id: created.id },
      data: {
        is18Plus: is18Plus === true,
        iconUrl: iconUrl || null,
        iconKey: iconKey || null,
      },
    });

    await this.auditService.record({
      action: AuditLogActionEnum.SERVER_CREATED,
      actorId: ownerId,
      targetType: 'SERVER',
      targetId: created.id,
      serverId: created.id,
      reason: 'Criação de servidor',
      metadata: { serverName: name, is18Plus: is18Plus === true },
    });

    return {
      id: created.id,
      name: created.name,
      ownerId: created.ownerId,
      is18Plus: is18Plus === true,
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
    const serverIds = servers.map(s => s.id);
    const prismaServers = await this.prisma.server.findMany({
      where: { id: { in: serverIds } },
      select: { id: true, is18Plus: true, isSuspended: true },
    });
    const serverMetaMap = new Map(prismaServers.map(ps => [ps.id, ps]));

    return servers.map(s => {
      const version = s.updatedAt ? `?v=${new Date(s.updatedAt).getTime()}` : '';
      const baseIconUrl = s.iconUrl ? s.iconUrl.split('?')[0] : null;
      const meta = serverMetaMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        ownerId: s.ownerId,
        is18Plus: meta?.is18Plus ?? false,
        isSuspended: meta?.isSuspended ?? false,
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

    const serverMeta = await this.prisma.server.findUnique({
      where: { id: server.id },
      select: { is18Plus: true, isSuspended: true, suspendedReason: true },
    });

    if (serverMeta?.isSuspended) {
      throw new ForbiddenException(
        serverMeta.suspendedReason || 'Este servidor foi suspenso por violação das Diretrizes da Comunidade e Proteção à Criança e ao Adolescente.'
      );
    }

    if (serverMeta?.is18Plus) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { ageClassification: true },
      });
      if (user?.ageClassification !== AgeClassificationEnum.ADULT) {
        throw new ForbiddenException('Este servidor é restrito para maiores de 18 anos (+18).');
      }
    }

    const version = server.updatedAt ? `?v=${new Date(server.updatedAt).getTime()}` : '';
    const baseIconUrl = server.iconUrl ? server.iconUrl.split('?')[0] : null;

    return {
      id: server.id,
      name: server.name,
      ownerId: server.ownerId,
      is18Plus: serverMeta?.is18Plus ?? false,
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
      ? { id: inviteCode, deletedAt: null }
      : await this.prisma.server.findUnique({ where: { inviteCode: normalizedInviteCode }, select: { id: true, deletedAt: true } });
    if ((invite as any)?.deletedAt) {
      throw new NotFoundException('Server not found');
    }
    // Mantém compatibilidade com os UUIDs que já haviam sido compartilhados
    // antes dos códigos amigáveis, inclusive bases legadas.
    const serverId = invite?.id || inviteCode;
    const server = await this.serverRepo.findById(serverId);
    if (!server || server.isDeleted?.()) throw new NotFoundException('Server not found');

    const serverMeta = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { is18Plus: true, isSuspended: true },
    });

    if (serverMeta?.isSuspended) {
      throw new ForbiddenException('Este servidor está suspenso.');
    }

    if (serverMeta?.is18Plus) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { ageClassification: true },
      });
      if (user?.ageClassification !== AgeClassificationEnum.ADULT) {
        throw new ForbiddenException('Este servidor é restrito para maiores de 18 anos (+18).');
      }
    }

    const isBanned = await this.serverRepo.isBanned(serverId, userId);
    if (isBanned) {
      throw new ForbiddenException('Você está banido deste servidor.');
    }

    const isMember = await this.serverRepo.isMember(serverId, userId);
    if (!isMember) {
      await this.serverRepo.addMember(serverId, userId, 'MEMBER');
    }

    return this.getServerById(serverId, userId);
  }

  async getUserPermissions(serverId: string, userId: string) {
    // Consultas independentes em paralelo: 1 round-trip ao banco em vez de 3 sequenciais
    const [server, role, rolePerms] = await Promise.all([
      this.serverRepo.findById(serverId),
      this.serverRepo.getMemberRole(serverId, userId),
      this.serverRepo.getRolePermissions(serverId),
    ]);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId === userId) {
      return {
        role: 'OWNER',
        canInvite: true,
        canDeleteMessages: true,
        canKickMembers: true,
        canBanMembers: true,
        canMuteMembers: true,
        canManageChannels: true,
        canManageServer: true,
      };
    }

    if (!role) throw new ForbiddenException('Você não é membro deste servidor.');

    const defaultPermissions: Record<string, {
      canInvite: boolean;
      canDeleteMessages: boolean;
      canKickMembers: boolean;
      canBanMembers: boolean;
      canMuteMembers: boolean;
      canManageChannels: boolean;
      canManageServer: boolean;
    }> = {
      ADMIN: {
        canInvite: true,
        canDeleteMessages: true,
        canKickMembers: true,
        canBanMembers: true,
        canMuteMembers: true,
        canManageChannels: true,
        canManageServer: false,
      },
      MODERATOR: {
        canInvite: true,
        canDeleteMessages: true,
        canKickMembers: true,
        canBanMembers: false,
        canMuteMembers: true,
        canManageChannels: false,
        canManageServer: false,
      },
      MEMBER: {
        canInvite: true,
        canDeleteMessages: false,
        canKickMembers: false,
        canBanMembers: false,
        canMuteMembers: false,
        canManageChannels: false,
        canManageServer: false,
      },
    };

    const custom = rolePerms.find((p: any) => p.role === role);

    const base = defaultPermissions[role] || defaultPermissions.MEMBER;

    return {
      role,
      canInvite: custom?.canInvite ?? base.canInvite,
      canDeleteMessages: custom?.canDeleteMessages ?? base.canDeleteMessages,
      canKickMembers: custom?.canKickMembers ?? base.canKickMembers,
      canBanMembers: custom?.canBanMembers ?? base.canBanMembers,
      canMuteMembers: custom?.canMuteMembers ?? base.canMuteMembers,
      canManageChannels: custom?.canManageChannels ?? base.canManageChannels,
      canManageServer: custom?.canManageServer ?? base.canManageServer,
    };
  }

  async addMembers(serverId: string, requesterUserId: string, targetUserIds: string[]) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canInvite && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para convidar amigos para este servidor.');
    }

    const added: string[] = [];
    for (const targetId of targetUserIds) {
      const isBanned = await this.serverRepo.isBanned(serverId, targetId);
      if (isBanned) continue;

      const isMember = await this.serverRepo.isMember(serverId, targetId);
      if (!isMember) {
        await this.serverRepo.addMember(serverId, targetId, 'MEMBER');
        added.push(targetId);
      }
    }

    return { added, success: true };
  }

  async deleteServer(serverId: string, requesterUserId: string) {
    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId !== requesterUserId) {
      throw new ForbiddenException('Apenas o dono pode excluir o servidor.');
    }

    await this.serverRepo.softDelete(serverId);
    return { success: true };
  }

  async getServerMembers(serverId: string, requesterUserId: string) {
    // Autorização e leitura em paralelo; o resultado só é devolvido se for membro
    const [isMember, members] = await Promise.all([
      this.serverRepo.isMember(serverId, requesterUserId),
      this.serverRepo.getServerMembers(serverId),
    ]);
    if (!isMember) throw new ForbiddenException('Você não é membro deste servidor.');

    return members;
  }

  async updateMemberRole(
    serverId: string,
    requesterUserId: string,
    targetUserId: string,
    newRole: string,
  ) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (permissions.role !== 'OWNER' && !permissions.canManageServer) {
      throw new ForbiddenException('Você não tem permissão para alterar cargos neste servidor.');
    }

    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId === targetUserId) {
      throw new ForbiddenException('Não é possível alterar o cargo do dono do servidor.');
    }

    const validRoles = ['ADMIN', 'MODERATOR', 'MEMBER'];
    if (!validRoles.includes(newRole)) {
      throw new ForbiddenException('Cargo inválido.');
    }

    await this.serverRepo.updateMemberRole(serverId, targetUserId, newRole);
    return { success: true, role: newRole };
  }

  async leaveServer(serverId: string, userId: string) {
    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId === userId) {
      throw new ForbiddenException('O proprietário não pode sair do servidor. Transfira a posse ou exclua o servidor.');
    }

    const memberRole = await this.serverRepo.getMemberRole(serverId, userId);
    if (!memberRole) {
      throw new NotFoundException('Você não é membro deste servidor.');
    }

    await this.serverRepo.removeMember(serverId, userId);

    return { success: true };
  }

  async kickMember(serverId: string, requesterUserId: string, targetUserId: string) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canKickMembers && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para expulsar membros deste servidor.');
    }

    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId === targetUserId) {
      throw new ForbiddenException('Não é possível expulsar o dono do servidor.');
    }

    const targetRole = await this.serverRepo.getMemberRole(serverId, targetUserId);
    if (targetRole === 'OWNER') {
      throw new ForbiddenException('Não é possível expulsar o dono do servidor.');
    }
    if (targetRole === 'ADMIN' && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Apenas o dono pode expulsar um administrador.');
    }

    await this.serverRepo.removeMember(serverId, targetUserId);

    await this.auditService.record({
      action: AuditLogActionEnum.MEMBER_KICKED,
      actorId: requesterUserId,
      targetType: 'USER',
      targetId: targetUserId,
      serverId,
      reason: 'Expulso do servidor',
    });

    return { success: true };
  }

  async banMember(
    serverId: string,
    requesterUserId: string,
    targetUserId: string,
    reason?: string,
  ) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canBanMembers && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para banir membros deste servidor.');
    }

    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId === targetUserId) {
      throw new ForbiddenException('Não é possível banir o dono do servidor.');
    }

    const targetRole = await this.serverRepo.getMemberRole(serverId, targetUserId);
    if (targetRole === 'OWNER') {
      throw new ForbiddenException('Não é possível banir o dono do servidor.');
    }
    if (targetRole === 'ADMIN' && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Apenas o dono pode banir um administrador.');
    }

    await this.serverRepo.banMember(serverId, targetUserId, reason);

    await this.auditService.record({
      action: AuditLogActionEnum.MEMBER_BANNED,
      actorId: requesterUserId,
      targetType: 'USER',
      targetId: targetUserId,
      serverId,
      reason: reason || 'Banido do servidor',
    });

    return { success: true };
  }

  async unbanMember(serverId: string, requesterUserId: string, targetUserId: string) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canBanMembers && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para desbanir membros deste servidor.');
    }

    await this.serverRepo.unbanMember(serverId, targetUserId);

    await this.auditService.record({
      action: AuditLogActionEnum.MEMBER_UNBANNED,
      actorId: requesterUserId,
      targetType: 'USER',
      targetId: targetUserId,
      serverId,
      reason: 'Banimento revogado',
    });

    return { success: true };
  }

  async getServerBans(serverId: string, requesterUserId: string) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canBanMembers && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para visualizar banimentos deste servidor.');
    }

    return this.serverRepo.getServerBans(serverId);
  }

  async getRolePermissions(serverId: string, requesterUserId: string) {
    const isMember = await this.serverRepo.isMember(serverId, requesterUserId);
    if (!isMember) throw new ForbiddenException('Você não é membro deste servidor.');

    return this.serverRepo.getRolePermissions(serverId);
  }

  async updateRolePermissions(
    serverId: string,
    requesterUserId: string,
    role: string,
    permissions: any,
  ) {
    const userPerms = await this.getUserPermissions(serverId, requesterUserId);
    if (userPerms.role !== 'OWNER' && !userPerms.canManageServer) {
      throw new ForbiddenException('Você não tem permissão para configurar permissões de cargos.');
    }

    const validRoles = ['ADMIN', 'MODERATOR', 'MEMBER'];
    if (!validRoles.includes(role)) {
      throw new ForbiddenException('Cargo inválido.');
    }

    return this.serverRepo.upsertRolePermissions(serverId, role, permissions);
  }

  async muteMember(
    serverId: string,
    requesterUserId: string,
    targetUserId: string,
    reason?: string,
    durationMinutes?: number,
  ) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canMuteMembers && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para silenciar membros deste servidor.');
    }

    const server = await this.serverRepo.findById(serverId);
    if (!server) throw new NotFoundException('Servidor não encontrado.');

    if (server.ownerId === targetUserId) {
      throw new ForbiddenException('Não é possível silenciar o dono do servidor.');
    }

    const targetRole = await this.serverRepo.getMemberRole(serverId, targetUserId);
    if (targetRole === 'OWNER') {
      throw new ForbiddenException('Não é possível silenciar o dono do servidor.');
    }
    if (targetRole === 'ADMIN' && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Apenas o dono pode silenciar um administrador.');
    }

    let until: Date | undefined;
    if (durationMinutes && durationMinutes > 0) {
      until = new Date(Date.now() + durationMinutes * 60 * 1000);
    }

    await this.serverRepo.muteMember(serverId, targetUserId, reason, until);

    await this.auditService.record({
      action: AuditLogActionEnum.MEMBER_MUTED,
      actorId: requesterUserId,
      targetType: 'USER',
      targetId: targetUserId,
      serverId,
      reason: reason || 'Silenciado no servidor',
      metadata: { durationMinutes, mutedUntil: until?.toISOString() },
    });

    return { success: true, isMuted: true, mutedUntil: until };
  }

  async unmuteMember(serverId: string, requesterUserId: string, targetUserId: string) {
    const permissions = await this.getUserPermissions(serverId, requesterUserId);
    if (!permissions.canMuteMembers && permissions.role !== 'OWNER') {
      throw new ForbiddenException('Você não tem permissão para desmutar membros deste servidor.');
    }

    await this.serverRepo.unmuteMember(serverId, targetUserId);

    await this.auditService.record({
      action: AuditLogActionEnum.MEMBER_UNMUTED,
      actorId: requesterUserId,
      targetType: 'USER',
      targetId: targetUserId,
      serverId,
      reason: 'Silenciamento revogado',
    });

    return { success: true, isMuted: false };
  }

  async getServerAuditLogs(serverId: string, requesterUserId: string, filter: any) {
    return this.auditService.getServerAuditLogs(serverId, requesterUserId, filter);
  }
}
