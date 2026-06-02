# CLAUDE.md

Auto-loaded for Claude Code. **Read [`AGENTS.md`](AGENTS.md) first — it is the
canonical contract** (commands, structure, code style, boundaries, git workflow,
and the Working Agreement). This file adds only the Claude-specific bits.

## Subagent directive (mandatory)

Whenever the Agent tool is used for this repo, the agent's prompt MUST tell it to
**read `AGENTS.md` and `docs/LEARNINGS.md` first, follow the Working Agreement,
and append anything it learns to `docs/LEARNINGS.md`.** Prefer the predefined
roles in `.claude/agents/` (auditor, explorer, planner). Keeping prompts short is
fine — but agents must be able to learn and document.

## PR drift audit

Every PR is audited for **drift** — divergence between what was logged (commits,
PR body, `docs/LEARNINGS.md` — the externalized "world state") and what the diff
actually did. Two free auditors (full design in `docs/DRIFT-AUDIT.md`):

- **CI** (`.github/workflows/audit.yml`): runs `scripts/audit-drift.mjs` on every
  PR, posts a report comment, applies safe auto-fixes. No API key — uses the
  built-in `GITHUB_TOKEN`.
- **In-session:** when watching a PR, spawn the **auditor subagent**
  (`.claude/agents/auditor.md`); it runs `node scripts/audit-drift.mjs
--run-checks`, reconciles claims vs the code's _meaning_, posts the report,
  applies only safe auto-fixes, and appends the outcome to `docs/LEARNINGS.md`.

## Environment notes

- Ephemeral remote container — commit & push to persist (a Stop hook enforces a
  clean, pushed tree at the end of every turn).
- A SessionStart hook (`.claude/hooks/session-start.sh`) installs deps + the
  Playwright browser on web sessions. Registered in `.claude/settings.json`,
  which also allowlists routine build/test/git commands so auto mode flows.
- In-app debug panel: append `?debug=1` or press the backtick key (force
  WIN/BIG/MEGA/EPIC/BONUS, live sliders, theme switcher, FPS meter).
