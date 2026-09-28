import { describe, it, expect } from 'vitest';
import { ValueObject } from './value-object.base.js';

interface ColorProps {
  r: number;
  g: number;
  b: number;
}

class ColorVO extends ValueObject<ColorProps> {
  constructor(props: ColorProps) {
    super(props);
  }
}

describe('ValueObject Base', () => {
  it('should compare structural equality', () => {
    const c1 = new ColorVO({ r: 255, g: 0, b: 0 });
    const c2 = new ColorVO({ r: 255, g: 0, b: 0 });
    const c3 = new ColorVO({ r: 0, g: 255, b: 0 });

    expect(c1.equals(c2)).toBe(true);
    expect(c1.equals(c3)).toBe(false);
    expect(c1.equals(null as any)).toBe(false);
    expect(c1.equals(undefined as any)).toBe(false);
    expect(c1.equals({ props: { r: 255, g: 0, b: 0 } } as any)).toBe(false);
  });
});
