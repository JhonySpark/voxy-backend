import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ModerationService, CreateReportDto, ResolveReportDto } from './moderation.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  async createReport(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(req.user.sub, dto);
  }

  @Get('reports')
  async getReports(
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('targetServerId') targetServerId?: string,
  ) {
    return this.moderationService.getReports({
      status,
      targetType,
      targetUserId,
      targetServerId,
    });
  }

  @Get('reports/:id')
  async getReportById(@Param('id') id: string) {
    return this.moderationService.getReportById(id);
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.moderationService.resolveReport(req.user.sub, id, dto);
  }

  @Post('servers/:id/suspend')
  async suspendServer(
    @Request() req: any,
    @Param('id') serverId: string,
    @Body('reason') reason: string,
  ) {
    return this.moderationService.suspendServer(req.user.sub, serverId, reason);
  }

  @Post('servers/:id/unsuspend')
  async unsuspendServer(@Request() req: any, @Param('id') serverId: string) {
    return this.moderationService.unsuspendServer(req.user.sub, serverId);
  }

  @Post('users/:id/suspend')
  async suspendAccount(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body('reason') reason: string,
  ) {
    return this.moderationService.suspendAccount(req.user.sub, targetUserId, reason);
  }

  @Post('users/:id/unsuspend')
  async unsuspendAccount(@Request() req: any, @Param('id') targetUserId: string) {
    return this.moderationService.unsuspendAccount(req.user.sub, targetUserId);
  }
}
