<!-- This template structures the PR body so the drift auditor can reconcile
     "claims" against the diff. Fill every section. -->

## What & why

<!-- What does this PR change, and why? Link the issue/ADR if any. -->

## Changes

<!-- Bullet the notable changes, by area/file. Mention anything sensitive
     (config, CI, deps, .claude/). -->

-

## Testing

<!-- How was this verified? -->

- [ ] `npm test` passes
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] Smoke test (`node verify.mjs`) — if behavior/render changed

## Records

- [ ] Added/updated an **ADR** in `docs/adr/` (if an architectural decision)
- [ ] Updated **`docs/LEARNINGS.md`** (if I hit a gotcha/workaround)
- [ ] Updated **`docs/SPEC.md`** (if behavior changed)

## Notes for reviewers / auditor

<!-- Anything the drift audit should know (intentional sensitive changes, etc.) -->
