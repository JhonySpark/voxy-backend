import { describe, it, expect } from 'vitest';
import { ChannelType } from './channel-type.vo.js';

describe('ChannelType Value Object', () => {
  it('should create TEXT channel type', () => {
    const type = ChannelType.text();
    expect(type.value).toBe('TEXT');
    expect(type.isText()).toBe(true);
    expect(type.isVoice()).toBe(false);
  });

  it('should create VOICE channel type', () => {
    const type = ChannelType.voice();
    expect(type.value).toBe('VOICE');
    expect(type.isVoice()).toBe(true);
    expect(type.isText()).toBe(false);
  });

  it('should create type from valid string', () => {
    const res = ChannelType.create('voice');
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().value).toBe('VOICE');
  });

  it('should fail on invalid type string', () => {
    const res = ChannelType.create('VIDEO');
    expect(res.isFailure).toBe(true);
  });
});
