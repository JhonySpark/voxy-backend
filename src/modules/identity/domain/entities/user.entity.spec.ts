import { describe, it, expect } from 'vitest';
import { User } from './user.entity.js';
import { Username } from '../value-objects/username.vo.js';
import { Email } from '../value-objects/email.vo.js';

describe('User Entity', () => {
  const username = Username.create('validuser').getValue();
  const email = Email.create('valid@example.com').getValue();

  it('should successfully create a user', () => {
    const userRes = User.create({
      username,
      email,
      password: 'hashedpassword',
    });

    expect(userRes.isSuccess).toBe(true);
    const user = userRes.getValue();
    expect(user.username.value).toBe('validuser');
    expect(user.email.value).toBe('valid@example.com');
    expect(user.password).toBe('hashedpassword');
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should fail if password is empty', () => {
    const userRes = User.create({
      username,
      email,
      password: '',
    });

    expect(userRes.isFailure).toBe(true);
    expect(userRes.error).toContain('senha é obrigatória');
  });

  it('should allow changing password', () => {
    const user = User.create({
      username,
      email,
      password: 'initialpassword',
    }).getValue();

    const changeRes = user.changePassword('newhashedpassword');
    expect(changeRes.isSuccess).toBe(true);
    expect(user.password).toBe('newhashedpassword');

    const invalidChange = user.changePassword('');
    expect(invalidChange.isFailure).toBe(true);
  });
});
