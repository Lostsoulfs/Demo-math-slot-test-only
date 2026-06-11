# 0015. Model-driven N×M grid (explicit dimensions, column-major flat index)

- **Status:** Accepted
- **Date:** 2026-06-11

## Context

The roadmap is a reusable slot core where game features plug in (the Hold & Win
extraction in PR #17 was step one). The blocker: the grid shape was baked in as
3×3 across a handful of modules, and the codebase had **two implicit sources of
grid dimensions** — `config.GRID.reels/rows` (renderer) and the `PAYLINES`
array, from which the math layer _inferred_ `reels = paylines[0].length` and
`rows = max(paylines.flat()) + 1`. Two sources can drift; literals like
`grid = [[], [], []]`, unrolled 3-row reel windows, and `reel * 3 + row` index
math can't express any other shape.

Constraint: the shipped default game must stay 3×3 and **byte-identical** — the
seeded 96.082% RTP pin (`test/rtp-target.test.js`) is the gate. Layout polish
for non-3×3 shapes is explicitly a later visuals pass.

## Decision

1. **The model carries explicit dimensions.** `defaultModel()` /
   `buildModel()` include `reels` and `rows`, sourced from `config.GRID`. Math
   consumers (`slotmath.js`, `features/holdAndWin.js`) read
   `model.reels ?? model.paylines[0].length` (same for rows) — the fallback
   keeps hand-built test models working and is provably equal at the default
   shape.
2. **The renderer reads `config.GRID` directly.** Layout stays config-driven;
   no model threading through `main.js` (it remains the orchestrator).
   `generateOutcome()` keeps its zero-arg signature and reads `GRID`.
3. **The flat-index contract is column-major: `idx = reel * rows + row`** —
   matching `monteCarloFullGame`'s `flat.slice(r * rows, …)` grid build. All
   cell↔index conversions (Pixi bonus board, trigger mapping, feature `play()`)
   use this convention. A non-square (5×3) test exists specifically because a
   square grid cannot distinguish `reel*rows+row` from `reel*reels+row`.
4. **Loop bounds derive from dims** everywhere (`GRID.reels/rows` in render and
   debug paths, model dims in pure logic); the reel window generalizes from the
   unrolled top/mid/bottom to `strip[mod(target + ROWS - k)]` for
   `k = 0…ROWS-1`.

## Consequences

- Any N reels × M rows is now **logically** supported: outcome generation,
  payline evaluation, the RTP harness, and the Hold & Win feature all run at
  non-3×3 shapes (pinned by `test/nbym.test.js` at 5×3 and 4×4 — sanity
  assertions, no tuned RTP claims for non-default shapes).
- The default game is unchanged: explicit dims equal the inferred ones at 3×3,
  RNG draw order is untouched, and the seeded RTP pin holds to full precision.
- Config consistency is asserted (`test/config.test.js`): every payline's
  length equals `GRID.reels`, every row index is within `GRID.rows`, and the
  model's dims equal `GRID`'s.
- **Known follow-up (visuals pass):** `GRID.x/y` and frame/banner geometry are
  hand-centered for 3×3; non-3×3 renders off-center until layout auto-derives
  from dims. Deferred on purpose to keep this diff purely logical.
- Sets up PR B (feature-plugin registry): features can now declare their board
  shape needs against a model, not a hardcoded 9-cell world.

## Alternatives considered

- **Keep inferring dims from PAYLINES everywhere** — leaves two sources of
  truth implicit; a config with (say) 4 reels but 3-wide paylines would fail
  silently. Explicit dims + a consistency test make the contract checkable.
- **Thread the model through `main.js`/renderer** — cleaner in the limit, but
  it grows `main.js` toward an engine extraction the operator explicitly
  deferred; renderer-reads-`GRID` is the smaller, reversible step.
- **Row-major flat index** — would have required changing `slotmath.js`'s
  existing column-major grid build, touching the RNG-consumption path the RTP
  pin protects. Column-major matches what's already shipped.
