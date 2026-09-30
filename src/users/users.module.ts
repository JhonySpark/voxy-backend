import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { USER_REPOSITORY } from '../core/ports/repositories/user.repository.port.js';
import { PrismaUserRepository } from '../infrastructure/adapters/repositories/prisma-user.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import { BcryptPasswordHasherAdapter } from '../infrastructure/adapters/security/bcrypt-hasher.adapter.js';

@Module({
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
export class UsersModule {}
