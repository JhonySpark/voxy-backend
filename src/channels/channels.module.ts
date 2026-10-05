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
import { ModerationModule } from '../moderation/moderation.module.js';

@Module({
  imports: [PrismaModule, ModerationModule],
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
export class ChannelsModule {}
