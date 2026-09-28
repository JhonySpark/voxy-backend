import { describe, it, expect } from 'vitest';
import { Channel } from './channel.entity.js';
import { ChannelType } from '../value-objects/channel-type.vo.js';

describe('Channel Entity', () => {
  it('should create a valid channel', () => {
    const res = Channel.create({
      name: 'general',
      type: ChannelType.text(),
      serverId: 's1',
    });

    expect(res.isSuccess).toBe(true);
    const channel = res.getValue();
    expect(channel.name).toBe('general');
    expect(channel.type.isText()).toBe(true);
    expect(channel.serverId).toBe('s1');
    expect(channel.createdAt).toBeDefined();
  });

  it('should fail if channel name is empty', () => {
    const res = Channel.create({
      name: '  ',
      type: ChannelType.text(),
      serverId: 's1',
    });
    expect(res.isFailure).toBe(true);
  });

  it('should fail if serverId is missing', () => {
    const res = Channel.create({
      name: 'general',
      type: ChannelType.text(),
      serverId: '',
    });
    expect(res.isFailure).toBe(true);
  });
});
