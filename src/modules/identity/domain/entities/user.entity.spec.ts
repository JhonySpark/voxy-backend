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

  it('should update profile fields successfully', () => {
    const user = User.create({
      username,
      email,
      password: 'initialpassword',
    }).getValue();

    const updateRes = user.updateProfile({
      displayName: 'Voxy User',
      bio: 'Coding with DDD and Clean Architecture',
      bannerColor: '#10b981',
    });

    expect(updateRes.isSuccess).toBe(true);
    expect(user.displayName).toBe('Voxy User');
    expect(user.bio).toBe('Coding with DDD and Clean Architecture');
    expect(user.bannerColor).toBe('#10b981');
  });

  it('should update and remove avatar and banner', () => {
    const user = User.create({
      username,
      email,
      password: 'initialpassword',
    }).getValue();

    const avatarRes = user.updateAvatar('https://r2.voxy.app/avatar.webp', 'avatars/avatar.webp');
    expect(avatarRes.isSuccess).toBe(true);
    expect(user.avatarUrl).toBe('https://r2.voxy.app/avatar.webp');
    expect(user.avatarKey).toBe('avatars/avatar.webp');

    user.removeAvatar();
    expect(user.avatarUrl).toBeNull();
    expect(user.avatarKey).toBeNull();

    const bannerRes = user.updateBanner('https://r2.voxy.app/banner.webp', 'banners/banner.webp');
    expect(bannerRes.isSuccess).toBe(true);
    expect(user.bannerUrl).toBe('https://r2.voxy.app/banner.webp');
    expect(user.bannerKey).toBe('banners/banner.webp');

    user.removeBanner();
    expect(user.bannerUrl).toBeNull();
    expect(user.bannerKey).toBeNull();
  });
});
