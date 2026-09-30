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

  it('should allow owner to update server name', () => {
    const server = Server.create('Dev Community', 'u_owner').getValue();
    const updateRes = server.updateName('New Name', 'u_owner');
    expect(updateRes.isSuccess).toBe(true);
    expect(server.name).toBe('New Name');

    const unauthorizedRes = server.updateName('Hacker Name', 'u_other');
    expect(unauthorizedRes.isFailure).toBe(true);
    expect(unauthorizedRes.error).toContain('Apenas o dono');
  });

  it('should allow owner to update and remove server icon', () => {
    const server = Server.create('Dev Community', 'u_owner').getValue();
    const iconRes = server.updateIcon('https://r2.voxy.app/icon.webp', 'servers/icon.webp', 'u_owner');
    expect(iconRes.isSuccess).toBe(true);
    expect(server.iconUrl).toBe('https://r2.voxy.app/icon.webp');
    expect(server.iconKey).toBe('servers/icon.webp');

    const unauthorizedRes = server.updateIcon('evil.png', 'key', 'u_other');
    expect(unauthorizedRes.isFailure).toBe(true);

    const removeRes = server.removeIcon('u_owner');
    expect(removeRes.isSuccess).toBe(true);
    expect(server.iconUrl).toBeNull();
    expect(server.iconKey).toBeNull();
  });
});
