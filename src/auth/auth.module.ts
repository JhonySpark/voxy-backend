import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import { BcryptPasswordHasherAdapter } from '../infrastructure/adapters/security/bcrypt-hasher.adapter.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import { JwtTokenServiceAdapter } from '../infrastructure/adapters/security/jwt-token.adapter.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useClass: JwtTokenServiceAdapter,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
