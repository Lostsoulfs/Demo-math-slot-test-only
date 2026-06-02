# 0007. GitHub Pages deploy with artifact fallback

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

The app runs in a cloud container the user can't reach at `localhost`. They need
to play/test it from any device. GitHub Pages gives a live URL, but it must be
enabled in repo settings and — on a **private** repo — requires a paid plan.

## Decision

`.github/workflows/deploy.yml` always uploads the built `dist/` as a downloadable
artifact, AND attempts a Pages deploy that is **tolerated/skipped** when Pages
isn't configured (`configure-pages` with `continue-on-error`, deploy gated on its
outcome). Vite `base: './'` makes the bundle work at the Pages subpath and from
disk.

## Consequences

- CI is green regardless of plan; a working build is always downloadable.
- Pages auto-publishes the moment the user enables it — no code change needed.
- Cost: the live URL still needs a one-time manual "Source: GitHub Actions".

## Alternatives considered

- **Pages-only** — fails hard on private/free repos; blocks the demo.
- **Third-party host (Netlify/Vercel)** — another account/integration to set up.
