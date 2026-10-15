import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { AdminService } from './admin.service.js';
import {
  UpdateUserDto,
  UpdateSystemConfigDto,
  AdminResolveReportDto,
  QueryUsersDto,
  QueryReportsDto,
} from './dto/admin.dto.js';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id')
  async updateUser(
    @Request() req: any,
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, req.user.sub, dto);
  }

  @Get('reports')
  async getReports(@Query() query: QueryReportsDto) {
    return this.adminService.getReports(query);
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Request() req: any,
    @Param('id') reportId: string,
    @Body() dto: AdminResolveReportDto,
  ) {
    return this.adminService.resolveReport(reportId, req.user.sub, dto);
  }

  @Get('servers')
  async getServers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getServers(search, page, limit);
  }

  @Post('servers/:id/suspend')
  async suspendServer(
    @Request() req: any,
    @Param('id') serverId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendServer(serverId, req.user.sub, reason);
  }

  @Post('servers/:id/unsuspend')
  async unsuspendServer(@Request() req: any, @Param('id') serverId: string) {
    return this.adminService.unsuspendServer(serverId, req.user.sub);
  }

  @Get('config')
  async getSystemConfig() {
    return this.adminService.getSystemConfig();
  }

  @Patch('config')
  async updateSystemConfig(@Body() dto: UpdateSystemConfigDto) {
    return this.adminService.updateSystemConfig(dto);
  }

  @Get('audit-logs')
  async getAuditLogs(@Request() req: any, @Query() query: any) {
    return this.adminService.getAuditLogs(req.user.sub, query);
  }

  @Get('cosmetics')
  async getAllCosmetics() {
    return this.adminService.getAllCosmetics();
  }

  @Get('users/:id/cosmetics')
  async getUserCosmetics(@Param('id') userId: string) {
    return this.adminService.getUserCosmetics(userId);
  }

  @Post('users/:id/cosmetics/:itemId')
  async grantCosmeticToUser(
    @Request() req: any,
    @Param('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.adminService.grantCosmeticToUser(userId, itemId, req.user.sub);
  }

  @Delete('users/:id/cosmetics/:itemId')
  async revokeCosmeticFromUser(
    @Request() req: any,
    @Param('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.adminService.revokeCosmeticFromUser(userId, itemId, req.user.sub);
  }
}
