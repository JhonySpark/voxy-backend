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
let ServersService = class ServersService {
    serverRepo;
    prisma;
    constructor(serverRepo, prisma) {
        this.serverRepo = serverRepo;
        this.prisma = prisma;
    }
    async createServer(ownerId, name, iconUrl, iconKey) {
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
            iconUrl: created.iconUrl || iconUrl,
            iconKey: created.iconKey || iconKey,
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
        return servers.map(s => ({
            id: s.id,
            name: s.name,
            ownerId: s.ownerId,
            iconUrl: s.iconUrl,
            iconKey: s.iconKey,
            channels: s.channels.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type.value,
                serverId: c.serverId,
            })),
        }));
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
        return {
            id: server.id,
            name: server.name,
            ownerId: server.ownerId,
            iconUrl: server.iconUrl,
            iconKey: server.iconKey,
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
    async joinServer(serverId, userId) {
        const server = await this.serverRepo.findById(serverId);
        if (!server)
            throw new NotFoundException('Server not found');
        const isMember = await this.serverRepo.isMember(serverId, userId);
        if (!isMember) {
            await this.serverRepo.addMember(serverId, userId, 'MEMBER');
        }
        return this.getServerById(serverId, userId);
    }
};
ServersService = __decorate([
    Injectable(),
    __param(0, Inject(SERVER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, PrismaService])
], ServersService);
export { ServersService };
//# sourceMappingURL=servers.service.js.map