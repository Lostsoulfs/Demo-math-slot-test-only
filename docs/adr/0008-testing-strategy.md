# 0008. Vitest for the deterministic core; smoke test for E2E

- **Status:** Accepted
- **Date:** 2026-06-02

## Context

The repo had no unit tests. The pure game logic (`wins.js`, `outcome.js`,
`config.js` invariants, `utils.js`) is deterministic and trivially testable, and
is exactly what we need confidence in when an agent edits the math. The rendering
modules (`reels.js`, `main.js`, …) import PixiJS and need WebGL/DOM, which is
impractical to unit-test in Node.

## Decision

Use **Vitest** for fast unit tests on the **pure, Pixi-free modules** (node
environment). Keep the existing **Playwright smoke test** (`verify.mjs`) as the
end-to-end check for the rendered app (spin → win → bonus, 0 console errors).
A CI job (`.github/workflows/ci.yml`) gates PRs on lint + test + build.

## Consequences

- Regressions in the money math / RNG guards are caught instantly and cheaply.
- Clear split: deterministic logic → Vitest; rendered behavior → smoke test.
- Cost: reel/render code isn't unit-covered (by design) — the smoke test and
  manual debug panel cover it. The drift auditor watches for skipped tests.

## Alternatives considered

- **No tests** — status quo; agents can silently break the math.
- **jsdom/WebGL mocks for Pixi** — high effort, brittle, low value here.
