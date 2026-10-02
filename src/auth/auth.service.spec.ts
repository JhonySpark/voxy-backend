import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { BadRequestException } from '@nestjs/common';
import { PASSWORD_HASHER_PORT, IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT, ITokenServicePort } from '../core/ports/security/token-service.port.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findByUsername: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let tokenService: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let passwordHasher: { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      create: vi.fn(),
    };
    tokenService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TOKEN_SERVICE_PORT, useValue: tokenService },
        { provide: PASSWORD_HASHER_PORT, useValue: passwordHasher },
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
      passwordHasher.compare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordHasher.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
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
      passwordHasher.compare.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate an access token for user', async () => {
      tokenService.sign.mockReturnValue('mock_jwt_token');

      const user = { id: 'u1', username: 'tester' };
      const result = await service.login(user);

      expect(tokenService.sign).toHaveBeenCalledWith({ username: 'tester', sub: 'u1' });
      expect(result).toEqual({ access_token: 'mock_jwt_token' });
    });
  });

  describe('checkUsername', () => {
    it('should return available false if username is empty', async () => {
      const result = await service.checkUsername('');
      expect(result.available).toBe(false);
    });

    it('should return available false if username has invalid format', async () => {
      const result = await service.checkUsername('ab'); // less than 3
      expect(result.available).toBe(false);
    });

    it('should return available false if username is taken', async () => {
      usersService.findByUsername.mockResolvedValue({ id: 'u1', username: 'john_doe' });

      const result = await service.checkUsername('john_doe');
      expect(result.available).toBe(false);
      expect(result.message).toContain('já está em uso');
    });

    it('should return available true if username is valid and not taken', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      const result = await service.checkUsername('john_doe');
      expect(result.available).toBe(true);
      expect(result.message).toContain('disponível');
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if email is invalid', async () => {
      await expect(
        service.register({ email: 'invalid-email', username: 'valid_user', password: 'ValidPass@123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if username is invalid', async () => {
      await expect(
        service.register({ email: 'valid@example.com', username: 'x', password: 'ValidPass@123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is too simple', async () => {
      await expect(
        service.register({ email: 'valid@example.com', username: 'valid_user', password: 'simplepassword' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'existing@example.com', username: 'newuser', password: 'ValidPass@123' })
      ).rejects.toThrow('Este endereço de e-mail já está cadastrado.');
    });

    it('should throw BadRequestException if username already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'new@example.com', username: 'existing', password: 'ValidPass@123' })
      ).rejects.toThrow('Este nome de usuário já está em uso.');
    });

    it('should hash password and create user when inputs are valid', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed_secret');
      usersService.create.mockResolvedValue({
        id: 'new_id',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed_secret',
      });

      const result = await service.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'ValidPass@123',
      });

      expect(passwordHasher.hash).toHaveBeenCalledWith('ValidPass@123');
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
