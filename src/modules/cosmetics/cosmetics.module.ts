import { Module } from '@nestjs/common';
import { CosmeticsController } from './cosmetics.controller.js';
import { CosmeticsService } from './cosmetics.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ChatModule } from '../../chat/chat.module.js';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [CosmeticsController],
  providers: [CosmeticsService],
  exports: [CosmeticsService],
})
export class CosmeticsModule {}
