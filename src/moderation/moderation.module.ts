import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { ModerationController } from './moderation.controller.js';
import { MODERATION_REPOSITORY } from '../core/ports/repositories/moderation.repository.port.js';
import { PrismaModerationRepository } from '../infrastructure/adapters/repositories/prisma-moderation.repository.js';
import { LoggingModule } from '../infrastructure/logging/logging.module.js';

@Module({
  imports: [LoggingModule],
  providers: [
    ModerationService,
    {
      provide: MODERATION_REPOSITORY,
      useClass: PrismaModerationRepository,
    },
  ],
  controllers: [ModerationController],
  exports: [ModerationService, MODERATION_REPOSITORY],
})
export class ModerationModule {}
