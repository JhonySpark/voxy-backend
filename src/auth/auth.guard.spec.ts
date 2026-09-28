import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    jwtService = { verifyAsync: vi.fn() };
    guard = new AuthGuard(jwtService as unknown as JwtService);
  });

  const createMockContext = (authHeader?: string) => {
    const request: any = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  };

  it('should throw UnauthorizedException if header is missing', async () => {
    const { switchToHttp } = createMockContext();

    await expect(guard.canActivate({ switchToHttp } as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if header is not Bearer', async () => {
    const { switchToHttp } = createMockContext('Basic token123');

    await expect(guard.canActivate({ switchToHttp } as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    const { switchToHttp } = createMockContext('Bearer invalid_token');
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate({ switchToHttp } as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should set request.user and return true if token is valid', async () => {
    const { switchToHttp, request } = createMockContext('Bearer valid_token');
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', username: 'testuser' });

    const result = await guard.canActivate({ switchToHttp } as any);

    expect(result).toBe(true);
    expect(request.user).toEqual({ sub: 'u1', username: 'testuser' });
  });
});
