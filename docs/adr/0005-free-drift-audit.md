# 0005. Free PR drift audit (no API key)

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

We wanted to audit every PR for "drift" — divergence between what was logged
(commits, PR body, `docs/LEARNINGS.md`) and what the diff actually did. A paid
LLM-in-CI (Anthropic API) was an option, but the user has no API budget.

## Decision

Split the auditor: a **deterministic** Node script (`scripts/audit-drift.mjs`,
no deps, no key) runs in CI and posts via the built-in `GITHUB_TOKEN`, applying
only safe auto-fixes (prettier / eslint --fix). **Semantic** claim-vs-code
review is done by an **in-session auditor** (runs on the Claude session, free).
See `docs/DRIFT-AUDIT.md`.

## Consequences

- Zero cost; always-on mechanical coverage + on-demand semantic depth.
- `GITHUB_TOKEN` pushes don't retrigger workflows → no audit loop. Job gated to
  same-repo PRs (fork tokens are read-only).
- Cost: CI can't do semantic judgement alone; needs a live session for that.

## Alternatives considered

- **Paid Claude-in-CI** (`claude-code-action`) — best semantics, but costs money.
- **GitHub Models free tier** — viable future semantic upgrade, deferred.
