var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { USER_REPOSITORY } from '../core/ports/repositories/user.repository.port.js';
import { PrismaUserRepository } from '../infrastructure/adapters/repositories/prisma-user.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import { BcryptPasswordHasherAdapter } from '../infrastructure/adapters/security/bcrypt-hasher.adapter.js';
let UsersModule = class UsersModule {
};
UsersModule = __decorate([
    Module({
        imports: [PrismaModule],
        controllers: [UsersController],
        providers: [
            UsersService,
            {
                provide: USER_REPOSITORY,
                useClass: PrismaUserRepository,
            },
            {
                provide: PASSWORD_HASHER_PORT,
                useClass: BcryptPasswordHasherAdapter,
            },
        ],
        exports: [UsersService, USER_REPOSITORY],
    })
], UsersModule);
export { UsersModule };
//# sourceMappingURL=users.module.js.map