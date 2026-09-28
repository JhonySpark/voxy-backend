import { describe, it, expect, vi } from 'vitest';
import { BcryptPasswordHasherAdapter } from './bcrypt-hasher.adapter.js';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('BcryptPasswordHasherAdapter', () => {
  const adapter = new BcryptPasswordHasherAdapter();

  it('should hash password with 10 salt rounds', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_123' as never);

    const result = await adapter.hash('mypassword');
    expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
    expect(result).toBe('hashed_123');
  });

  it('should compare password and hash', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await adapter.compare('mypassword', 'hashed_123');
    expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', 'hashed_123');
    expect(result).toBe(true);
  });
});
