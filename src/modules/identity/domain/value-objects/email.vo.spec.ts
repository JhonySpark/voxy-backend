import { describe, it, expect } from 'vitest';
import { Email } from './email.vo.js';

describe('Email Value Object', () => {
  it('should create a valid email', () => {
    const emailResult = Email.create('user@domain.com');
    expect(emailResult.isSuccess).toBe(true);
    expect(emailResult.getValue().value).toBe('user@domain.com');
  });

  it('should trim and lowercase email', () => {
    const emailResult = Email.create('  John.Doe@EXAMPLE.COM  ');
    expect(emailResult.isSuccess).toBe(true);
    expect(emailResult.getValue().value).toBe('john.doe@example.com');
  });

  it('should fail on empty email', () => {
    const result = Email.create('');
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('não pode ser vazio');
  });

  it('should fail on invalid format', () => {
    const result = Email.create('not-an-email');
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('inválido');
  });
});
