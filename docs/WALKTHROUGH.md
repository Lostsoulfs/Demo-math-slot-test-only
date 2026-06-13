# Demo-Math (Slot Math Proof) — Walk-Through

_A play-money slot machine demo whose real job is to prove its own payout math is correct and honestly described. · 2026-06-13_

## Bottom line

This is a public, front-facing portfolio project ("Coins: Hold & Win") that looks like a flashy slot machine but exists to **prove the math behind it is honest** — that the advertised ~96% return-to-player figure is what the code actually pays, and that the random-number generator behaves randomly. The proof is a battery of in-repo tests (RTP computation, RNG statistics, metamorphic invariants, mutation tests), not an outside audit. There is **no real money, no wagering, and no prizes** — credits are fake and reset on reload.

## In plain terms (if you read nothing else)

This is a **demonstration**, not a casino. You can play a slot machine in your browser, but the "credits" are worth nothing — you can't buy them, win them, cash them out, or trade them, and they reset every time you reload the page. The whole point isn't to gamble; it's to **show, with working code, that the machine's math is exactly what it claims to be.**

Two terms matter. **RTP (return-to-player)** is the headline honesty number for any slot: of every $100 wagered over millions of spins, how much comes back to players on average. This demo targets about 96% — meaning in a real-money version about $96 of every $100 would return over the long run, and about $4 would be the house's edge. **RNG (random-number generator)** is the dice-roller inside: the thing that decides each spin. If the RNG isn't truly random, the RTP claim is meaningless.

So the project does two things and tests both. First, it **computes** its own RTP — partly by exact math (counting every possible winning line) and partly by simulating millions of spins — and locks that number into automated tests so it can't quietly drift. Second, it runs the RNG through standard statistics tests to check it's genuinely uniform and unpredictable. On top of that, it deliberately injects bugs into its own payout code to confirm the tests actually _catch_ a broken payout (a "mutation" test), and checks "if I change something that shouldn't matter, does the math stay the same?" (a "metamorphic" test).

One thing it is careful **not** to do: overclaim. The project's own rules forbid the words "certified", "audited", "compliant", "fair", or "regulated" anywhere, and forbid name-dropping testing labs or standards bodies. Every public surface — the README, a standalone disclaimer file, and an always-visible banner inside the app — states plainly that the RTP is **self-computed by this project's own simulation, shown for transparency**, and that nothing here is approved by any regulator or lab.

Finally, because slot machines are designed to be psychologically sticky, the project handles that honestly too. It deliberately **removed** the "demo nudges" that earlier forced wins and bonuses to make the game feel livelier, because those made the played game _not_ match the computed math. The one "atmosphere" feature it kept (a subtle dread/unease layer during the bonus) is walled off in code so it can only change visuals and sound — it is structurally forbidden from touching the money.

## Walk-through

### (1) What it is & why it exists (its role)

**Plain:** It's a browser slot machine — "Coins: Hold & Win", a 3×3 reel game with classic fruit symbols and a coin-collecting bonus round. But its reason to exist is to be a transparent, inspectable example of _honest slot math_: prove the return-to-player number and the randomness are real, and describe them without exaggeration. It's the public-facing repo in a family of projects; this one's specialty is the math proof.

**Technical:** Repo: `/home/user/Demo-math-slot-test-only`, package `coins-hold-and-win`. Framed everywhere as an "educational portfolio demo, play-money only, no real wagering" (`README.md`, `docs/SPEC.md`, `AGENTS.md`, `DISCLAIMER.md`). The headline is a self-computed **~96% TOTAL RTP** (`docs/PAR-SHEET.md`, `docs/adr/0011-genuine-96-total-rtp.md`). Real money / wagering / payment code is an explicit hard boundary ("Don't introduce real-money / wagering / payment anything", `AGENTS.md` § Boundaries). The audit posture is **operator-triggered**: routine CI drift-audit runs automatically, but the _deep_ review pass only runs after a human says "audit" (`CLAUDE.md` § "Per-PR audit gate").

### (2) How it's built

**Plain:** It's a plain-JavaScript web app drawn with a fast graphics library, built and tested with standard modern web tooling. Crucially, the "money math" code is kept separate from the "draw pretty pictures" code, so the math can be tested on its own without a browser.

**Technical:** Stack is **vanilla JavaScript (ES modules, no TypeScript) + PixiJS v8 (WebGL) + Vite + Vitest**, with Playwright for browser smoke tests and WebAudio for procedurally synthesized sound (`AGENTS.md` § Project structure; `package.json`). Architecture rule: render code (imports `pixi.js`) is firewalled from pure logic (no Pixi imports) so logic stays unit-testable (`AGENTS.md` § Code style). The pure math/logic modules are `src/outcome.js` (the weighted RNG spin generator), `src/wins.js` (payline evaluation), `src/slotmath.js` (the RTP-computation harness), and the bonus rule in `src/features/holdAndWin.js`; all tunable numbers live in `src/config.js` (`SYMBOL_WEIGHTS`, `RTP_TARGET = 0.96`, paytable, paylines, `BONUS`/`JACKPOTS`). Assets are procedural by design — no binary art/audio files (`docs/adr/0002-procedural-assets.md`).

### (3) How it works (the math + how it's checked)

**Plain:** Each spin fills a 3×3 grid by independently drawing a symbol for each of the 9 cells, weighted so some symbols are rarer than others. Winning lines pay a fixed multiple of your bet. The real money-engine is the **Hold & Win bonus**: land 6 or more coins and they lock, you get respins, and coins can carry cash values or jackpots — filling all 9 cells wins the top "GRAND" prize. The clever part is that the _exact same numbers_ the live game uses are the ones the math harness reads to compute the RTP, so the game you play and the math being proven cannot drift apart.

**Technical:** The grid is 9 i.i.d. weighted draws from one virtual reel strip of **3,148 stops**; coins are ~25.03% per cell (`coin: 788` stops in `src/config.js`), so 6+ coins trigger the bonus ~**1 in 99 spins** (exact binomial). Paytable (×bet, 3-of-a-kind): cherry 4, lemon 5, plum 6, watermelon 10, bell 20, bar 40, seven 100; coins never pay a line. Five fixed paylines (middle, top, bottom, two diagonals). RTP is a single **TOTAL** across base + feature: **base game ~45.69% (exact, by full payline enumeration)** + **Hold & Win feature ~50.3% (seeded Monte-Carlo)** = **~96.0%** (`docs/PAR-SHEET.md`). Pinned figures: deterministic seed 2026 × 12M spins → **96.08%**; 5 seeds × 20M spins → mean **96.008%** (range 95.83–96.24%). Jackpots (×bet): MINI 20, MINOR 50, MAJOR 200, GRAND 500. **No nudges** — `src/outcome.js` draws purely and pays strictly by the paytable, and the bonus odds (`BONUS.jackpotOdds`, `BONUS.respinLandChance`) live once in `config.js`, read by _both_ the live feature (`src/holdAndWin.js`) and the model (`src/slotmath.js`), so played RTP = computed RTP (ADR-0010, ADR-0011).

### (4) How it's verified — the gates

**Plain:** The math isn't just asserted; it's defended by several different kinds of automated test, each catching a different way the math could be wrong or could quietly rot. Some pin the exact numbers; some check the randomness is really random; some check the tests themselves actually have teeth.

**Technical:** Commands: `npm test` (full unit suite), `npm run test:proof` (RNG + RTP + property proofs), `npm run mutation` (mutation probes), `npm run smoke:browser` / `node verify.mjs` (Playwright boot + zero-console-error smoke). The gates:

- **RTP regression pin** — `test/rtp-target.test.js`: locks exact base RTP (~0.45689), the exact binomial trigger (~0.01006), and the 12M-spin TOTAL to **0.96082** inside a [95.5%, 96.5%] band; also asserts the feature out-pays the base lines and the sim is deterministic for a fixed seed.
- **RNG statistical battery** — `test/rng-stats.test.js`: seeded **mulberry32** put through chi-square, Kolmogorov–Smirnov, Wald-Wolfowitz runs, and lag-1 serial-correlation tests, plus a chi-square that the weighted symbol draw matches the configured weights. Seeds are fixed so nothing flakes.
- **Property + fuzz tests** — `test/property.test.js`: payout always finite/non-negative, payout exactly linear in bet, `evaluate()` never throws on adversarial/garbage grids.
- **Metamorphic invariants** — `test/metamorphic.test.js` (ADR-0013): scaling every weight by a constant must leave probabilities/RTP unchanged (catches absolute-count leakage); reversing the payline order must leave the result byte-identical (catches order leakage).
- **Mutation probe** — `scripts/mutation-probe.mjs` (ADR-0010): injects deliberate faults into `wins.js`/`slotmath.js` (e.g. "stop summing payouts", "ignore the bet", "every → some", "house-edge sign flip") in an isolated temp copy and confirms the suite **kills** them — reported as 100% (10/10), proving the tests aren't vacuous.
- **CI + drift audit** — CI workflows under `.github/workflows/` (`ci.yml`, `audit.yml`, `scan.yml`, etc.); the drift audit (`scripts/audit-drift.mjs`) reconciles what was claimed against what the diff did and posts a report on every PR (`docs/DRIFT-AUDIT.md`, ADR-0017).

### (5) What it proves — and what it doesn't

**Plain:** It proves that _this code's own math is internally consistent and correct_: the payout logic does what's claimed, the RTP figure is reproducible, and the randomness passes standard statistics tests. It does **not** prove that an outside authority blessed it. "Prove the math" here means "the in-repo tests pass" — full stop. No regulator, no lab, no certification.

**Technical:** A deliberate **factual-wording policy** (ADR-0014) forbids any claim of certification, auditing, approval, compliance, fairness, or regulatory status, and bans name-dropping standards bodies/test suites (GLI, eCOGRA, NIST SP 800-22, Diehard, etc.) — enforced by grep and by the always-present disclaimer surfaces: `DISCLAIMER.md`, the README blockquote, and the in-app banner in `index.html` ("Demo · play-money only · no real money, no prizes · not certified or audited"). The RTP is framed everywhere as **self-computed by this project's own simulation, shown for transparency**. On the persuasion side, the demo _removed_ the old forced-win/forced-bonus "nudges" so the experience matches the math (ADR-0011), and the one retained mood feature, `src/unease.js`, is documented and structured as **visual/audio only** — it "NEVER reads or writes the bonus ledger (coin amounts, totals, respins)", and the 12M-spin RTP pin acts as the canary that the money seam stayed untouched.

## Honest limits (a skeptic's read)

- **In-repo proof ≠ third-party certification.** Every figure is computed and checked by this project's _own_ code. Nothing here is certified, audited, approved, or reviewed by any regulator or testing laboratory — and the project explicitly forbids implying otherwise (ADR-0014, `DISCLAIMER.md`).
- **No real money, ever.** Credits have no cash value; they can't be bought, won, redeemed, withdrawn, or exchanged, and they reset on reload. Real-money/wagering/payment code is a hard, signed-off boundary (`AGENTS.md`).
- **The headline RTP is a model, with stated simplifications.** Cells are independent draws from one virtual strip (i.i.d.) rather than physical per-reel strips with positional correlation; the PAR sheet flags a multi-strip model as the next fidelity step (`docs/PAR-SHEET.md`, ADR-0011).
- **The feature RTP is simulated, not exact.** The base game is exact (enumeration); the Hold & Win feature is intractable to enumerate, so its ~50.3% is a high-volume seeded Monte-Carlo with a confidence band — reproducible, but a statistical estimate, not a closed-form proof.
- **"Tests pass" depends on the tests' own assumptions.** The mutation probe shows the suite catches the bugs it injects; it can't prove there's no bug nobody thought to inject. The operator-triggered deep-audit gate exists precisely because green checks don't prove the absence of uncovered seams (`CLAUDE.md`).
- **RNG caveat.** The RNG verified is a seeded **mulberry32** used for reproducible simulation; it passes standard uniformity/independence statistics, which is a strong sanity check, not a cryptographic-grade or lab-grade randomness guarantee.

## Glossary

- **RTP (Return-to-Player):** of every $100 wagered over millions of spins, how much comes back to players on average; here ~96% (the rest, ~4%, is the house edge). In this demo it's play-money and self-computed.
- **House edge:** the flip side of RTP — the share the house keeps on average (~4% here).
- **RNG (Random-Number Generator):** the code that decides each spin's outcome; must be statistically uniform and unpredictable for the RTP claim to mean anything.
- **Par sheet (Probability/Accounting Report):** the document listing a slot's math — symbol weights, RTP, hit frequency, volatility, jackpot odds (`docs/PAR-SHEET.md`).
- **Enumeration (exact):** computing a result by counting _every_ possible outcome weighted by its probability — used for the exact base-game RTP.
- **Monte-Carlo simulation:** estimating a result by running a huge number of random trials (here, millions of seeded spins) — used for the bonus RTP, which is too complex to enumerate.
- **Property test:** asserts a rule that must hold for _all_ inputs (e.g. "payout is always non-negative", "payout is linear in bet") rather than checking one specific case.
- **Metamorphic test:** changes an input in a way that _shouldn't_ change the output, and checks the output indeed didn't change — catches hidden dependencies on things that should be irrelevant.
- **Mutation test:** deliberately breaks the code and checks the test suite _fails_ — proving the tests actually have teeth and aren't passing vacuously.
- **Hit frequency:** how often a spin produces any win (here, line hits ~6.3% of spins).
- **Volatility:** how spread-out the outcomes are — frequent small wins vs. rare big ones.
- **Drift audit:** an automated check that what was _claimed_ (commits, PR text, docs) matches what the code change actually did (`scripts/audit-drift.mjs`).
- **Nudge:** a hidden tilt that forces wins/bonuses to make a demo feel livelier — deliberately _removed_ here so the played game matches the computed math.
- **ADR (Architecture Decision Record):** a short dated note in `docs/adr/` recording a significant decision and why.
