import { Channel } from '../../../modules/servers/domain/entities/channel.entity.js';

export interface IChannelRepository {
  create(channel: Channel): Promise<Channel>;
  update(channel: Channel): Promise<Channel>;
  findById(id: string): Promise<Channel | null>;
  findServerChannels(serverId: string): Promise<Channel[]>;
  delete(channelId: string): Promise<void>;
  saveMessage(channelId: string, senderId: string, content: string, attachmentId?: string): Promise<any>;
  getMessages(channelId: string): Promise<any[]>;
  deleteMessage(messageId: string): Promise<void>;
  findMessageById(messageId: string): Promise<any | null>;
}

export const CHANNEL_REPOSITORY = Symbol('CHANNEL_REPOSITORY');
