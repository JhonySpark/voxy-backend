import { describe, it, expect } from 'vitest';
import { Result } from './result.js';

describe('Result', () => {
  it('should create an ok result', () => {
    const result = Result.ok<string>('hello');
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe('hello');
  });

  it('should create an ok result with void', () => {
    const result = Result.ok<void>();
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBeUndefined();
  });

  it('should create a fail result', () => {
    const result = Result.fail<string>('something bad happened');
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('something bad happened');
  });

  it('should throw when getting value from a failed result', () => {
    const result = Result.fail<string>('error');
    expect(() => result.getValue()).toThrowError(/Cant retrieve the value/);
  });

  it('should throw if created invalidly with success but an error', () => {
    expect(() => new (Result as any)(true, 'some error', 'value')).toThrowError(/InvalidOperation/);
  });

  it('should throw if created invalidly with failure but no error', () => {
    expect(() => new (Result as any)(false, undefined)).toThrowError(/InvalidOperation/);
  });

  it('should combine multiple results and return first failure', () => {
    const ok1 = Result.ok(1);
    const ok2 = Result.ok(2);
    const fail1 = Result.fail('err1');
    const fail2 = Result.fail('err2');

    const combinedOk = Result.combine([ok1, ok2]);
    expect(combinedOk.isSuccess).toBe(true);

    const combinedFail = Result.combine([ok1, fail1, fail2]);
    expect(combinedFail.isFailure).toBe(true);
    expect(combinedFail.error).toBe('err1');
  });
});
