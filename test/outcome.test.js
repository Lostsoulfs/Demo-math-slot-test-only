import { describe, it, expect } from 'vitest';
import { generateOutcome } from '../src/outcome.js';
import { SYMBOLS, BONUS } from '../src/config.js';

const IDS = new Set(SYMBOLS.map((s) => s.id));

describe('generateOutcome', () => {
  it('returns a 3×3 grid of valid symbol ids', () => {
    for (let n = 0; n < 200; n++) {
      const g = generateOutcome();
      expect(g).toHaveLength(3);
      for (const reel of g) {
        expect(reel).toHaveLength(3);
        for (const id of reel) expect(IDS.has(id)).toBe(true);
      }
    }
  });

  it('produces coins, and bonus triggers (6+ coins) do occur over many spins', () => {
    let withBonus = 0;
    let sawCoin = false;
    for (let n = 0; n < 2000; n++) {
      const g = generateOutcome();
      let coins = 0;
      for (const reel of g) for (const id of reel) if (id === 'coin') coins++;
      if (coins > 0) sawCoin = true;
      if (coins >= BONUS.triggerCount) withBonus++;
    }
    expect(sawCoin).toBe(true);
    // demo nudges force the bonus sometimes — should be reachable but not constant
    expect(withBonus).toBeGreaterThan(0);
    expect(withBonus).toBeLessThan(2000);
  });
});
