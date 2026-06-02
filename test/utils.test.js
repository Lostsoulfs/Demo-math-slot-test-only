import { describe, it, expect } from 'vitest';
import { Ease, weightedPick, fmt, randInt } from '../src/utils.js';

describe('Ease', () => {
  it('all easings map 0→0 and 1→1', () => {
    for (const [name, fn] of Object.entries(Ease)) {
      expect(fn(0), `${name}(0)`).toBeCloseTo(0, 5);
      expect(fn(1), `${name}(1)`).toBeCloseTo(1, 5);
    }
  });
});

describe('weightedPick', () => {
  it('never picks a zero-weight item', () => {
    for (let n = 0; n < 200; n++) {
      expect(weightedPick(['a', 'b'], [0, 1])).toBe('b');
    }
  });
  it('only returns items from the list', () => {
    const items = ['x', 'y', 'z'];
    for (let n = 0; n < 200; n++) {
      expect(items).toContain(weightedPick(items, [1, 1, 1]));
    }
  });
});

describe('helpers', () => {
  it('fmt adds thousands separators', () => {
    expect(fmt(1234)).toBe('1,234');
    expect(fmt(1000000)).toBe('1,000,000');
  });
  it('randInt is inclusive and bounded', () => {
    for (let n = 0; n < 200; n++) {
      const v = randInt(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
    expect(randInt(3, 3)).toBe(3);
  });
});
