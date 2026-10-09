import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    validateUser: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    checkUsername: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      validateUser: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      checkUsername: vi.fn(),
      getBetaStatus: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate user and return login token', async () => {
      const mockUser = { id: 'u1', username: 'test' };
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue({ access_token: 'token123' });

      const result = await controller.login({ email: 'test@test.com', password: 'password' });

      expect(authService.validateUser).toHaveBeenCalledWith('test@test.com', 'password');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ access_token: 'token123' });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login({ email: 'invalid@test.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user and return result', async () => {
      const registerData = { username: 'newuser', email: 'new@test.com', password: 'password' } as any;
      const createdUser = { id: 'u2', username: 'newuser', email: 'new@test.com' };
      authService.register.mockResolvedValue(createdUser);

      const result = await controller.register(registerData);

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(result).toEqual(createdUser);
    });
  });

  describe('checkUsername', () => {
    it('should return availability info from authService', async () => {
      authService.checkUsername.mockResolvedValue({ available: true, message: 'Disponível' });

      const result = await controller.checkUsername('testuser');

      expect(authService.checkUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual({ available: true, message: 'Disponível' });
    });
  });

  describe('getBetaStatus', () => {
    it('should return beta status from authService', async () => {
      const mockStatus = { isOpen: true, currentUsers: 10, maxUsers: 50, remainingSlots: 40 };
      authService.getBetaStatus.mockResolvedValue(mockStatus);

      const result = await controller.getBetaStatus();

      expect(authService.getBetaStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });
});
