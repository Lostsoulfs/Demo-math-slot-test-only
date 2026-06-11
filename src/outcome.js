// =====================================================================
// outcome.js — generates the predetermined spin result (GRID.reels × GRID.rows).
//
// Pure RNG, like a typical online slot: every cell is drawn
// independently from the virtual reel strip (SYMBOL_WEIGHTS, coin
// included). There are NO nudges — no forced wins, no forced bonuses,
// no coin-stripping. The grid the player sees is exactly what the math
// model in `slotmath.js` simulates, so the experienced RTP equals the
// self-computed RTP (see docs/PAR-SHEET.md). Wins are then read off the grid
// by `wins.js`; 6+ coins trigger the Hold & Win bonus.
// =====================================================================

import { SYMBOLS, SYMBOL_WEIGHTS, GRID } from './config.js';

const ALL_IDS = SYMBOLS.map((s) => s.id);

// One weighted pick from the full strip (coin included), via Math.random.
function pickSymbol() {
  let total = 0;
  for (const id of ALL_IDS) total += SYMBOL_WEIGHTS[id] || 1;
  let r = Math.random() * total;
  for (const id of ALL_IDS) {
    r -= SYMBOL_WEIGHTS[id] || 1;
    if (r <= 0) return id;
  }
  return ALL_IDS[ALL_IDS.length - 1];
}

// returns grid[reel][row] — GRID.reels × GRID.rows independent weighted draws.
export function generateOutcome() {
  const grid = [];
  for (let reel = 0; reel < GRID.reels; reel++) {
    grid[reel] = [];
    for (let row = 0; row < GRID.rows; row++) {
      grid[reel][row] = pickSymbol();
    }
  }
  return grid;
}
