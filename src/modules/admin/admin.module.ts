import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './guards/admin.guard.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ChatModule } from '../../chat/chat.module.js';
import { SystemConfigModule } from '../system-config/system-config.module.js';
import { ModerationModule } from '../../moderation/moderation.module.js';

@Module({
  imports: [
    PrismaModule,
    ChatModule,
    SystemConfigModule,
    ModerationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
