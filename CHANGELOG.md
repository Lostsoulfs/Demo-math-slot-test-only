# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project is a demo and is not formally versioned — released sections are
dated by merge date instead.

## [Unreleased]

_Nothing yet._

## 2026-06-02

### Added

- **The slot** — "Coins: Hold & Win", a classic-style 3×3 PixiJS v8 (WebGL) slot:
  procedural glossy symbols, deterministic motion-blurred reels, 5 paylines,
  line-win celebrations (glow / particles / shake / rolling count-up), the Hold &
  Win bonus (locking coins, respins, MINI→GRAND jackpots), auto-spin/attract, and
  procedural WebAudio SFX. (PR #1)
- **Self-serve testing** — in-app debug panel (`?debug=1`/backtick: force
  WIN/BIG/MEGA/EPIC/BONUS, live sliders, theme switcher, FPS meter); GitHub Pages
  deploy with downloadable-artifact fallback. (PR #1)
- **Verification** — Vitest unit/golden tests (wins, outcome, config, utils) and a
  Playwright behavioral smoke test (`verify.mjs`) that asserts wins pay and the
  bonus awards, not just "no console errors". (PR #1)
- **Agent harness** — `AGENTS.md` (canonical contract) + `CLAUDE.md`; subagents
  (auditor/explorer/planner) and commands (`/audit`, `/verify`, `/ship`, `/adr`);
  hooks for session setup, format-on-edit, sensitive-file guard, and a local
  hook-event log. (PR #1)
- **Docs** — ADRs (`docs/adr/`), `docs/SPEC.md`, `docs/LEARNINGS.md`,
  `docs/DRIFT-AUDIT.md`, and `docs/AGENT-SCAFFOLDING.md` (incl. the upgrade-ROI
  policy and the professional logging/observability flow). (PR #1)
- **CI & governance** — drift-audit workflow (no API key), lint+test+build gate,
  PR template, CONTRIBUTING, LICENSE (MIT), CODEOWNERS, SECURITY, Dependabot.
  (PR #1)
- **Drift-audit code-bloat / complexity gate** (`scripts/audit-drift.mjs`):
  flags deep nesting (src lines indented past ~8 levels) and large net `src/`
  growth without tests, and always prints the `src/` net line delta. A
  deterministic proxy for the cyclomatic/cognitive-complexity gate (full AST
  version lives in testing-kits `core/complexity`), motivated by the Sonar
  finding that AI code bloats/over-nests even when it passes tests. (PR #2)

### Changed

- **Retuned the shipped game to a genuine ~96% TOTAL RTP** (base lines + Hold &
  Win), a typical online-slot RTP computed by simulation (ADR-0011). The
  feature is now the RTP engine: coins land ~25%/cell so 6+ trigger naturally
  ~1 in 100 spins; base game ~45.7%, feature ~50.3%, **total ~96.0%** (5 seeds ×
  20M: mean 96.008%; deterministic 12M pin 96.08%). GRAND 1000×→500×, leaner
  feature economy, rarer full-board fill. (PR #2)
- **Removed the demo "nudges."** `outcome.js` is now pure RNG — every cell is a
  weighted draw paid strictly by the paytable, so the experienced RTP equals the
  self-computed RTP. Feature odds (`BONUS.jackpotOdds`, `BONUS.respinLandChance`) are
  centralized in `config.js` and shared by the live feature and the math model.
  (PR #2)
- Replaced the opt-in `RTP96_WEIGHTS` preset with a single `RTP_TARGET = 0.96`;
  `test/rtp-target.test.js` now verifies the shipped game's TOTAL by simulation
  (12M-spin Monte-Carlo) and `monteCarloFullGame()` reports a `maxWin`. (PR #2)
- **Vite 6 → 8 major bump** (`vite` 6.4.2 → 8.0.16, with `playwright`
  1.56.1 → 1.60.0) via Dependabot, commit `44bfd28`. No config changes were
  needed; dev server, build, and preview verified working.

### Security

- Bumped `vitest` to 4.1.8 to clear the critical UI-server advisory
  (GHSA-5xrq-8626-4rwp); the affected `--ui` server is not used.
