import { describe, it, expect } from 'vitest';
import { Server } from './server.entity.js';
import { ChannelType } from '../value-objects/channel-type.vo.js';
import { ServerRole } from '../value-objects/server-role.vo.js';

describe('Server Entity Aggregate Root', () => {
  it('should initialize a new server with owner member and default channels', () => {
    const res = Server.create('Dev Community', 'u_owner');
    expect(res.isSuccess).toBe(true);
    const server = res.getValue();

    expect(server.name).toBe('Dev Community');
    expect(server.ownerId).toBe('u_owner');
    expect(server.isOwner('u_owner')).toBe(true);
    expect(server.isOwner('u_other')).toBe(false);

    // Default channels: geral (TEXT) and Voz Geral (VOICE)
    expect(server.channels).toHaveLength(2);
    expect(server.channels[0].name).toBe('geral');
    expect(server.channels[1].name).toBe('Voz Geral');

    // Default member: owner
    expect(server.members).toHaveLength(1);
    expect(server.members[0].userId).toBe('u_owner');
    expect(server.members[0].isOwner()).toBe(true);
  });

  it('should fail if server name is empty', () => {
    const res = Server.create('', 'u_owner');
    expect(res.isFailure).toBe(true);
  });

  it('should fail if ownerId is missing', () => {
    const res = Server.create('Valid Name', '');
    expect(res.isFailure).toBe(true);
  });

  it('should allow adding new members', () => {
    const server = Server.create('Dev Community', 'u_owner').getValue();
    const addRes = server.addMember('u_member_2');

    expect(addRes.isSuccess).toBe(true);
    expect(server.isMember('u_member_2')).toBe(true);
    expect(server.members).toHaveLength(2);
  });

  it('should prevent adding duplicate members', () => {
    const server = Server.create('Dev Community', 'u_owner').getValue();
    const addRes = server.addMember('u_owner');

    expect(addRes.isFailure).toBe(true);
    expect(addRes.error).toContain('já é membro');
  });

  it('should allow owner to create new channels', () => {
    const server = Server.create('Dev Community', 'u_owner').getValue();
    const chanRes = server.createChannel('announcements', ChannelType.text(), 'u_owner');

    expect(chanRes.isSuccess).toBe(true);
    expect(server.channels).toHaveLength(3);
    expect(chanRes.getValue().name).toBe('announcements');
  });

  it('should prevent non-owners from creating channels', () => {
    const server = Server.create('Dev Community', 'u_owner').getValue();
    server.addMember('u_regular');

    const chanRes = server.createChannel('announcements', ChannelType.text(), 'u_regular');
    expect(chanRes.isFailure).toBe(true);
    expect(chanRes.error).toContain('Apenas o dono');
  });
});
