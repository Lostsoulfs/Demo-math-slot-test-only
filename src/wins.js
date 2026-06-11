// =====================================================================
// wins.js — pure payline evaluation over the N×M grid.
// grid[reel][row], row 0=top … rows-1=bottom. Dimensions come from the
// grid itself and PAYLINES; nothing here assumes a fixed shape.
// =====================================================================

import { PAYLINES, PAYTABLE } from './config.js';

export function evaluate(grid, bet) {
  const lines = [];
  let total = 0;

  PAYLINES.forEach((line, lineIndex) => {
    // line = [rowReel0, rowReel1, …] — one row index per reel
    const ids = line.map((row, reel) => grid[reel][row]);
    const first = ids[0];
    if (first === 'coin') return; // coins don't pay lines, they trigger bonus
    if (ids.every((id) => id === first) && PAYTABLE[first]) {
      const payout = PAYTABLE[first] * bet;
      total += payout;
      lines.push({
        lineIndex,
        symbol: first,
        payout,
        cells: line.map((row, reel) => ({ reel, row })),
      });
    }
  });

  // count coins on the whole board (for Hold & Win trigger)
  const coinCells = [];
  for (let reel = 0; reel < grid.length; reel++) {
    for (let row = 0; row < grid[reel].length; row++) {
      if (grid[reel][row] === 'coin') coinCells.push({ reel, row });
    }
  }

  return { total, lines, coinCells, coinCount: coinCells.length };
}
