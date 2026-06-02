# 0001. PixiJS v8 (WebGL) over DOM/CSS for the slot

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

Hard requirement from the user: "max visuals but the UI HAS to be smooth — laggy
is never ok." A 3×3 slot with motion blur, glow, particle bursts, and screen
shake needs to hold 60fps. DOM/CSS animation janks once many animated layers and
filters stack; the browser's main thread becomes the bottleneck.

## Decision

Render the entire game on **PixiJS v8** (WebGL, GPU-accelerated) inside a single
canvas, authored at a fixed design resolution and letterboxed to the window.

## Consequences

- GPU compositing keeps 60fps even with glow + hundreds of particles.
- Symbols are baked to GPU textures once; reels reuse cheap sprites.
- Cost: real performance can't be measured in headless CI (software WebGL) — see
  ADR-0008 / LEARNINGS for how we verify instead.
- We pull in `pixi.js` + `pixi-filters` as runtime deps.

## Alternatives considered

- **DOM + Web Animations API** (e.g. johakr/html5-slot-machine) — clean but
  janks under heavy filters/particles; fails the "never laggy" bar.
- **Raw Canvas2D** — no free GPU filters; we'd reimplement glow/blur on the CPU.
