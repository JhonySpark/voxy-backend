import { describe, it, expect } from 'vitest';
import { ServerRole } from './server-role.vo.js';

describe('ServerRole Value Object', () => {
  it('should create OWNER role', () => {
    const role = ServerRole.owner();
    expect(role.value).toBe('OWNER');
    expect(role.isOwner()).toBe(true);
  });

  it('should create ADMIN role', () => {
    const role = ServerRole.admin();
    expect(role.value).toBe('ADMIN');
    expect(role.isAdmin()).toBe(true);
  });

  it('should create MODERATOR role', () => {
    const role = ServerRole.moderator();
    expect(role.value).toBe('MODERATOR');
    expect(role.isModerator()).toBe(true);
  });

  it('should create MEMBER role', () => {
    const role = ServerRole.member();
    expect(role.value).toBe('MEMBER');
    expect(role.isMember()).toBe(true);
    expect(role.isOwner()).toBe(false);
  });

  it('should create role from valid string', () => {
    const roleRes = ServerRole.create('member');
    expect(roleRes.isSuccess).toBe(true);
    expect(roleRes.getValue().value).toBe('MEMBER');

    const adminRes = ServerRole.create('admin');
    expect(adminRes.isSuccess).toBe(true);
    expect(adminRes.getValue().value).toBe('ADMIN');
  });

  it('should fail on invalid role string', () => {
    const roleRes = ServerRole.create('GUEST');
    expect(roleRes.isFailure).toBe(true);
  });
});
