import { describe, it, expect } from 'vitest';
import { ServerMember } from './server-member.entity.js';
import { ServerRole } from '../value-objects/server-role.vo.js';

describe('ServerMember Entity', () => {
  it('should successfully create a server member', () => {
    const res = ServerMember.create({
      serverId: 's1',
      userId: 'u1',
      role: ServerRole.owner(),
      username: 'jhonyspark',
    });

    expect(res.isSuccess).toBe(true);
    const member = res.getValue();
    expect(member.serverId).toBe('s1');
    expect(member.userId).toBe('u1');
    expect(member.isOwner()).toBe(true);
    expect(member.username).toBe('jhonyspark');
    expect(member.createdAt).toBeDefined();
  });

  it('should fail if serverId or userId is missing', () => {
    const res = ServerMember.create({
      serverId: '',
      userId: 'u1',
      role: ServerRole.member(),
    });
    expect(res.isFailure).toBe(true);
  });
});
