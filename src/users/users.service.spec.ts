import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { USER_REPOSITORY, IUserRepository } from '../core/ports/repositories/user.repository.port.js';
import { User } from '../modules/identity/domain/entities/user.entity.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    findByUsername: ReturnType<typeof vi.fn>;
  };

  const createMockDomainUser = (id: string, username: string, email: string, password = 'hashedPassword') => {
    return User.create(
      {
        username: Username.create(username).getValue(),
        email: Email.create(email).getValue(),
        password,
      },
      id
    ).getValue();
  };

  beforeEach(async () => {
    userRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: PrismaService, useValue: {} },
        { provide: PASSWORD_HASHER_PORT, useValue: { hash: vi.fn(), compare: vi.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user via user repository port', async () => {
      const input = { username: 'testuser', email: 'test@example.com', password: 'hash' };
      const domainUser = createMockDomainUser('u1', input.username, input.email, input.password);
      userRepo.create.mockResolvedValue(domainUser);

      const result = await service.create(input);

      expect(userRepo.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'u1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hash',
        birthDate: null,
        isEmailVerified: false,
        ageClassification: 'UNKNOWN',
        ageSignalSource: 'NONE',
      });
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const domainUser = createMockDomainUser('u1', 'john', 'john@example.com');
      userRepo.findByUsername.mockResolvedValue(domainUser);

      const result = await service.findByUsername('john');

      expect(userRepo.findByUsername).toHaveBeenCalledWith('john');
      expect(result).toEqual({
        id: 'u1',
        username: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
        birthDate: null,
        isEmailVerified: false,
        ageClassification: 'UNKNOWN',
        ageSignalSource: 'NONE',
        isSuspended: false,
        suspendedReason: undefined,
      });
    });

    it('should return null if user not found by username', async () => {
      userRepo.findByUsername.mockResolvedValue(null);

      const result = await service.findByUsername('ghost');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const domainUser = createMockDomainUser('u1', 'john', 'john@example.com');
      userRepo.findByEmail.mockResolvedValue(domainUser);

      const result = await service.findByEmail('john@example.com');

      expect(userRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual({
        id: 'u1',
        username: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
        birthDate: null,
        isEmailVerified: false,
        ageClassification: 'UNKNOWN',
        ageSignalSource: 'NONE',
        isSuspended: false,
        suspendedReason: undefined,
      });
    });

    it('should return null if user not found by email', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const domainUser = createMockDomainUser('u1', 'john', 'john@example.com');
      userRepo.findById.mockResolvedValue(domainUser);

      const result = await service.findById('u1');

      expect(userRepo.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        id: 'u1',
        username: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
        birthDate: null,
        isEmailVerified: false,
        ageClassification: 'UNKNOWN',
        ageSignalSource: 'NONE',
        isSuspended: false,
        suspendedReason: undefined,
      });
    });

    it('should return null if user not found by id', async () => {
      userRepo.findById.mockResolvedValue(null);

      const result = await service.findById('u999');
      expect(result).toBeNull();
    });
  });
});
