import { describe, it, expect } from 'vitest';
import {
  SYMBOLS,
  SYMBOL_WEIGHTS,
  PAYLINES,
  PAYTABLE,
  JACKPOTS,
  JACKPOT_ORDER,
  ECONOMY,
  BONUS,
  GRID,
} from '../src/config.js';

const IDS = SYMBOLS.map((s) => s.id);

describe('config invariants', () => {
  it('every symbol has a positive reel weight', () => {
    for (const id of IDS) {
      expect(SYMBOL_WEIGHTS[id], `weight for ${id}`).toBeGreaterThan(0);
    }
  });

  it('paylines reference valid rows within the grid', () => {
    for (const line of PAYLINES) {
      expect(line).toHaveLength(GRID.reels);
      for (const row of line) {
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(GRID.rows);
      }
    }
  });

  it('paytable only references real, non-coin symbols', () => {
    for (const sym of Object.keys(PAYTABLE)) {
      expect(IDS).toContain(sym);
      expect(sym).not.toBe('coin');
      expect(PAYTABLE[sym]).toBeGreaterThan(0);
    }
  });

  it('jackpots are ordered MINI < MINOR < MAJOR < GRAND', () => {
    expect(JACKPOT_ORDER).toEqual(Object.keys(JACKPOTS));
    const mults = JACKPOT_ORDER.map((k) => JACKPOTS[k].mult);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThan(mults[i - 1]);
    }
  });

  it('economy bet levels are positive and the default index is valid', () => {
    expect(ECONOMY.betLevels.every((b) => b > 0)).toBe(true);
    expect(ECONOMY.defaultBetIndex).toBeGreaterThanOrEqual(0);
    expect(ECONOMY.defaultBetIndex).toBeLessThan(ECONOMY.betLevels.length);
  });

  it('bonus coin values and weights line up', () => {
    expect(BONUS.coinValues.length).toBe(BONUS.coinValueWeights.length);
    expect(BONUS.triggerCount).toBeGreaterThan(0);
    expect(BONUS.triggerCount).toBeLessThanOrEqual(GRID.reels * GRID.rows);
  });
});
