# CLAUDE.md — Project & Working Agreement

This file is auto-loaded into context for this repo.

> **Subagent directive (mandatory):** Whenever the Agent tool is used for this
> repo, the agent's prompt MUST tell it to **read `CLAUDE.md` and
> `docs/LEARNINGS.md` first, follow the Working Agreement below, and append
> anything it learns to `docs/LEARNINGS.md`.** Keeping agent prompts short is
> fine — but they must be able to learn and document.

## Working Agreement (applies to me AND every subagent/agent)

1. **Never declare something impossible.** When a task fails, web-search the
   latest updates, root causes, and workarounds _before_ reporting back.
   Exhaust real options first; report a dead end only after you've actually
   looked.
2. **Document findings.** When you discover something useful — a fix, a gotcha,
   an API change, a workaround — append it to `docs/LEARNINGS.md` with the date
   and enough context to be useful later.
3. **Stuck-bug protocol.** If a bug isn't a fast fix, **or the same thing errors
   twice**, stop guessing: look up known edge cases / similar issues (GitHub
   issues, changelogs, official docs) for the library or tool involved, then
   apply what you find. This applies especially to test harnesses and batches
   of code.
4. **No shortcuts, ever.** Never cheat, skip, gut, or cut scope to save time.
   Spend the extra time to plan properly and do it fully. Verify before
   claiming something is done.

## Project

**"Coins: Hold & Win"** — a Playson-style 3×3 slot, **PixiJS v8 (WebGL) + Vite**.
Pure entertainment demo (play money only, no real wagering).

- Install: `npm install`
- Dev: `npm run dev` · Build: `npm run build` · Preview: `npm run preview`
- Lint / format: `npm run lint` · `npm run format`
- Smoke test: `npm run preview &` then `node verify.mjs`
  (needs Chromium: `npx playwright install chromium`)
- All tunables live in `src/config.js`.
- In-app debug panel: append `?debug=1` to the URL or press the backtick key
  (force WIN/BIG/MEGA/EPIC/BONUS, live sliders, theme switcher, FPS meter).

## PR drift audit

Every PR is audited for **drift** — divergence between what was logged (commits,
PR body, `docs/LEARNINGS.md` — the externalized "world state") and what the diff
actually did. Two free auditors (full design in `docs/DRIFT-AUDIT.md`):

- **CI** (`.github/workflows/audit.yml`): runs `scripts/audit-drift.mjs` on
  every PR, posts a report comment, applies safe auto-fixes (prettier /
  eslint --fix). No API key — uses the built-in `GITHUB_TOKEN`.
- **In-session:** when watching a PR, spawn an **auditor subagent** that runs
  `node scripts/audit-drift.mjs --run-checks`, additionally reconciles claims
  vs the code's _meaning_ (and subagent transcripts), posts/updates the report,
  applies only the safe auto-fixes, and appends the outcome to
  `docs/LEARNINGS.md`. Report-only for anything logic-affecting.

## Environment notes

- Runs in an ephemeral remote container — commit & push to persist (a Stop hook
  enforces a clean, pushed tree at end of every turn).
- A SessionStart hook (`.claude/hooks/session-start.sh`) installs deps + the
  Playwright browser on web sessions so build/lint/test work out of the box.
  Activation requires `.claude/settings.json` (see that file / the PR).
