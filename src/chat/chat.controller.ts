import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
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

  @Patch('messages/:messageId')
  async editMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ) {
    return this.chatService.editDirectMessage(messageId, req.user.sub, content);
  }

  @Patch('messages/:messageId/reaction')
  async toggleReaction(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.chatService.toggleReaction(messageId, req.user.sub, emoji);
  }
}
