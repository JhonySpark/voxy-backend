import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post(':serverId')
  async createChannel(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @Body('name') name: string,
    @Body('type') type: 'TEXT' | 'VOICE'
  ) {
    return this.channelsService.createChannel(serverId, req.user.sub, name, type);
  }

  @Delete(':channelId')
  async deleteChannel(@Request() req: any, @Param('channelId') channelId: string) {
    await this.channelsService.deleteChannel(channelId, req.user.sub);
    return { success: true };
  }

  @Patch(':channelId')
  async renameChannel(
    @Request() req: any,
    @Param('channelId') channelId: string,
    @Body('name') name: string,
  ) {
    return this.channelsService.renameChannel(channelId, req.user.sub, name);
  }

  @Get(':channelId/messages')
  async getMessages(@Request() req: any, @Param('channelId') channelId: string) {
    return this.channelsService.getChannelMessages(channelId, req.user.sub);
  }

  @Delete(':channelId/messages/:messageId')
  async deleteMessage(
    @Request() req: any,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.channelsService.deleteChannelMessage(channelId, messageId, req.user.sub);
  }

  @Patch(':channelId/messages/:messageId')
  async editMessage(
    @Request() req: any,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ) {
    return this.channelsService.editChannelMessage(channelId, messageId, req.user.sub, content);
  }

  @Post(':channelId/voice-token')
  async getVoiceToken(@Request() req: any, @Param('channelId') channelId: string, @Query('screen') screen?: string) {
    return this.channelsService.getVoiceToken(channelId, req.user, screen === 'true');
  }

  @Get(':channelId/voice-token')
  async getVoiceTokenGet(@Request() req: any, @Param('channelId') channelId: string, @Query('screen') screen?: string) {
    return this.channelsService.getVoiceToken(channelId, req.user, screen === 'true');
  }
}
