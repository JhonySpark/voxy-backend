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
import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
let ServersController = class ServersController {
    serversService;
    constructor(serversService) {
        this.serversService = serversService;
    }
    async createServer(req, name) {
        return this.serversService.createServer(req.user.sub, name);
    }
    async getUserServers(req) {
        return this.serversService.getUserServers(req.user.sub);
    }
    async getServerById(req, id) {
        return this.serversService.getServerById(id, req.user.sub);
    }
    async joinServer(req, inviteCode) {
        return this.serversService.joinServer(inviteCode, req.user.sub);
    }
};
__decorate([
    Post(),
    __param(0, Request()),
    __param(1, Body('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "createServer", null);
__decorate([
    Get(),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getUserServers", null);
__decorate([
    Get(':id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getServerById", null);
__decorate([
    Post('join'),
    __param(0, Request()),
    __param(1, Body('inviteCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "joinServer", null);
ServersController = __decorate([
    UseGuards(AuthGuard),
    Controller('servers'),
    __metadata("design:paramtypes", [ServersService])
], ServersController);
export { ServersController };
//# sourceMappingURL=servers.controller.js.map