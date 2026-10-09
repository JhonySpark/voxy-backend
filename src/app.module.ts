import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FriendsModule } from './friends/friends.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ServersModule } from './servers/servers.module.js';
import { ChannelsModule } from './channels/channels.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { LoggingModule } from './infrastructure/logging/logging.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SystemConfigModule } from './modules/system-config/system-config.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') {
      return true;
    }
    return super.canActivate(context);
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    ScheduleModule.forRoot(),
    LoggingModule,
    HealthModule,
    SystemConfigModule,
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    FriendsModule, 
    ChatModule, 
    ServersModule, 
    ChannelsModule,
    StorageModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    }
  ],
})
export class AppModule {}
