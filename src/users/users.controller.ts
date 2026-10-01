import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.sub, req.user.sub);
  }

  @Get(':id')
  async getUserProfile(@Request() req: any, @Param('id') id: string) {
    return this.usersService.getProfile(id, req.user.sub);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() body: { displayName?: string; bio?: string; bannerColor?: string },
  ) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Patch('change-password')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }
}

