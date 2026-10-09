import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { BadRequestException } from '@nestjs/common';
import { PASSWORD_HASHER_PORT, IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT, ITokenServicePort } from '../core/ports/security/token-service.port.js';
import { EMAIL_SERVICE_PORT } from '../core/ports/communication/email-service.port.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findByUsername: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let tokenService: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let passwordHasher: { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> };
  let emailService: { sendVerificationEmail: ReturnType<typeof vi.fn> };
  let prisma: {
    emailVerification: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    user: {
      update: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

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
    emailService = {
      sendVerificationEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'm1' }),
    };
    prisma = {
      emailVerification: {
        create: vi.fn().mockResolvedValue({ id: 'ev1' }),
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'u1' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'u1', isEmailVerified: true }),
        count: vi.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: prisma },
        { provide: TOKEN_SERVICE_PORT, useValue: tokenService },
        { provide: PASSWORD_HASHER_PORT, useValue: passwordHasher },
        { provide: EMAIL_SERVICE_PORT, useValue: emailService },
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

    it('should authenticate user by username if email is not found', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com', password: 'hashedpassword', username: 'tester' };
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(mockUser);
      passwordHasher.compare.mockResolvedValue(true);

      const result = await service.validateUser('tester', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith('tester');
      expect(usersService.findByUsername).toHaveBeenCalledWith('tester');
      expect(passwordHasher.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toEqual({ id: 'u1', email: 'test@example.com', username: 'tester' });
    });
  });

  describe('login', () => {
    it('should generate an access token for user', async () => {
      tokenService.sign.mockReturnValue('mock_jwt_token');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        isEmailVerified: true,
        ageClassification: 'ADULT',
      });

      const user = {
        id: 'u1',
        username: 'tester',
        email: 'tester@example.com',
        isEmailVerified: true,
        ageClassification: 'ADULT',
      };
      const result = await service.login(user);

      expect(tokenService.sign).toHaveBeenCalledWith({ username: 'tester', sub: 'u1' });
      expect(result).toMatchObject({ access_token: 'mock_jwt_token' });
    });

    it('should require email verification and resend code when isEmailVerified is false on login', async () => {
      const user = {
        id: 'u2',
        username: 'unverified_user',
        email: 'unverified@example.com',
        isEmailVerified: false,
        ageClassification: 'ADULT',
      };
      prisma.emailVerification.create.mockResolvedValue({});
      emailService.sendVerificationEmail.mockResolvedValue({ success: true });

      const result = await service.login(user);

      expect(result).toEqual({
        requireEmailVerification: true,
        email: 'unverified@example.com',
        message: 'Por favor, confirme seu endereço de e-mail para continuar.',
      });
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
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
        service.register({ email: 'invalid-email', username: 'valid_user', password: 'ValidPass@123', birthDate: '2000-01-01' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if username is invalid', async () => {
      await expect(
        service.register({ email: 'valid@example.com', username: 'x', password: 'ValidPass@123', birthDate: '2000-01-01' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is too simple', async () => {
      await expect(
        service.register({ email: 'valid@example.com', username: 'valid_user', password: 'simplepassword', birthDate: '2000-01-01' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'existing@example.com', username: 'newuser', password: 'ValidPass@123', birthDate: '2000-01-01' })
      ).rejects.toThrow('Este endereço de e-mail já está cadastrado.');
    });

    it('should throw BadRequestException if username already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'new@example.com', username: 'existing', password: 'ValidPass@123', birthDate: '2000-01-01' })
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
        birthDate: '2000-01-01',
      });

      expect(passwordHasher.hash).toHaveBeenCalledWith('ValidPass@123');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        username: 'newuser',
        password: 'hashed_secret',
        birthDate: expect.any(Date),
      });
      expect(result).toEqual({
        id: 'new_id',
        username: 'newuser',
        email: 'new@example.com',
        requireEmailVerification: true,
        message: expect.any(String),
      });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw BadRequestException if beta user capacity is reached', async () => {
      prisma.user.count.mockResolvedValue(50);

      await expect(
        service.register({
          email: 'beta51@example.com',
          username: 'beta51',
          password: 'ValidPass@123',
          birthDate: '2000-01-01',
        })
      ).rejects.toThrow('O limite de vagas para a fase beta');
    });

    it('should throw BadRequestException if acceptTerms is explicitly false', async () => {
      await expect(
        service.register({
          email: 'valid@example.com',
          username: 'valid_user',
          password: 'ValidPass@123',
          birthDate: '2000-01-01',
          acceptTerms: false,
        })
      ).rejects.toThrow('Você precisa aceitar os Termos de Uso');
    });
  });

  describe('getBetaStatus', () => {
    it('should return correct slots and isOpen status when under capacity', async () => {
      prisma.user.count.mockResolvedValue(10);
      const status = await service.getBetaStatus();

      expect(status.isOpen).toBe(true);
      expect(status.currentUsers).toBe(10);
      expect(status.maxUsers).toBe(50);
      expect(status.remainingSlots).toBe(40);
    });

    it('should return isOpen false when capacity is reached', async () => {
      prisma.user.count.mockResolvedValue(50);
      const status = await service.getBetaStatus();

      expect(status.isOpen).toBe(false);
      expect(status.remainingSlots).toBe(0);
    });
  });
});
