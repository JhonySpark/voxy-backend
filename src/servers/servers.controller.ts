import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async createServer(
    @Request() req: any,
    @Body('name') name: string,
    @Body('iconUrl') iconUrl?: string,
    @Body('iconKey') iconKey?: string,
  ) {
    if (iconUrl !== undefined || iconKey !== undefined) {
      return this.serversService.createServer(req.user.sub, name, iconUrl, iconKey);
    }
    return this.serversService.createServer(req.user.sub, name);
  }

  @Patch(':id')
  async updateServer(
    @Request() req: any,
    @Param('id') serverId: string,
    @Body() body: { name?: string; iconUrl?: string; iconKey?: string },
  ) {
    return this.serversService.updateServer(req.user.sub, serverId, body);
  }

  @Get()
  async getUserServers(@Request() req: any) {
    return this.serversService.getUserServers(req.user.sub);
  }

  @Get(':id')
  async getServerById(@Request() req: any, @Param('id') id: string) {
    return this.serversService.getServerById(id, req.user.sub);
  }

  @Post('join')
  async joinServer(@Request() req: any, @Body('inviteCode') inviteCode: string) {
    return this.serversService.joinServer(inviteCode, req.user.sub);
  }
}
