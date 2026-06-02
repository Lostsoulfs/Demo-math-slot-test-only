import { describe, it, expect } from 'vitest';
import { evaluate } from '../src/wins.js';
import { PAYTABLE } from '../src/config.js';

// A 3x3 grid (grid[reel][row]) crafted so NO payline matches.
const noWin = () => [
  ['cherry', 'lemon', 'plum'],
  ['bell', 'bar', 'seven'],
  ['watermelon', 'plum', 'lemon'],
];

// set the middle payline (row 1 of each reel) to a symbol
function withMiddleLine(sym) {
  const g = noWin();
  g[0][1] = g[1][1] = g[2][1] = sym;
  return g;
}

describe('evaluate', () => {
  it('pays a 3-of-a-kind line at paytable × bet', () => {
    const res = evaluate(withMiddleLine('seven'), 5);
    expect(res.total).toBe(PAYTABLE.seven * 5);
    expect(res.lines).toHaveLength(1);
    expect(res.lines[0].symbol).toBe('seven');
    expect(res.lines[0].cells).toHaveLength(3);
  });

  it('scales payout with bet', () => {
    expect(evaluate(withMiddleLine('bell'), 1).total).toBe(PAYTABLE.bell);
    expect(evaluate(withMiddleLine('bell'), 10).total).toBe(PAYTABLE.bell * 10);
  });

  it('returns zero on a no-win board', () => {
    const res = evaluate(noWin(), 5);
    expect(res.total).toBe(0);
    expect(res.lines).toHaveLength(0);
  });

  it('coins do not pay line wins but are counted', () => {
    const g = noWin();
    g[0][1] = g[1][1] = g[2][1] = 'coin'; // a full line of coins
    const res = evaluate(g, 5);
    expect(res.total).toBe(0); // coins never pay a line
    expect(res.coinCount).toBe(3);
    expect(res.coinCells).toHaveLength(3);
  });

  it('counts coins across the whole board', () => {
    const g = noWin();
    g[0][0] = g[2][2] = 'coin';
    const res = evaluate(g, 5);
    expect(res.coinCount).toBe(2);
  });

  it('every paytable symbol is a valid winning symbol', () => {
    for (const sym of Object.keys(PAYTABLE)) {
      const res = evaluate(withMiddleLine(sym), 2);
      expect(res.total).toBe(PAYTABLE[sym] * 2);
    }
  });
});
