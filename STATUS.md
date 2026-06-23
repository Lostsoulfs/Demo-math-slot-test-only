---
lifecycle: growing
frozen: false
agent_interop_phase: B
maturity: phase-B-local-mcp
updated: 2026-06-22
---

# Status — Coins: Hold & Win

**This project is GROWING, not frozen.** It will keep gaining features, governance, and
machine-readable surfaces until it is explicitly marked `frozen: true` in the front-matter
above. Treat anything here as a current snapshot of an in-progress build, not a final release.

This file is the lifecycle source-of-truth referenced by `AGENTS.md` (source-of-truth order
#3).

## Lifecycle

- **lifecycle:** `growing` — actively developed; expect change.
- **frozen:** `false` — no freeze declared.

## Agent-interop (A2A / MCP) — phase B (local stdio MCP server)

- **Phase A (done):** a static, machine-readable surface only — an A2A Agent Card and MCP
  tool definitions, as committed files, describing this repo's deterministic math capabilities
  (`verify-rtp`, `simulate-rtp`). Rolled out across the PRs in
  `docs/adr/0019-agent-interop-static-surface.md`.
- **Phase B (current):** those MCP tools are now genuinely **callable locally** via an in-repo
  **stdio MCP server** (`tools/mcp/server.mjs`) wrapping the pure `src/slotmath.js` exports. It
  runs in the **caller's own process** over stdio — **no network listener, no auth, no secrets**,
  so the "no backend to attack" property holds. See `docs/adr/0020-local-stdio-mcp-server.md`.
- **Phase C (not started):** a hosted/public A2A or MCP-HTTP endpoint + machine-to-machine auth
  (OAuth2/OIDC) + rate-limiting. Deferred to its own ADR and threat model.

The Agent Card therefore still advertises **no live, hosted endpoint** (`capabilities.streaming`,
`pushNotifications`, and `x-lifecycle.liveEndpoint` stay `false` — those track a phase-C hosted
endpoint); `x-lifecycle.localMcpServer` honestly marks the stdio server as locally callable. A
validation gate enforces both claims against the `agent_interop_phase` value above.

## Scope (unchanged)

Play-money slot-**math** demo: no real money, accounts, wagering, or AI/LLM runtime. RTP and
statistics are this project's own computed figures, shown for transparency — not certified or
audited (see `DISCLAIMER.md`, ADR-0014).
