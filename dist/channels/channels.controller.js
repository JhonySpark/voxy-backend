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
    async getMessages(req, channelId) {
        return this.channelsService.getChannelMessages(channelId, req.user.sub);
    }
    async getVoiceToken(req, channelId) {
        return this.channelsService.getVoiceToken(channelId, req.user);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getVoiceToken", null);
ChannelsController = __decorate([
    UseGuards(AuthGuard),
    Controller('channels'),
    __metadata("design:paramtypes", [ChannelsService])
], ChannelsController);
export { ChannelsController };
//# sourceMappingURL=channels.controller.js.map