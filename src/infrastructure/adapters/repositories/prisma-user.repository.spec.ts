import { describe, it, expect, vi } from 'vitest';
import { PrismaUserRepository } from './prisma-user.repository.js';
import { User } from '../../../modules/identity/domain/entities/user.entity.js';
import { Email } from '../../../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../../../modules/identity/domain/value-objects/username.vo.js';

describe('PrismaUserRepository', () => {
  let repo: PrismaUserRepository;
  let prismaMock: { user: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    prismaMock = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    repo = new PrismaUserRepository(prismaMock as any);
  });

  const domainUser = User.create(
    {
      username: Username.create('alice').getValue(),
      email: Email.create('alice@example.com').getValue(),
      password: 'password123',
    },
    'u1'
  ).getValue();

  it('should create and map user to domain', async () => {
    prismaMock.user.create.mockResolvedValue({
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repo.create(domainUser);
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(result.id).toBe('u1');
    expect(result.username.value).toBe('alice');
  });

  it('should find user by username or return null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    }).mockResolvedValueOnce(null);

    const found = await repo.findByUsername('alice');
    expect(found).not.toBeNull();
    expect(found?.username.value).toBe('alice');

    const notFound = await repo.findByUsername('nobody');
    expect(notFound).toBeNull();
  });

  it('should find user by email or return null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email.value).toBe('alice@example.com');
  });

  it('should find user by id or return null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    const found = await repo.findById('u1');
    expect(found?.id).toBe('u1');
  });

  it('should update user and map to domain', async () => {
    prismaMock.user.update = vi.fn().mockResolvedValue({
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice Cooper',
      bio: 'Singer and dev',
      bannerColor: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    domainUser.updateProfile({ displayName: 'Alice Cooper', bio: 'Singer and dev', bannerColor: '#3b82f6' });
    const result = await repo.update(domainUser);
    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(result.displayName).toBe('Alice Cooper');
    expect(result.bio).toBe('Singer and dev');
  });
});
