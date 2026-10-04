import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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
    @Body('is18Plus') is18Plus?: boolean,
    @Body('iconUrl') iconUrl?: string,
    @Body('iconKey') iconKey?: string,
  ) {
    return this.serversService.createServer(req.user.sub, name, is18Plus, iconUrl, iconKey);
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

  @Post('join')
  async joinServer(@Request() req: any, @Body('inviteCode') inviteCode: string) {
    return this.serversService.joinServer(inviteCode, req.user.sub);
  }

  @Get(':id')
  async getServerById(@Request() req: any, @Param('id') id: string) {
    return this.serversService.getServerById(id, req.user.sub);
  }

  @Delete(':id')
  async deleteServer(@Request() req: any, @Param('id') serverId: string) {
    return this.serversService.deleteServer(serverId, req.user.sub);
  }

  @Get(':id/members')
  async getServerMembers(@Request() req: any, @Param('id') serverId: string) {
    return this.serversService.getServerMembers(serverId, req.user.sub);
  }

  @Post(':id/members')
  async addMembers(
    @Request() req: any,
    @Param('id') serverId: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.serversService.addMembers(serverId, req.user.sub, userIds || []);
  }

  @Patch(':id/members/:userId/role')
  async updateMemberRole(
    @Request() req: any,
    @Param('id') serverId: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: string,
  ) {
    return this.serversService.updateMemberRole(serverId, req.user.sub, targetUserId, role);
  }

  @Delete(':id/members/:userId')
  async kickMember(
    @Request() req: any,
    @Param('id') serverId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.serversService.kickMember(serverId, req.user.sub, targetUserId);
  }

  @Get(':id/bans')
  async getServerBans(@Request() req: any, @Param('id') serverId: string) {
    return this.serversService.getServerBans(serverId, req.user.sub);
  }

  @Post(':id/bans')
  async banMember(
    @Request() req: any,
    @Param('id') serverId: string,
    @Body('userId') targetUserId: string,
    @Body('reason') reason?: string,
  ) {
    return this.serversService.banMember(serverId, req.user.sub, targetUserId, reason);
  }

  @Delete(':id/bans/:userId')
  async unbanMember(
    @Request() req: any,
    @Param('id') serverId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.serversService.unbanMember(serverId, req.user.sub, targetUserId);
  }

  @Get(':id/permissions')
  async getRolePermissions(@Request() req: any, @Param('id') serverId: string) {
    return this.serversService.getRolePermissions(serverId, req.user.sub);
  }

  @Patch(':id/permissions/:role')
  async updateRolePermissions(
    @Request() req: any,
    @Param('id') serverId: string,
    @Param('role') role: string,
    @Body() permissions: any,
  ) {
    return this.serversService.updateRolePermissions(serverId, req.user.sub, role, permissions);
  }

  @Get(':id/my-permissions')
  async getMyPermissions(@Request() req: any, @Param('id') serverId: string) {
    return this.serversService.getUserPermissions(serverId, req.user.sub);
  }
}
