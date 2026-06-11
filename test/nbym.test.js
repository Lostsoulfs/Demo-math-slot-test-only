import { describe, it, expect } from 'vitest';
import {
  buildModel,
  defaultModel,
  mulberry32,
  theoreticalRtp,
  monteCarloFullGame,
  symbolProbabilities,
  DEFAULT_BONUS_ODDS,
} from '../src/slotmath.js';
import { play } from '../src/features/holdAndWin.js';
import { evaluate } from '../src/wins.js';
import { PAYTABLE, GRID } from '../src/config.js';

// =====================================================================
// N×M capability tests (ADR-0015). The DEFAULT game stays 3×3 and is
// pinned elsewhere (rtp-target.test.js); these tests prove the LOGIC
// runs end-to-end at other shapes. The shapes are untuned, so no RTP
// balance is asserted — only that the machinery produces finite, sane,
// structurally correct results. 5×3 is deliberately non-square: it is
// the shape that catches column-major (reel*rows+row) vs row-major
// flat-index scrambling, which a square grid hides.
// =====================================================================

// Straight paylines for an N×M shape: middle, top, bottom.
function straightLines(reels, rows) {
  const mid = Math.floor(rows / 2);
  return [Array(reels).fill(mid), Array(reels).fill(0), Array(reels).fill(rows - 1)];
}

function shapeModel(reels, rows, bonusOverrides = {}) {
  return buildModel({
    reels,
    rows,
    paylines: straightLines(reels, rows),
    bonus: { ...defaultModel().bonus, ...bonusOverrides },
  });
}

const SHAPES = [
  [5, 3],
  [4, 4],
];

describe.each(SHAPES)('N×M capability at %i×%i', (reels, rows) => {
  const cellCount = reels * rows;

  it('theoreticalRtp enumerates N-wide lines (exact jackpot odds check)', () => {
    const model = shapeModel(reels, rows);
    const t = theoreticalRtp(model);
    expect(Number.isFinite(t.perLineRtp)).toBe(true);
    expect(t.perLineRtp).toBeGreaterThan(0);
    expect(t.nLines).toBe(3);
    // exact cross-check: P(jackpot line) = P(seven)^reels at this width
    const { p } = symbolProbabilities(model.weights);
    expect(t.jackpotProb).toBeCloseTo(p.seven ** reels, 12);
  });

  it('monteCarloFullGame runs end-to-end and returns finite, sane figures', () => {
    const fg = monteCarloFullGame(shapeModel(reels, rows), { seed: 7, spins: 100_000 });
    // Untuned shape: NO balance claim (a 15/16-cell board triggers the bonus
    // far more often than 3×3, so rtp may exceed 1) — only finite sanity.
    for (const k of ['rtp', 'lineRtp', 'bonusRtp', 'sd', 'maxWin']) {
      expect(Number.isFinite(fg[k]), k).toBe(true);
    }
    expect(fg.rtp).toBeGreaterThan(0);
    expect(fg.lineRtp).toBeGreaterThan(0);
    expect(fg.bonusRtp).toBeGreaterThanOrEqual(0);
    expect(fg.bonusTriggerRate).toBeGreaterThanOrEqual(0);
    expect(fg.bonusTriggerRate).toBeLessThanOrEqual(1);
  });

  it('play() with respinLandChance=1 fills the whole N×M board and awards GRAND', () => {
    const model = shapeModel(reels, rows, {
      odds: { ...DEFAULT_BONUS_ODDS, respinLandChance: 1 },
    });
    const res = play([0, 1, 2], model, mulberry32(11));
    expect(res.filledAll).toBe(true);
    expect(res.coinsCollected).toBe(cellCount);
    expect(res.total).toBeGreaterThanOrEqual(model.bonus.jackpots.GRAND);
    // structural check: every flat index 0..cellCount-1 landed exactly once
    const seen = new Set();
    for (const ev of res.events) {
      const landed = ev.type === 'place' ? ev.cells : ev.landed;
      for (const { idx } of landed) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(cellCount);
        expect(seen.has(idx), `index ${idx} landed twice`).toBe(false);
        seen.add(idx);
      }
    }
    expect(seen.size).toBe(cellCount);
  });

  it('play() with respinLandChance≈0 keeps only the trigger coins and counts down', () => {
    const model = shapeModel(reels, rows, {
      odds: { ...DEFAULT_BONUS_ODDS, respinLandChance: 1e-12 },
    });
    // include the LAST cell (column-major: reel rows-1 … = cellCount-1) so an
    // index-mapping bug that shrinks/scrambles the board would surface here
    const triggers = [0, Math.floor(cellCount / 2), cellCount - 1];
    const res = play(triggers, model, mulberry32(5));
    expect(res.filledAll).toBe(false);
    expect(res.coinsCollected).toBe(triggers.length);
    // 'place' + one event per respin counting 3,2,1,0 with nothing landing
    expect(res.events[0].type).toBe('place');
    expect(res.events).toHaveLength(1 + model.bonus.respins);
    expect(res.events[res.events.length - 1].respinsLeft).toBe(0);
  });
});

describe('evaluate() is grid-shape agnostic', () => {
  it('counts coins across ALL cells of a wider 5×3 grid (beyond the 3×3 window)', () => {
    // evaluate() reads the LIVE config paylines (3-wide); its grid loops are
    // shape-agnostic. Put coins only in reels 3-4 — cells a 3×3 assumption
    // would never visit — plus a line win on the first 3 reels.
    const g = [
      ['bell', 'cherry', 'lemon'],
      ['plum', 'cherry', 'bar'],
      ['lemon', 'cherry', 'plum'], // middle line: 3× cherry
      ['coin', 'coin', 'coin'],
      ['coin', 'coin', 'coin'],
    ];
    const res = evaluate(g, 2);
    expect(res.total).toBe(PAYTABLE.cherry * 2);
    expect(res.coinCount).toBe(6);
    for (const { reel } of res.coinCells) expect(reel).toBeGreaterThanOrEqual(3);
  });
});

describe('default model dims (byte-identity invariant)', () => {
  it('explicit reels/rows equal both GRID and the payline-inferred values', () => {
    const m = defaultModel();
    expect(m.reels).toBe(GRID.reels);
    expect(m.rows).toBe(GRID.rows);
    // the ?? fallback must resolve to the same numbers either way
    expect(m.reels).toBe(m.paylines[0].length);
    expect(m.rows).toBe(Math.max(...m.paylines.flat()) + 1);
  });
});
