# 0014. Factual-wording policy — no certification/audit/compliance/fairness claims

- **Status:** Accepted
- **Date:** 2026-06-11

## Context

This repo is an educational portfolio demo, **play-money only, no real
wagering**. It cannot be certified, audited, approved, or reviewed by any
regulator or testing laboratory — there is no lab and no regulator involved.
Earlier wording across the code comments, docs, ADRs, tests, and README framed
the slot math the way a testing lab documents a real-money slot: it used words
like "certified", "the way a lab certifies", "fair", "regulated", "compliant",
and name-dropped standards bodies and test suites (GLI/GLI-19, eCOGRA, iTech,
NIST SP 800-22, Diehard). That language **claims or implies certification,
auditing, approval, compliance, fairness, or regulatory status** the project
does not have, which is inaccurate and could mislead.

## Decision

Adopt a **factual-wording policy** for all prose (comments, doc text, test
`describe`/`it` descriptions, string literals, README, CHANGELOG):

1. **No claims of certification, auditing, approval, compliance, fairness, or
   regulatory status** anywhere. Replace such words with what the code actually
   does: "computed", "measured", "modeled", "verified by simulation",
   "recompute".
2. **Drop the lab/regulator framing.** Describe the mechanism instead (e.g.
   "computes the RTP by enumeration + simulation", not "the way a lab
   certifies"). Avoid "fair/fairness" — say the RNG "passes
   uniformity/independence tests".
3. **No standards-body or test-suite name-drops** (GLI, GLI-19, eCOGRA, iTech,
   NIST SP 800-22, Diehard). Describe each test by what it does; the generic
   statistic names (chi-square, Kolmogorov–Smirnov, runs, serial-correlation)
   stay as plain descriptions.
4. **Frame the RTP correctly everywhere:** the RTP is **self-computed by this
   project's own simulation, shown for transparency** — never "certified",
   "verified by a lab", or "guaranteed".

The demo framing lives in three always-present places:

- **`DISCLAIMER.md`** at the repo root (play-money only, not certified or
  audited, not affiliated, purpose).
- **`README.md`** — a short disclaimer blockquote near the top linking to
  `DISCLAIMER.md`.
- **An in-app banner** in `index.html` (plain HTML), always visible:
  "Demo · play-money only · no real money, no prizes · not certified or audited".

This is a **wording-only** change: no code logic, test assertions, numbers,
function names, or behavior changed. The test suite and the RTP regression pin
stay byte-identically green.

## Consequences

- The repo no longer claims or implies any status it does not have; the language
  matches reality (a self-computed transparency demo).
- A new contributor (human or agent) has an explicit policy to follow and a grep
  to enforce it (`certif|complian|fairness|regulat|GLI|eCOGRA|iTech|NIST|diehard`
  should return nothing outside append-only history).
- Historical entries in `docs/LEARNINGS.md` are append-only and were left as-is;
  a dated entry records this policy instead.
- The underlying decisions in ADR-0010/0011/0013 are unchanged — only the
  inaccurate claim-words in them were reworded in place.

## Alternatives considered

- **Leave the lab/cert framing as "aspirational"** — rejected: it reads as a
  claim, and the owner cannot certify anything, so it is simply inaccurate.
- **Remove the RTP figures entirely** — rejected: the math is the point of the
  demo. Keeping the numbers but framing them as self-computed for transparency
  is both honest and useful.
