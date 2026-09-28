import { describe, it, expect } from 'vitest';
import { ServerRole } from './server-role.vo.js';

describe('ServerRole Value Object', () => {
  it('should create OWNER role', () => {
    const role = ServerRole.owner();
    expect(role.value).toBe('OWNER');
    expect(role.isOwner()).toBe(true);
  });

  it('should create MEMBER role', () => {
    const role = ServerRole.member();
    expect(role.value).toBe('MEMBER');
    expect(role.isOwner()).toBe(false);
  });

  it('should create role from valid string', () => {
    const roleRes = ServerRole.create('member');
    expect(roleRes.isSuccess).toBe(true);
    expect(roleRes.getValue().value).toBe('MEMBER');
  });

  it('should fail on invalid role string', () => {
    const roleRes = ServerRole.create('ADMIN');
    expect(roleRes.isFailure).toBe(true);
  });
});
