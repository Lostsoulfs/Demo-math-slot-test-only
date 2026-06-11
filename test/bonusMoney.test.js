import { describe, it, expect } from 'vitest';
import { play } from '../src/features/holdAndWin.js';
import { defaultModel, mulberry32 } from '../src/slotmath.js';
import { JACKPOTS } from '../src/config.js';

// =====================================================================
// Pins the MONEY ARITHMETIC the bonus renderer performs (a committed
// version of the throwaway check from PR #17). BonusGame.run() replays
// play()'s event stream and credits sum(coin.amount × bet), plus
// GRAND.mult × bet on a full board — so reconstructing the total from
// the events the renderer consumes must equal play()'s ledger total × bet,
// for every seed. If this drifts, the screen would show a different
// amount than the math model paid. (The animation itself is exercised
// by the CI smoke job; this pins the numbers headlessly.)
// =====================================================================

describe('renderer money arithmetic ≡ feature ledger', () => {
  it('event-stream reconstruction × bet equals play().total × bet (2000 seeded rounds)', () => {
    const model = defaultModel();
    const bets = [1, 2, 5, 10];
    for (let seed = 1; seed <= 2000; seed++) {
      const { total, filledAll, events } = play([0, 1, 2, 3, 4, 5], model, mulberry32(seed));
      // exactly what BonusGame.run() credits while replaying the events
      let replayed = 0;
      for (const ev of events) {
        const landed = ev.type === 'place' ? ev.cells : ev.landed;
        for (const { coin } of landed) replayed += coin.amount;
      }
      if (filledAll) replayed += model.bonus.jackpots.GRAND;
      expect(replayed).toBeCloseTo(total, 10);
      for (const bet of bets) {
        expect(replayed * bet).toBeCloseTo(total * bet, 10);
      }
    }
  });

  it('model GRAND multiplier matches the live config the renderer reads', () => {
    // BonusGame adds JACKPOTS.GRAND.mult * bet; play() adds
    // model.bonus.jackpots.GRAND — these must be the same number.
    expect(defaultModel().bonus.jackpots.GRAND).toBe(JACKPOTS.GRAND.mult);
  });
});
