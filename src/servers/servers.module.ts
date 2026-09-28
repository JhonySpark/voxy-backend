import { Module } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { ServersController } from './servers.controller.js';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import { PrismaServerRepository } from '../infrastructure/adapters/repositories/prisma-server.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [
    ServersService,
    {
      provide: SERVER_REPOSITORY,
      useClass: PrismaServerRepository,
    },
  ],
  controllers: [ServersController],
  exports: [ServersService, SERVER_REPOSITORY],
})
export class ServersModule {}
