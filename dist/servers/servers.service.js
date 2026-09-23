var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let ServersService = class ServersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createServer(ownerId, name) {
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
    async getUserServers(userId) {
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
    async getServerById(serverId, userId) {
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
                members: {
                    include: { user: { select: { id: true, username: true } } }
                }
            }
        });
        return server;
    }
    async joinServer(serverId, userId) {
        const server = await this.prisma.server.findUnique({
            where: { id: serverId },
            select: { id: true }
        });
        if (!server)
            throw new NotFoundException('Server not found');
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
};
ServersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ServersService);
export { ServersService };
//# sourceMappingURL=servers.service.js.map