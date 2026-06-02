# 0009. AGENTS.md as the canonical cross-tool agent contract

- **Status:** Accepted
- **Date:** 2026-06-02

## Context

We had agent guidance only in `CLAUDE.md` (Claude Code-specific). `AGENTS.md` is
now the widely-adopted, tool-agnostic standard (read by Codex, Copilot, Cursor,
and others). We want one source of truth that any agent can use, without
duplicating content across files that would drift apart.

## Decision

Make **`AGENTS.md`** the canonical contract (commands, project structure, code
style, boundaries/"never touch", git workflow, the Working Agreement).
**`CLAUDE.md`** stays short and Claude-specific (it points to AGENTS.md, then
adds the subagent directive, drift-audit flow, and environment notes).

## Consequences

- Portable across agent tools; one place to update shared rules.
- Lean, path-scoped instruction files (best practice: keep the main file small).
- Cost: two files to keep coherent — mitigated by making CLAUDE.md reference,
  not duplicate, AGENTS.md.

## Alternatives considered

- **CLAUDE.md only** — non-portable; other tools ignore it.
- **Symlink CLAUDE.md → AGENTS.md** — loses the Claude-specific section.
