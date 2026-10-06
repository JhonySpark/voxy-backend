import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';

/** Paginação por cursor: retorna as `limit` mensagens anteriores a `before` (id da mensagem) */
export interface MessagePageOptions {
  before?: string;
  limit?: number;
}

export interface IChannelRepository {
  create(channel: Channel): Promise<Channel>;
  update(channel: Channel): Promise<Channel>;
  findById(id: string): Promise<Channel | null>;
  findServerChannels(serverId: string): Promise<Channel[]>;
  delete(channelId: string): Promise<void>;
  saveMessage(channelId: string, senderId: string, content: string, attachmentId?: string, replyToId?: string): Promise<any>;
  getMessages(channelId: string, options?: MessagePageOptions): Promise<any[]>;
  deleteMessage(messageId: string): Promise<void>;
  findMessageById(messageId: string): Promise<any | null>;
  updateMessage(messageId: string, content: string): Promise<any>;
  toggleReaction(messageId: string, userId: string, emoji: string): Promise<any>;
}

export const CHANNEL_REPOSITORY = Symbol('CHANNEL_REPOSITORY');
