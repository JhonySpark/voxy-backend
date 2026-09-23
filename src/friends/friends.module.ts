import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service.js';
import { FriendsController } from './friends.controller.js';

@Module({
  providers: [FriendsService],
  controllers: [FriendsController]
})
export class FriendsModule {}
