import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let jwtService: { sign: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    jwtService = {
      sign: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials match', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com', password: 'hashedpassword', username: 'tester' };
      usersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toEqual({ id: 'u1', email: 'test@example.com', username: 'tester' });
      expect((result as any).password).toBeUndefined();
    });

    it('should return null if user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com', password: 'hashedpassword', username: 'tester' };
      usersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate an access token for user', async () => {
      jwtService.sign.mockReturnValue('mock_jwt_token');

      const user = { id: 'u1', username: 'tester' };
      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({ username: 'tester', sub: 'u1' });
      expect(result).toEqual({ access_token: 'mock_jwt_token' });
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'existing@example.com', username: 'existing', password: 'pass' } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash password and create user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_secret' as never);
      usersService.create.mockResolvedValue({
        id: 'new_id',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed_secret',
      });

      const result = await service.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'plain_password',
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        username: 'newuser',
        password: 'hashed_secret',
      });
      expect(result).toEqual({
        id: 'new_id',
        username: 'newuser',
        email: 'new@example.com',
      });
      expect((result as any).password).toBeUndefined();
    });
  });
});
