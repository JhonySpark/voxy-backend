import { describe, it, expect } from 'vitest';
import { Friendship } from './friendship.entity.js';

describe('Friendship Entity', () => {
  it('should create a valid friendship', () => {
    const res = Friendship.create({
      userId: 'u1',
      friendId: 'u2',
      status: 'PENDING',
    });

    expect(res.isSuccess).toBe(true);
    const friendship = res.getValue();
    expect(friendship.userId).toBe('u1');
    expect(friendship.friendId).toBe('u2');
    expect(friendship.status).toBe('PENDING');
    expect(friendship.isPending()).toBe(true);
    expect(friendship.isAccepted()).toBe(false);
  });

  it('should fail if adding self', () => {
    const res = Friendship.create({
      userId: 'u1',
      friendId: 'u1',
      status: 'PENDING',
    });
    expect(res.isFailure).toBe(true);
    expect(res.error).toContain('a si mesmo');
  });

  it('should fail if userId or friendId is missing', () => {
    const res = Friendship.create({
      userId: '',
      friendId: 'u2',
      status: 'PENDING',
    });
    expect(res.isFailure).toBe(true);
  });

  it('should allow accepting friendship and fail if already accepted', () => {
    const friendship = Friendship.create({
      userId: 'u1',
      friendId: 'u2',
      status: 'PENDING',
    }).getValue();

    const acceptRes = friendship.accept();
    expect(acceptRes.isSuccess).toBe(true);
    expect(friendship.status).toBe('ACCEPTED');
    expect(friendship.isAccepted()).toBe(true);

    const secondAccept = friendship.accept();
    expect(secondAccept.isFailure).toBe(true);
  });
});
