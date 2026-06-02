# 0006. SessionStart hook + permission allowlist

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

The container is ephemeral — a fresh web session has no deps and no Playwright
browser, so build/lint/test would fail until manually set up. We also wanted
routine commands to stop prompting so auto mode flows.

## Decision

A **SessionStart hook** (`.claude/hooks/session-start.sh`) runs `npm install` +
`npx playwright install chromium` on web sessions (gated by `$CLAUDE_CODE_REMOTE`).
`.claude/settings.json` registers it and adds a **permission allowlist** for
build/test/git commands.

## Consequences

- Every web session boots ready to build/lint/test; auto mode isn't interrupted.
- Synchronous = deps guaranteed before the agent runs (no race), at the cost of
  slightly slower session start (can switch to async if desired).
- Registering hooks/permissions is self-modification — the harness requires
  explicit user authorization to write `.claude/settings.json` (see LEARNINGS).

## Alternatives considered

- **Async hook** — faster start, but risks the agent acting before deps exist.
- **No hook / manual setup** — every session re-does setup by hand.
