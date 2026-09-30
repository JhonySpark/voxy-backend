import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';
import { ChatRetentionService } from './retention.service.js';
import { MediaCompressionService } from '../../infrastructure/media/media-compression.service.js';
import { STORAGE_PORT } from '../../core/ports/storage.port.js';
import { R2StorageAdapter } from '../../infrastructure/adapters/storage/r2-storage.adapter.js';

@Module({
  imports: [PrismaModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    ChatRetentionService,
    MediaCompressionService,
    {
      provide: STORAGE_PORT,
      useClass: R2StorageAdapter,
    },
  ],
  exports: [StorageService, STORAGE_PORT, MediaCompressionService, ChatRetentionService],
})
export class StorageModule {}
