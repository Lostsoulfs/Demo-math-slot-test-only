import { describe, it, expect } from 'vitest';
import { generateOutcome } from '../src/outcome.js';
import { withSeededRandom } from './helpers/seededRng.js';
import { SYMBOLS, BONUS, GRID } from '../src/config.js';

const IDS = new Set(SYMBOLS.map((s) => s.id));

describe('generateOutcome', () => {
  it('returns a GRID.reels × GRID.rows grid of valid symbol ids', () => {
    for (let n = 0; n < 200; n++) {
      const g = generateOutcome();
      expect(g).toHaveLength(GRID.reels);
      for (const reel of g) {
        expect(reel).toHaveLength(GRID.rows);
        for (const id of reel) expect(IDS.has(id)).toBe(true);
      }
    }
  });

  it('triggers the bonus naturally (no nudges) at roughly the computed rate', () => {
    // Pure RNG: ~25% of cells are coins, so P(6+ of 9) ≈ 1%. Over many seeded
    // spins the natural trigger rate should land in a sane band — the bonus is
    // reachable in real play, not forced. (Seeded -> deterministic, no flake.)
    const N = 40_000;
    const { withBonus, coinTotal } = withSeededRandom(2026, () => {
      let withBonus = 0;
      let coinTotal = 0;
      for (let n = 0; n < N; n++) {
        const g = generateOutcome();
        let coins = 0;
        for (const reel of g) for (const id of reel) if (id === 'coin') coins++;
        coinTotal += coins;
        if (coins >= BONUS.triggerCount) withBonus++;
      }
      return { withBonus, coinTotal };
    });
    const triggerRate = withBonus / N;
    const coinFreq = coinTotal / (N * GRID.reels * GRID.rows);
    expect(coinFreq).toBeGreaterThan(0.22); // ~25% of cells are coins
    expect(coinFreq).toBeLessThan(0.28);
    expect(triggerRate).toBeGreaterThan(0.005); // ~1 in 100, never forced/never zero
    expect(triggerRate).toBeLessThan(0.02);
  });
});
