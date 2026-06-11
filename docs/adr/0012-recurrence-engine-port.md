# 0012. Recurrence engine port (REMOVED)

- **Status:** Removed (2026-06-11, PR #20 privacy scrub)
- **Date:** 2026-06-05 (original) / 2026-06-11 (removal)

## Tombstone

This ADR originally recorded porting a domain-agnostic recurrence engine
into this repo (`src/recurrence.js` + data + tests + demo script, pure ES
module, no Pixi, with the "librarian, not interpreter" firewall).

PR #20 ("chore: harden demo verification and privacy") **deleted the engine
and this ADR's original text** as part of a privacy scrub — the port carried
sample data from another project's domain, and this repo is now purely the
slot demo. This tombstone exists because the ADR chain is append-only
history ("supersede, don't rewrite" — `docs/adr/README.md`): the number
stays, the decision's existence stays on record, and the content stays
removed on purpose. Deliberately no further detail here.

## Consequences

- The engine, its data, tests (`test/recurrence.test.js`), and
  `npm run demo:recurrence` no longer exist in this repo.
- Historical references to ADR-0012 in `docs/LEARNINGS.md` (an append-only
  log) remain valid as history and point here.
