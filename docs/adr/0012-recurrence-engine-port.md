# 0012. Host a ported recurrence-detection engine alongside the slot game

- **Status:** Accepted
- **Date:** 2026-06-05

## Context

A sibling project, `Health-Prototype`, is a pure-Python, zero-dependency
**recurrence-detection engine**: given dated records it surfaces, counts, and
cites recurring patterns through five rules (recurrence, gap, frequency,
co-occurrence, cadence change) routed into one per-record report. Its governing
constraint is a "librarian, not interpreter" firewall — surface and cite
provenance, never score, rank, or diagnose.

The request was to "copy the flow of healthcare into replit-code." That repo
has no UI flow to copy; its "flow" is this data pipeline. We chose to port the
**engine logic** (not a UI), and `AGENTS.md` already mandates that pure,
Pixi-free logic live in unit-testable modules — a natural home for it.

## Decision

Port the engine faithfully to `src/recurrence.js` (pure ES module, zero Pixi
imports), with the sample records + hand-written answer keys in
`src/recurrenceData.js`, Vitest coverage in `test/recurrence.test.js`, and a
`node scripts/recurrence-demo.mjs` (`npm run demo:recurrence`) mirroring the
Python `--report`. The engine is domain-agnostic and stays decoupled from the
slot game — no game/UI wiring. The "librarian, not interpreter" firewall is
carried into the JS header and asserted in a test.

## Consequences

- The repo now hosts a second, self-contained library next to the game. It is
  fully tested and lint/format-clean; the JS report output matches the Python
  `--report` / `--report-v1` line-for-line (verified by diff).
- Easier later: surfacing the engine in the app (e.g. a debug hook) is additive.
- Trade-off: a faithful port of Python's `difflib.SequenceMatcher.ratio()`
  (Ratcliff/Obershelp) and `round()` (banker's rounding) was required so the
  opt-in fuzzy layer and the cadence rule reproduce the oracle exactly.

## Alternatives considered

- **Build a health-records UI in the slot game** — rejected; the user chose
  "port the engine logic," and mixing a records UI into a slot demo adds scope
  and domain coupling for no benefit.
- **Import the Python module at runtime** — rejected; this is a JS/Vite repo
  with no Python runtime, and a native JS port stays unit-testable in Vitest.
