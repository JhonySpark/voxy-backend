var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import { Server } from '../modules/servers/domain/entities/server.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgeClassificationEnum } from '../core/enums/index.js';
let ServersService = class ServersService {
    serverRepo;
    prisma;
    constructor(serverRepo, prisma) {
        this.serverRepo = serverRepo;
        this.prisma = prisma;
    }
    async generateInviteCode() {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const bytes = crypto.getRandomValues(new Uint8Array(8));
            const code = `VOXY-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
            const existing = await this.prisma.server.findUnique({ where: { inviteCode: code }, select: { id: true } });
            if (!existing)
                return code;
        }
        throw new ForbiddenException('Não foi possível gerar um código de convite único.');
    }
    async createServer(ownerId, name, is18Plus, iconUrl, iconKey) {
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
        return {
            id: created.id,
            name: created.name,
            ownerId: created.ownerId,
            is18Plus: is18Plus === true,
            iconUrl: created.iconUrl || iconUrl,
            iconKey: created.iconKey || iconKey,
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
    async updateServer(userId, serverId, data) {
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
        const isServerAdmin = server.members.some((m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'));
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
    async getUserServers(userId) {
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
    async getServerById(serverId, userId) {
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
            throw new ForbiddenException(serverMeta.suspendedReason || 'Este servidor foi suspenso por violação das Diretrizes da Comunidade e Proteção à Criança e ao Adolescente.');
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
    async joinServer(inviteCode, userId) {
        const normalizedInviteCode = inviteCode.trim().toUpperCase();
        const isLegacyId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(inviteCode);
        const invite = isLegacyId
            ? { id: inviteCode, deletedAt: null }
            : await this.prisma.server.findUnique({ where: { inviteCode: normalizedInviteCode }, select: { id: true, deletedAt: true } });
        if (invite?.deletedAt) {
            throw new NotFoundException('Server not found');
        }
        const serverId = invite?.id || inviteCode;
        const server = await this.serverRepo.findById(serverId);
        if (!server || server.isDeleted?.())
            throw new NotFoundException('Server not found');
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
    async getUserPermissions(serverId, userId) {
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Servidor não encontrado.');
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
        const role = await this.serverRepo.getMemberRole(serverId, userId);
        if (!role)
            throw new ForbiddenException('Você não é membro deste servidor.');
        const defaultPermissions = {
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
        const rolePerms = await this.serverRepo.getRolePermissions(serverId);
        const custom = rolePerms.find((p) => p.role === role);
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
    async addMembers(serverId, requesterUserId, targetUserIds) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canInvite && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para convidar amigos para este servidor.');
        }
        const added = [];
        for (const targetId of targetUserIds) {
            const isBanned = await this.serverRepo.isBanned(serverId, targetId);
            if (isBanned)
                continue;
            const isMember = await this.serverRepo.isMember(serverId, targetId);
            if (!isMember) {
                await this.serverRepo.addMember(serverId, targetId, 'MEMBER');
                added.push(targetId);
            }
        }
        return { added, success: true };
    }
    async deleteServer(serverId, requesterUserId) {
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Servidor não encontrado.');
        if (server.ownerId !== requesterUserId) {
            throw new ForbiddenException('Apenas o dono pode excluir o servidor.');
        }
        await this.serverRepo.softDelete(serverId);
        return { success: true };
    }
    async getServerMembers(serverId, requesterUserId) {
        const isMember = await this.serverRepo.isMember(serverId, requesterUserId);
        if (!isMember)
            throw new ForbiddenException('Você não é membro deste servidor.');
        return this.serverRepo.getServerMembers(serverId);
    }
    async updateMemberRole(serverId, requesterUserId, targetUserId, newRole) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (permissions.role !== 'OWNER' && !permissions.canManageServer) {
            throw new ForbiddenException('Você não tem permissão para alterar cargos neste servidor.');
        }
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Servidor não encontrado.');
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
    async kickMember(serverId, requesterUserId, targetUserId) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canKickMembers && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para expulsar membros deste servidor.');
        }
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Servidor não encontrado.');
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
        return { success: true };
    }
    async banMember(serverId, requesterUserId, targetUserId, reason) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canBanMembers && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para banir membros deste servidor.');
        }
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Servidor não encontrado.');
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
        return { success: true };
    }
    async unbanMember(serverId, requesterUserId, targetUserId) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canBanMembers && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para desbanir membros deste servidor.');
        }
        await this.serverRepo.unbanMember(serverId, targetUserId);
        return { success: true };
    }
    async getServerBans(serverId, requesterUserId) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canBanMembers && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para visualizar banimentos deste servidor.');
        }
        return this.serverRepo.getServerBans(serverId);
    }
    async getRolePermissions(serverId, requesterUserId) {
        const isMember = await this.serverRepo.isMember(serverId, requesterUserId);
        if (!isMember)
            throw new ForbiddenException('Você não é membro deste servidor.');
        return this.serverRepo.getRolePermissions(serverId);
    }
    async updateRolePermissions(serverId, requesterUserId, role, permissions) {
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
    async muteMember(serverId, requesterUserId, targetUserId, reason, durationMinutes) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canMuteMembers && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para silenciar membros deste servidor.');
        }
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Servidor não encontrado.');
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
        let until;
        if (durationMinutes && durationMinutes > 0) {
            until = new Date(Date.now() + durationMinutes * 60 * 1000);
        }
        await this.serverRepo.muteMember(serverId, targetUserId, reason, until);
        return { success: true, isMuted: true, mutedUntil: until };
    }
    async unmuteMember(serverId, requesterUserId, targetUserId) {
        const permissions = await this.getUserPermissions(serverId, requesterUserId);
        if (!permissions.canMuteMembers && permissions.role !== 'OWNER') {
            throw new ForbiddenException('Você não tem permissão para desmutar membros deste servidor.');
        }
        await this.serverRepo.unmuteMember(serverId, targetUserId);
        return { success: true, isMuted: false };
    }
};
ServersService = __decorate([
    Injectable(),
    __param(0, Inject(SERVER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, PrismaService])
], ServersService);
export { ServersService };
//# sourceMappingURL=servers.service.js.map