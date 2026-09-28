import { describe, it, expect } from 'vitest';
import { Entity } from './entity.base.js';

interface TestProps {
  name: string;
}

class TestEntity extends Entity<TestProps> {
  constructor(props: TestProps, id?: string) {
    super(props, id);
  }
}

describe('Entity Base', () => {
  it('should generate an id if none provided', () => {
    const entity = new TestEntity({ name: 'Alpha' });
    expect(entity.id).toBeDefined();
    expect(typeof entity.id).toBe('string');
  });

  it('should use provided id', () => {
    const entity = new TestEntity({ name: 'Alpha' }, 'custom-id-123');
    expect(entity.id).toBe('custom-id-123');
  });

  it('should correctly compare equality', () => {
    const e1 = new TestEntity({ name: 'Alpha' }, 'id-1');
    const e2 = new TestEntity({ name: 'Beta' }, 'id-1');
    const e3 = new TestEntity({ name: 'Alpha' }, 'id-2');

    expect(e1.equals(e2)).toBe(true);
    expect(e1.equals(e3)).toBe(false);
    expect(e1.equals(null as any)).toBe(false);
    expect(e1.equals(undefined as any)).toBe(false);
    expect(e1.equals({ id: 'id-1' } as any)).toBe(false);
    expect(e1.equals(e1)).toBe(true);
  });
});
