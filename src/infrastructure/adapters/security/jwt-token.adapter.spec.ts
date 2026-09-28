import { describe, it, expect, vi } from 'vitest';
import { JwtTokenServiceAdapter } from './jwt-token.adapter.js';

describe('JwtTokenServiceAdapter', () => {
  const jwtServiceMock = {
    sign: vi.fn(),
    verifyAsync: vi.fn(),
  };

  const adapter = new JwtTokenServiceAdapter(jwtServiceMock as any);

  it('should sign payload', () => {
    jwtServiceMock.sign.mockReturnValue('jwt.token.here');

    const token = adapter.sign({ sub: 'u1' });
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({ sub: 'u1' });
    expect(token).toBe('jwt.token.here');
  });

  it('should verify token asynchronously', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'u1' });

    const payload = await adapter.verifyAsync('jwt.token.here');
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalled();
    expect(payload).toEqual({ sub: 'u1' });
  });
});
