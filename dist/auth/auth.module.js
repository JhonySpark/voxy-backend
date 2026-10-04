var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import { BcryptPasswordHasherAdapter } from '../infrastructure/adapters/security/bcrypt-hasher.adapter.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import { JwtTokenServiceAdapter } from '../infrastructure/adapters/security/jwt-token.adapter.js';
import { EMAIL_SERVICE_PORT } from '../core/ports/communication/email-service.port.js';
import { ResendEmailAdapter } from '../infrastructure/adapters/communication/resend-email.adapter.js';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            UsersModule,
            PrismaModule,
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
            {
                provide: EMAIL_SERVICE_PORT,
                useClass: ResendEmailAdapter,
            },
        ],
        exports: [AuthService],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map