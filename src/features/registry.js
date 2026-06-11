// =====================================================================
// registry.js — the pluggable-feature seam (ADR-0016).
//
// A feature is a PURE descriptor: { id, checkTrigger(spin, model),
// play(triggerCells, model, rng) } — no Pixi, no globals, rng injected.
// `spin = { grid, cells }`: the full settled grid (canonical) plus the
// precomputed bonus-symbol cells, so a feature can trigger on anything
// (see features/holdAndWin.js, the first plug-in). The orchestrator
// (main.js) asks the registry which feature fired and dispatches to the
// matching renderer by id; the math harness (slotmath.js) imports a
// feature's pure functions directly so simulations don't depend on
// global registration state. Registration order is trigger priority.
// =====================================================================

import { holdAndWinFeature } from './holdAndWin.js';

const features = [];

export function registerFeature(feature) {
  if (!feature || typeof feature.id !== 'string' || !feature.id) {
    throw new Error('feature needs a non-empty string id');
  }
  if (typeof feature.checkTrigger !== 'function' || typeof feature.play !== 'function') {
    throw new Error(`feature "${feature.id}" needs checkTrigger() and play()`);
  }
  if (features.some((f) => f.id === feature.id)) {
    throw new Error(`feature "${feature.id}" is already registered`);
  }
  features.push(feature);
}

export function getFeature(id) {
  return features.find((f) => f.id === id) ?? null;
}

export function listFeatures() {
  return [...features];
}

// First registered feature whose trigger fires on this spin.
// Returns { feature, payload } or null.
export function findTriggered(spin, model) {
  for (const feature of features) {
    const payload = feature.checkTrigger(spin, model);
    if (payload) return { feature, payload };
  }
  return null;
}

// This game ships with Hold & Win installed.
registerFeature(holdAndWinFeature);
