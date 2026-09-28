import { describe, it, expect } from 'vitest';
import { Username } from './username.vo.js';

describe('Username Value Object', () => {
  it('should create a valid username', () => {
    const res = Username.create('jhony');
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().value).toBe('jhony');
  });

  it('should fail if username is too short', () => {
    const res = Username.create('a');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('no mínimo 3');
  });

  it('should fail if username contains invalid characters', () => {
    const res = Username.create('user@name!');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('letras, números');
  });

  it('should fail if username is too long', () => {
    const res = Username.create('a'.repeat(33));
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('32 caracteres');
  });
});
