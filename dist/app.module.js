var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
let CustomThrottlerGuard = class CustomThrottlerGuard extends ThrottlerGuard {
    async canActivate(context) {
        if (context.getType() === 'ws') {
            return true;
        }
        return super.canActivate(context);
    }
};
CustomThrottlerGuard = __decorate([
    Injectable()
], CustomThrottlerGuard);
export { CustomThrottlerGuard };
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            PrismaModule,
            UsersModule,
            AuthModule,
            FriendsModule,
            ChatModule,
            ServersModule,
            ChannelsModule
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map