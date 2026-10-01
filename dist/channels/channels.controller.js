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
import { ChannelsService } from './channels.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
let ChannelsController = class ChannelsController {
    channelsService;
    constructor(channelsService) {
        this.channelsService = channelsService;
    }
    async createChannel(req, serverId, name, type) {
        return this.channelsService.createChannel(serverId, req.user.sub, name, type);
    }
    async deleteChannel(req, channelId) {
        await this.channelsService.deleteChannel(channelId, req.user.sub);
        return { success: true };
    }
    async renameChannel(req, channelId, name) {
        return this.channelsService.renameChannel(channelId, req.user.sub, name);
    }
    async getMessages(req, channelId) {
        return this.channelsService.getChannelMessages(channelId, req.user.sub);
    }
    async getVoiceToken(req, channelId, screen) {
        return this.channelsService.getVoiceToken(channelId, req.user, screen === 'true');
    }
    async getVoiceTokenGet(req, channelId, screen) {
        return this.channelsService.getVoiceToken(channelId, req.user, screen === 'true');
    }
};
__decorate([
    Post(':serverId'),
    __param(0, Request()),
    __param(1, Param('serverId')),
    __param(2, Body('name')),
    __param(3, Body('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "createChannel", null);
__decorate([
    Delete(':channelId'),
    __param(0, Request()),
    __param(1, Param('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "deleteChannel", null);
__decorate([
    Patch(':channelId'),
    __param(0, Request()),
    __param(1, Param('channelId')),
    __param(2, Body('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "renameChannel", null);
__decorate([
    Get(':channelId/messages'),
    __param(0, Request()),
    __param(1, Param('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getMessages", null);
__decorate([
    Post(':channelId/voice-token'),
    __param(0, Request()),
    __param(1, Param('channelId')),
    __param(2, Query('screen')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getVoiceToken", null);
__decorate([
    Get(':channelId/voice-token'),
    __param(0, Request()),
    __param(1, Param('channelId')),
    __param(2, Query('screen')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getVoiceTokenGet", null);
ChannelsController = __decorate([
    UseGuards(AuthGuard),
    Controller('channels'),
    __metadata("design:paramtypes", [ChannelsService])
], ChannelsController);
export { ChannelsController };
//# sourceMappingURL=channels.controller.js.map