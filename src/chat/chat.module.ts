import { Module } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatController } from './chat.controller.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { FriendsModule } from '../friends/friends.module.js';
import { CHAT_REPOSITORY } from '../core/ports/repositories/chat.repository.port.js';
import { PrismaChatRepository } from '../infrastructure/adapters/repositories/prisma-chat.repository.js';

@Module({
  imports: [ChannelsModule, FriendsModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    {
      provide: CHAT_REPOSITORY,
      useClass: PrismaChatRepository,
    },
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
