import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
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

  @Get(':channelId/messages')
  async getMessages(@Request() req: any, @Param('channelId') channelId: string) {
    return this.channelsService.getChannelMessages(channelId, req.user.sub);
  }

  @Post(':channelId/voice-token')
  async getVoiceToken(@Request() req: any, @Param('channelId') channelId: string) {
    return this.channelsService.getVoiceToken(channelId, req.user);
  }
}
