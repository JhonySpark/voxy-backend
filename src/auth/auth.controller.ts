import { Controller, Post, Get, Body, Query, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Credenciais inválidas.',
      });
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: { email: string; username: string; password?: string; birthDate: string }) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('resend-code')
  async resendCode(@Body() body: { email: string }) {
    return this.authService.resendCode(body.email);
  }

  @Post('sync-age-signal')
  @UseGuards(AuthGuard)
  async syncAgeSignal(
    @Request() req: any,
    @Body() body: {
      available: boolean;
      lower?: number;
      upper?: number;
      status?: string;
      nonce?: string;
      timestamp?: number;
      signature?: string;
    }
  ) {
    return this.authService.syncAgeSignal(req.user.sub, body);
  }

  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    return this.authService.checkUsername(username);
  }
}
