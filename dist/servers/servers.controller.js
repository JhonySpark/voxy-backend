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
import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
let ServersController = class ServersController {
    serversService;
    constructor(serversService) {
        this.serversService = serversService;
    }
    async createServer(req, name, is18Plus, iconUrl, iconKey) {
        return this.serversService.createServer(req.user.sub, name, is18Plus, iconUrl, iconKey);
    }
    async updateServer(req, serverId, body) {
        return this.serversService.updateServer(req.user.sub, serverId, body);
    }
    async getUserServers(req) {
        return this.serversService.getUserServers(req.user.sub);
    }
    async joinServer(req, inviteCode) {
        return this.serversService.joinServer(inviteCode, req.user.sub);
    }
    async getServerById(req, id) {
        return this.serversService.getServerById(id, req.user.sub);
    }
    async deleteServer(req, serverId) {
        return this.serversService.deleteServer(serverId, req.user.sub);
    }
    async getServerMembers(req, serverId) {
        return this.serversService.getServerMembers(serverId, req.user.sub);
    }
    async addMembers(req, serverId, userIds) {
        return this.serversService.addMembers(serverId, req.user.sub, userIds || []);
    }
    async updateMemberRole(req, serverId, targetUserId, role) {
        return this.serversService.updateMemberRole(serverId, req.user.sub, targetUserId, role);
    }
    async kickMember(req, serverId, targetUserId) {
        return this.serversService.kickMember(serverId, req.user.sub, targetUserId);
    }
    async muteMember(req, serverId, targetUserId, reason, durationMinutes) {
        return this.serversService.muteMember(serverId, req.user.sub, targetUserId, reason, durationMinutes);
    }
    async unmuteMember(req, serverId, targetUserId) {
        return this.serversService.unmuteMember(serverId, req.user.sub, targetUserId);
    }
    async getServerBans(req, serverId) {
        return this.serversService.getServerBans(serverId, req.user.sub);
    }
    async banMember(req, serverId, targetUserId, reason) {
        return this.serversService.banMember(serverId, req.user.sub, targetUserId, reason);
    }
    async unbanMember(req, serverId, targetUserId) {
        return this.serversService.unbanMember(serverId, req.user.sub, targetUserId);
    }
    async getRolePermissions(req, serverId) {
        return this.serversService.getRolePermissions(serverId, req.user.sub);
    }
    async updateRolePermissions(req, serverId, role, permissions) {
        return this.serversService.updateRolePermissions(serverId, req.user.sub, role, permissions);
    }
    async getMyPermissions(req, serverId) {
        return this.serversService.getUserPermissions(serverId, req.user.sub);
    }
    async getServerAuditLogs(req, serverId, action, limit, offset) {
        return this.serversService.getServerAuditLogs(serverId, req.user.sub, {
            action,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
    }
};
__decorate([
    Post(),
    __param(0, Request()),
    __param(1, Body('name')),
    __param(2, Body('is18Plus')),
    __param(3, Body('iconUrl')),
    __param(4, Body('iconKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "createServer", null);
__decorate([
    Patch(':id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "updateServer", null);
__decorate([
    Get(),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getUserServers", null);
__decorate([
    Post('join'),
    __param(0, Request()),
    __param(1, Body('inviteCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "joinServer", null);
__decorate([
    Get(':id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getServerById", null);
__decorate([
    Delete(':id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "deleteServer", null);
__decorate([
    Get(':id/members'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getServerMembers", null);
__decorate([
    Post(':id/members'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body('userIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "addMembers", null);
__decorate([
    Patch(':id/members/:userId/role'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Param('userId')),
    __param(3, Body('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "updateMemberRole", null);
__decorate([
    Delete(':id/members/:userId'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "kickMember", null);
__decorate([
    Post(':id/members/:userId/mute'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Param('userId')),
    __param(3, Body('reason')),
    __param(4, Body('durationMinutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "muteMember", null);
__decorate([
    Post(':id/members/:userId/unmute'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "unmuteMember", null);
__decorate([
    Get(':id/bans'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getServerBans", null);
__decorate([
    Post(':id/bans'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body('userId')),
    __param(3, Body('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "banMember", null);
__decorate([
    Delete(':id/bans/:userId'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "unbanMember", null);
__decorate([
    Get(':id/permissions'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getRolePermissions", null);
__decorate([
    Patch(':id/permissions/:role'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Param('role')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "updateRolePermissions", null);
__decorate([
    Get(':id/my-permissions'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getMyPermissions", null);
__decorate([
    Get(':id/audit-logs'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Query('action')),
    __param(3, Query('limit')),
    __param(4, Query('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getServerAuditLogs", null);
ServersController = __decorate([
    UseGuards(AuthGuard),
    Controller('servers'),
    __metadata("design:paramtypes", [ServersService])
], ServersController);
export { ServersController };
//# sourceMappingURL=servers.controller.js.map