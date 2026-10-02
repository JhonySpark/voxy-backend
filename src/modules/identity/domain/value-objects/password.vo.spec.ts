import { describe, it, expect } from 'vitest';
import { Password } from './password.vo.js';

describe('Password Value Object', () => {
  it('should accept a secure password', () => {
    const res = Password.create('VoxyPass@2026');
    expect(res.isSuccess).toBe(true);
    expect(res.getValue().value).toBe('VoxyPass@2026');
  });

  it('should fail if password has less than 8 characters', () => {
    const res = Password.create('Pass1!');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('no mínimo 8 caracteres');
  });

  it('should fail if password has no uppercase letter', () => {
    const res = Password.create('voxypass@2026');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('letra maiúscula');
  });

  it('should fail if password has no lowercase letter', () => {
    const res = Password.create('VOXYPASS@2026');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('letra minúscula');
  });

  it('should fail if password has no number', () => {
    const res = Password.create('VoxyPassword@');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('número');
  });

  it('should fail if password has no special character', () => {
    const res = Password.create('VoxyPass2026');
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('caractere especial');
  });

  it('should fail if password is longer than 128 characters', () => {
    const res = Password.create('A1!' + 'a'.repeat(126));
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('128 caracteres');
  });
});
