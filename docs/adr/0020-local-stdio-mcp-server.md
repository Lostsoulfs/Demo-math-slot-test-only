# 0020. Local stdio MCP server (agent-interop phase B)

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

ADR-0019 shipped a **static** agent-interop surface (an A2A Agent Card + MCP tool-defs for
`verify-rtp` / `simulate-rtp`) and deliberately deferred a live endpoint as "phase B (not
decided)" — a hosted endpoint "pulls in auth, rate-limiting, and a much larger threat surface,"
and the repo's stated security property is "no backend, no new runtime to attack."

The capabilities being advertised are already **pure, headless functions** in `src/slotmath.js`
(`theoreticalRtp`, `monteCarloFullGame` via `buildModel`). They are reachable today only by
reading the source or running the suite — the MCP tool-defs describe them but nothing actually
serves them. A 5-expert research panel (Working-Agreement #7), including a hosted-endpoint
steelman, converged on a **local stdio MCP server** as the right phase B: it makes the tools
genuinely callable the idiomatic way MCP tools are consumed (Claude Desktop / IDE) while keeping
the no-backend posture intact.

## Decision

Phase B is a runnable in-repo **stdio MCP server** (`tools/mcp/server.mjs`) that wraps the pure
`slotmath.js` exports. It runs in the **caller's own process** over stdio — **no HTTP, no network
listener, no auth, no secrets**. `agent_interop_phase: A → B`.

- The two tools (`verify_rtp`, `simulate_rtp`) read their names/titles/descriptions and output
  shapes from the static contract `tools/mcp/tools.json`, so the live server and the published
  tool-defs cannot drift.
- `modelOverrides` is honored as a **hypothetical-tuning** knob (it computes a what-if model, not
  the shipped RTP) but is **bounded before compute** — grid size, symbol count, the
  `symbols^reels` enumeration cost, and a degenerate (NaN) weights map are all rejected with a
  clean `isError` rather than allowed to exhaust memory or crash the stdio loop. `spins` is capped
  at `MAX_SPINS` (5,000,000).
- The honesty gate stays orthogonal to a hosted endpoint: `capabilities.streaming`,
  `capabilities.pushNotifications`, and `x-lifecycle.liveEndpoint` remain **`false`** (they track a
  hosted A2A/MCP-HTTP endpoint, which still does not exist). A new additive marker
  `x-lifecycle.localMcpServer` (`available`, `transport: "stdio"`, `entry`) records the stdio
  server, and the validator requires the entry file to exist on disk in phase B.

A **hosted/public A2A or MCP-HTTP endpoint + OAuth2/OIDC auth + rate-limiting** is explicitly
re-scoped to a future **phase C** with its own ADR and threat model.

## Consequences

- Easier: an MCP client can call this repo's deterministic slot-math directly over stdio, with no
  server to stand up and no credentials. The expensive offline 12M-spin pin stays a test-only
  figure; interactive calls are bounded (1M ≈ 1s).
- Security: the only new code runs in the caller's trust boundary. The added runtime deps
  (`@modelcontextprotocol/sdk`, `zod`) ship a dormant HTTP-transport tree that this server never
  imports — no listener is instantiated (verified). Untrusted `modelOverrides` is validated before
  reaching the math (bounded compute / no NaN-Infinity leak), per MCP input-hardening guidance.
- Harder / cost: the validator and its teeth test grow a phase-B branch; the `agent-card` gate now
  asserts the `localMcpServer` marker is present, runnable, and not an overclaim. `server.mjs` and
  this ADR join `control-policy.json` `required_files`.
- Rolled out across PRs: **B1** (server + deps + integration test, STATUS stays phase A) and
  **B2** (this ADR + phase flip + honest card + gate teeth + docs).

## Alternatives considered

- **A hosted public A2A / MCP-HTTP endpoint now** — why not: it pulls in auth, rate-limiting, and a
  much larger threat surface, breaking the "no backend to attack" property for a play-money demo;
  the 12M-spin sim also will not fit free-serverless CPU caps. Deferred to phase C.
- **Stay static (phase A only)** — why not: the tool-defs describe callable functions that nothing
  serves; a local stdio server closes that gap with zero hosted-runtime risk.
- **MCP SDK v2 pre-alpha** (`@modelcontextprotocol/server`, `z.object()` shapes) — why not: the SDK
  README names v1 (`@modelcontextprotocol/sdk`) the recommended production line; v2's API is
  unstable. Pinned to v1 (`^1.29.0`, `McpServer` + raw `ZodRawShape`).
