import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':friendId')
  async getMessages(@Request() req: any, @Param('friendId') friendId: string) {
    return this.chatService.getMessagesBetweenUsers(req.user.sub, friendId);
  }
}
