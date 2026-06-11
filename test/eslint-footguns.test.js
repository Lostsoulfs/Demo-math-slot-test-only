import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import config from '../eslint.config.js';

// =====================================================================
// The footgun lint rules (eslint.config.js) are lessons from
// docs/LEARNINGS.md promoted to executable checks. This pins that they
// actually FIRE — the PR that added them proved it with a throwaway probe
// (audit F1: "a lesson isn't learned until it's executable" applies to the
// executable check itself). Flat-config option-REPLACEMENT on overlapping
// blocks is exactly the kind of edit that silently neuters a selector while
// `npm run lint` stays green; this catches that.
//
// We verify the REAL config array (imported above), filename-routed so the
// src/** and src/persist.js scoping is exercised, not a copy.
// =====================================================================

const linter = new Linter();

// ESLint flat config matches `files`/`ignores` by filename, so the path we
// pass decides which blocks apply. Returns only the messages for the two
// footgun rule ids (recommended-rule noise like no-undef is filtered out).
function lintFootguns(code, filename) {
  return linter
    .verify(code, config, { filename })
    .filter((m) => m.ruleId === 'no-restricted-syntax' || m.ruleId === 'no-restricted-globals')
    .map((m) => m.message);
}

const SRC = 'src/foo.js';
const PERSIST = 'src/persist.js';

describe('footgun lint rules — Pixi v8 pointermove', () => {
  it('fires on a plain pointermove listener', () => {
    const msgs = lintFootguns("stage.on('pointermove', () => {});", SRC);
    expect(msgs.some((m) => m.includes('globalpointermove'))).toBe(true);
  });

  it('does NOT fire on globalpointermove (the correct form)', () => {
    expect(lintFootguns("stage.on('globalpointermove', () => {});", SRC)).toEqual([]);
  });

  it('still fires inside src/persist.js (exempt from storage only, not Pixi)', () => {
    const msgs = lintFootguns("stage.on('pointermove', () => {});", PERSIST);
    expect(msgs.some((m) => m.includes('globalpointermove'))).toBe(true);
  });
});

describe('footgun lint rules — Pixi v8 generateTexture frame', () => {
  it('fires on a plain-object frame', () => {
    const code = 'renderer.generateTexture({ frame: { x: 0, y: 0, width: 8, height: 8 } });';
    const msgs = lintFootguns(code, SRC);
    expect(msgs.some((m) => m.includes('new Rectangle'))).toBe(true);
  });

  it('does NOT fire on a new Rectangle(...) frame (the correct form)', () => {
    const code = 'renderer.generateTexture({ frame: new Rectangle(0, 0, 8, 8) });';
    expect(lintFootguns(code, SRC)).toEqual([]);
  });
});

describe('footgun lint rules — localStorage firewall', () => {
  it('fires on bare localStorage outside persist.js', () => {
    const msgs = lintFootguns("localStorage.getItem('k');", SRC);
    expect(msgs.some((m) => m.includes('persist.js'))).toBe(true);
  });

  it('fires on window.localStorage outside persist.js', () => {
    const msgs = lintFootguns('window.localStorage.getItem("k");', SRC);
    expect(msgs.some((m) => m.includes('persist.js'))).toBe(true);
  });

  it('does NOT fire inside src/persist.js (the one allowed module)', () => {
    expect(lintFootguns('localStorage.getItem("k");', PERSIST)).toEqual([]);
    expect(lintFootguns('window.localStorage.getItem("k");', PERSIST)).toEqual([]);
  });
});
