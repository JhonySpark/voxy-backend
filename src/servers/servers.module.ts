import { Module } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { ServersController } from './servers.controller.js';

@Module({
  providers: [ServersService],
  controllers: [ServersController]
})
export class ServersModule {}
