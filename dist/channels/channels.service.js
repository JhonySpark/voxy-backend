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
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service.js';
let ChannelsService = class ChannelsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createChannel(serverId, userId, name, type = 'TEXT') {
        const member = await this.prisma.serverMember.findUnique({
            where: {
                serverId_userId: {
                    serverId,
                    userId
                }
            }
        });
        if (!member || member.role !== 'OWNER') {
            throw new ForbiddenException('Only the owner can create channels');
        }
        return this.prisma.channel.create({
            data: {
                name,
                type,
                serverId
            }
        });
    }
    async getChannelMessages(channelId, userId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId }
        });
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.prisma.serverMember.findUnique({
            where: {
                serverId_userId: {
                    serverId: channel.serverId,
                    userId
                }
            }
        });
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        return this.prisma.channelMessage.findMany({
            where: { channelId },
            orderBy: { createdAt: 'asc' },
            include: { sender: true }
        });
    }
    async saveChannelMessage(channelId, senderId, content) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId }
        });
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.prisma.serverMember.findUnique({
            where: {
                serverId_userId: {
                    serverId: channel.serverId,
                    userId: senderId
                }
            }
        });
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        return this.prisma.channelMessage.create({
            data: {
                content,
                senderId,
                channelId
            },
            include: {
                sender: true
            }
        });
    }
    async getVoiceToken(channelId, user) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId }
        });
        if (!channel)
            throw new NotFoundException('Channel not found');
        const isMember = await this.prisma.serverMember.findUnique({
            where: {
                serverId_userId: {
                    serverId: channel.serverId,
                    userId: user.sub
                }
            }
        });
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this server');
        }
        const at = new AccessToken('devkey', 'secret', {
            identity: user.sub,
            name: user.username,
        });
        at.addGrant({ roomJoin: true, room: channelId });
        return { token: await at.toJwt() };
    }
};
ChannelsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ChannelsService);
export { ChannelsService };
//# sourceMappingURL=channels.service.js.map