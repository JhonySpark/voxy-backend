var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { ChannelsController } from './channels.controller.js';
import { CHANNEL_REPOSITORY } from '../core/ports/repositories/channel.repository.port.js';
import { PrismaChannelRepository } from '../infrastructure/adapters/repositories/prisma-channel.repository.js';
import { SERVER_REPOSITORY } from '../core/ports/repositories/server.repository.port.js';
import { PrismaServerRepository } from '../infrastructure/adapters/repositories/prisma-server.repository.js';
import { VOICE_ENGINE_PORT } from '../core/ports/voice-engine.port.js';
import { LivekitVoiceAdapter } from '../infrastructure/adapters/voice/livekit-voice.adapter.js';
import { PrismaModule } from '../prisma/prisma.module.js';
let ChannelsModule = class ChannelsModule {
};
ChannelsModule = __decorate([
    Module({
        imports: [PrismaModule],
        controllers: [ChannelsController],
        providers: [
            ChannelsService,
            {
                provide: CHANNEL_REPOSITORY,
                useClass: PrismaChannelRepository,
            },
            {
                provide: SERVER_REPOSITORY,
                useClass: PrismaServerRepository,
            },
            {
                provide: VOICE_ENGINE_PORT,
                useClass: LivekitVoiceAdapter,
            },
        ],
        exports: [ChannelsService, CHANNEL_REPOSITORY, VOICE_ENGINE_PORT],
    })
], ChannelsModule);
export { ChannelsModule };
//# sourceMappingURL=channels.module.js.map