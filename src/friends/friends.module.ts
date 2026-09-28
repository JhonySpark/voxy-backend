import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service.js';
import { FriendsController } from './friends.controller.js';
import { FRIENDSHIP_REPOSITORY } from '../core/ports/repositories/friendship.repository.port.js';
import { PrismaFriendshipRepository } from '../infrastructure/adapters/repositories/prisma-friendship.repository.js';

@Module({
  providers: [
    FriendsService,
    {
      provide: FRIENDSHIP_REPOSITORY,
      useClass: PrismaFriendshipRepository,
    },
  ],
  controllers: [FriendsController],
  exports: [FriendsService],
})
export class FriendsModule {}
