# 0004. Vite + vanilla ES modules (no TypeScript)

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

Goal was to ship something impressive fast, with instant dev feedback and a
trivial static build, in a throwaway container. The user prioritized speed.

## Decision

Use **Vite** (dev server + `vite build` static bundle) with **plain JavaScript
ES modules** — no TypeScript. All tunables centralized in `src/config.js`.

## Consequences

- Instant HMR, one-command build, easy to host anywhere (relative `base`).
- No TS toolchain/config friction; fewer moving parts.
- Cost: no static type safety — we offset this with ESLint + unit tests on the
  pure logic (ADR-0008). Revisit TS if the codebase grows substantially.

## Alternatives considered

- **TypeScript** — better safety, but setup/tsconfig friction against the
  "fast" goal; deferred, not rejected forever.
- **Plain `<script>` + no bundler** — no HMR, no module resolution for deps.
