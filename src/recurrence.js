// =====================================================================
// recurrence.js — Recurrence Detection Engine (port of Health-Prototype's
// recurrence.py). Pure logic, ZERO Pixi imports — unit-testable like
// wins.js / outcome.js / slotmath.js.
//
// Given a set of records, surface every case where the same item appears
// across multiple dated entries, and cite exactly where each occurrence came
// from. This is a LIBRARIAN, not an interpreter: it surfaces, counts, and
// cites provenance. It NEVER scores, ranks, diagnoses, or says what a pattern
// *means*. That separation is the design principle and the legal firewall in
// one. Domain-agnostic by design — a record can be a patient, a pharmacy
// profile, a session log; the engine does not care.
//
// Five surfacing rules over the same grouped occurrences:
//   recurrence · gap (re-emergence) · frequency (burst) ·
//   co-occurrence · cadence change.
// runReport() routes all five into one per-record, provenance-cited report.
//
// Matching is layered and every extra layer is OPT-IN; with the defaults this
// is exact (v0) behavior. normalize (trim/collapse/case-fold), synonyms
// (declared variant->canonical), and fuzzyCutoff (difflib-style similarity)
// each merge differently-spelled entries — and every merge is cited in
// `variants`, never hidden.
// =====================================================================

// ---------------------------------------------------------------------------
// Matching core — shared by every rule
// ---------------------------------------------------------------------------

function checkFuzzyCutoff(fuzzyCutoff) {
  // difflib ratios live in [0, 1]; reject anything outside so a typo'd argument
  // fails loudly instead of silently meaning 'always merge' or 'never merge'.
  if (fuzzyCutoff != null && !(fuzzyCutoff >= 0 && fuzzyCutoff <= 1)) {
    throw new Error(`fuzzyCutoff must be between 0.0 and 1.0, got ${fuzzyCutoff}`);
  }
}

// Canonicalize trivial spelling variation: trim, collapse internal whitespace,
// and case-fold. Text canonicalization, not interpretation — meaning unchanged.
function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Return an effective {variant -> canonical} map keyed for lookup. Keys and
// values run through the same normalizer as the items when `normalize` is on.
function buildSynonymMap(synonyms, normalize) {
  const out = new Map();
  if (!synonyms) return out;
  for (const [variant, canonical] of Object.entries(synonyms)) {
    const key = normalize ? normalizeText(String(variant)) : String(variant);
    out.set(key, normalize ? normalizeText(String(canonical)) : String(canonical));
  }
  return out;
}

// Reduce an original item string to its grouping key.
function canonicalKey(item, synonymMap, normalize) {
  const key = normalize ? normalizeText(item) : item;
  return synonymMap.has(key) ? synonymMap.get(key) : key;
}

// Choose the display label for a group: the most frequent original surface
// string, ties broken by earliest occurrence (date, then input order). The
// label is always a real string from the data; the full set is in `variants`.
// occ entries are [dateStr, original, index].
function pickLabel(occ) {
  const counts = new Map();
  for (const o of occ) counts.set(o[1], (counts.get(o[1]) || 0) + 1);
  const best = Math.max(...counts.values());
  const candidates = new Set();
  for (const [original, n] of counts) if (n === best) candidates.add(original);
  let chosen = null;
  for (const o of occ) {
    if (!candidates.has(o[1])) continue;
    if (chosen === null || o[0] < chosen[0] || (o[0] === chosen[0] && o[2] < chosen[2])) {
      chosen = o;
    }
  }
  return chosen[1];
}

// Parse an ISO 8601 date (strict YYYY-MM-DD) into a UTC-day timestamp, or null
// if absent/unparseable. Date rules skip occurrences they can't date — they
// never guess a date.
function parseDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const dt = new Date(ms);
  // reject impossible dates (e.g. 2026-02-30 rolls over) by round-tripping
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return ms;
}

const MS_PER_DAY = 86400000;
const dayDiff = (laterMs, earlierMs) => Math.round((laterMs - earlierMs) / MS_PER_DAY);

// From a group's occurrences, the datable ones as {ms, str}, sorted
// chronologically (stable for equal dates). Undated/unparseable are dropped.
function datedSorted(occ) {
  const dated = [];
  for (const o of occ) {
    const ms = parseDate(o[0]);
    if (ms !== null) dated.push({ ms, str: o[0] });
  }
  // stable sort by ms (Array.prototype.sort is stable in modern engines)
  return dated.sort((a, b) => a.ms - b.ms);
}

// Greedily cluster near-duplicate keys; return Map {key -> representative}.
// Deterministic: keys processed in sorted order, each joining the first
// existing cluster whose representative it resembles (ratio >= cutoff) or
// starting a new one. Intended for lookalikes/typos, not transitive chains.
function fuzzyClusters(keys, cutoff) {
  const reps = [];
  const mapping = new Map();
  for (const key of [...keys].sort()) {
    let match = null;
    for (const rep of reps) {
      if (difflibRatio(key, rep) >= cutoff) {
        match = rep;
        break;
      }
    }
    if (match === null) {
      reps.push(key);
      match = key;
    }
    mapping.set(key, match);
  }
  return mapping;
}

// Group one record's entries by canonical item key. Returns [recordId, groups]
// where groups is a Map key -> [ [dateStr, original, index], ... ], with
// optional fuzzy merging applied. Malformed records yield empty groups rather
// than throwing. Shared core every rule reads from, so all rules see the same
// exact/normalize/synonym/fuzzy matching.
function recordGroups(record, field, synonymMap, normalize, fuzzyCutoff) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    return ['', new Map()];
  }
  const recordId = record.id == null ? '' : String(record.id);
  const entries = record.entries;
  if (!Array.isArray(entries)) return [recordId, new Map()];

  let groups = new Map();
  entries.forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return;
    const item = entry[field];
    if (item == null || item === '') return; // skip None/""/missing field
    const original = String(item);
    const key = canonicalKey(original, synonymMap, normalize);
    const date = entry.date;
    const dateStr = date == null ? '' : String(date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push([dateStr, original, index]);
  });

  // Optionally fold near-duplicate keys together.
  if (fuzzyCutoff != null && groups.size) {
    const repOf = fuzzyClusters([...groups.keys()], fuzzyCutoff);
    const merged = new Map();
    for (const [key, occ] of groups) {
      const rep = repOf.get(key);
      if (!merged.has(rep)) merged.set(rep, []);
      merged.get(rep).push(...occ);
    }
    groups = merged;
  }

  return [recordId, groups];
}

const sortedKeys = (groups) => [...groups.keys()].sort();
const uniqueSorted = (arr) => [...new Set(arr)].sort();

// ---------------------------------------------------------------------------
// difflib.SequenceMatcher.ratio() — Ratcliff/Obershelp, ported faithfully.
// ratio = 2*M / T, where M is the total size of the recursively-found longest
// matching blocks and T is len(a)+len(b). No junk/autojunk handling: inputs
// here are short labels (well under difflib's 200-element autojunk threshold).
// ---------------------------------------------------------------------------

function findLongestMatch(a, b, b2j, alo, ahi, blo, bhi) {
  let besti = alo,
    bestj = blo,
    bestsize = 0;
  let j2len = new Map();
  for (let i = alo; i < ahi; i++) {
    const newj2len = new Map();
    const js = b2j.get(a[i]);
    if (js) {
      for (const j of js) {
        if (j < blo) continue;
        if (j >= bhi) break;
        const k = (j2len.get(j - 1) || 0) + 1;
        newj2len.set(j, k);
        if (k > bestsize) {
          besti = i - k + 1;
          bestj = j - k + 1;
          bestsize = k;
        }
      }
    }
    j2len = newj2len;
  }
  return [besti, bestj, bestsize];
}

function difflibRatio(a, b) {
  if (a.length === 0 && b.length === 0) return 1.0;
  const b2j = new Map();
  for (let j = 0; j < b.length; j++) {
    const ch = b[j];
    if (!b2j.has(ch)) b2j.set(ch, []);
    b2j.get(ch).push(j);
  }
  let matches = 0;
  // iterative recursion over [alo, ahi, blo, bhi] blocks
  const queue = [[0, a.length, 0, b.length]];
  while (queue.length) {
    const [alo, ahi, blo, bhi] = queue.pop();
    const [i, j, k] = findLongestMatch(a, b, b2j, alo, ahi, blo, bhi);
    if (k > 0) {
      matches += k;
      if (alo < i && blo < j) queue.push([alo, i, blo, j]);
      if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
    }
  }
  return (2.0 * matches) / (a.length + b.length);
}

// ---------------------------------------------------------------------------
// Math helpers — median, Python-faithful round, Pettitt change point
// ---------------------------------------------------------------------------

// statistics.median: middle value (odd n) or mean of the two middle (even n).
function median(values) {
  const s = [...values].sort((x, y) => x - y);
  const n = s.length;
  const mid = Math.floor(n / 2);
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Python's round(): round half to even (banker's rounding). R016's cadence
// (round(9.5) -> 10) depends on this.
function pyRound(x) {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff < 0.5) return f;
  if (diff > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

// Locate the single most likely change point in a sequence (Pettitt, 1979).
// Returns the split k (1 <= k < n) that maximizes |U_k|; ties broken by the
// larger before/after median ratio, then the earliest k. Pure rank arithmetic.
function pettittPivot(values) {
  const n = values.length;
  let bestK = 1;
  let bestKey = null; // [absU, ratio, -k]
  for (let k = 1; k < n; k++) {
    let u = 0;
    for (let i = 0; i < k; i++) {
      for (let j = k; j < n; j++) {
        const d = values[i] - values[j];
        u += (d > 0 ? 1 : 0) - (d < 0 ? 1 : 0);
      }
    }
    const beforeMed = median(values.slice(0, k));
    const afterMed = median(values.slice(k));
    const ratio =
      beforeMed && afterMed ? Math.max(beforeMed / afterMed, afterMed / beforeMed) : 0.0;
    const key = [Math.abs(u), ratio, -k];
    if (bestKey === null || tupleGt(key, bestKey)) {
      bestK = k;
      bestKey = key;
    }
  }
  return bestK;
}

// lexicographic compare for fixed-length numeric tuples: a > b ?
function tupleGt(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Rule 1 — recurrence
// ---------------------------------------------------------------------------

export function detectRecurrence(
  records,
  { field = 'item', minCount = 2, normalize = false, synonyms = null, fuzzyCutoff = null } = {},
) {
  if (minCount < 1) throw new Error(`minCount must be >= 1, got ${minCount}`);
  checkFuzzyCutoff(fuzzyCutoff);

  const hits = [];
  if (!records || !records.length) return hits;

  const synonymMap = buildSynonymMap(synonyms, normalize);
  for (const record of records) {
    const [recordId, groups] = recordGroups(record, field, synonymMap, normalize, fuzzyCutoff);
    for (const key of sortedKeys(groups)) {
      const occ = groups.get(key);
      if (occ.length < minCount) continue;
      hits.push({
        recordId,
        item: pickLabel(occ),
        count: occ.length,
        dates: occ.map((o) => o[0]).sort(),
        variants: uniqueSorted(occ.map((o) => o[1])),
      });
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Rule 2 — gap / re-emergence
// ---------------------------------------------------------------------------

export function detectGap(
  records,
  { field = 'item', gapDays = 90, normalize = false, synonyms = null, fuzzyCutoff = null } = {},
) {
  if (gapDays < 0) throw new Error(`gapDays must be >= 0, got ${gapDays}`);
  checkFuzzyCutoff(fuzzyCutoff);

  const hits = [];
  if (!records || !records.length) return hits;

  const synonymMap = buildSynonymMap(synonyms, normalize);
  for (const record of records) {
    const [recordId, groups] = recordGroups(record, field, synonymMap, normalize, fuzzyCutoff);
    for (const key of sortedKeys(groups)) {
      const occ = groups.get(key);
      const dated = datedSorted(occ);
      const label = pickLabel(occ);
      const variants = uniqueSorted(occ.map((o) => o[1]));
      for (let i = 0; i + 1 < dated.length; i++) {
        const delta = dayDiff(dated[i + 1].ms, dated[i].ms);
        if (delta > gapDays) {
          hits.push({
            recordId,
            item: label,
            gapDays: delta,
            beforeDate: dated[i].str,
            afterDate: dated[i + 1].str,
            variants,
          });
        }
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Rule 3 — frequency / burst
// ---------------------------------------------------------------------------

export function detectFrequency(
  records,
  {
    field = 'item',
    windowDays = 30,
    minCount = 3,
    normalize = false,
    synonyms = null,
    fuzzyCutoff = null,
  } = {},
) {
  if (windowDays < 0) throw new Error(`windowDays must be >= 0, got ${windowDays}`);
  if (minCount < 1) throw new Error(`minCount must be >= 1, got ${minCount}`);
  checkFuzzyCutoff(fuzzyCutoff);

  const hits = [];
  if (!records || !records.length) return hits;

  const synonymMap = buildSynonymMap(synonyms, normalize);
  for (const record of records) {
    const [recordId, groups] = recordGroups(record, field, synonymMap, normalize, fuzzyCutoff);
    for (const key of sortedKeys(groups)) {
      const occ = groups.get(key);
      const dated = datedSorted(occ);
      if (dated.length < minCount) continue;
      // Two-pointer sweep for the densest window (earliest on ties).
      let left = 0;
      let bestCount = 0;
      let bestSpan = [0, 0];
      for (let right = 0; right < dated.length; right++) {
        while (dayDiff(dated[right].ms, dated[left].ms) > windowDays) left++;
        if (right - left + 1 > bestCount) {
          bestCount = right - left + 1;
          bestSpan = [left, right];
        }
      }
      if (bestCount >= minCount) {
        const [lo, hi] = bestSpan;
        const window = dated.slice(lo, hi + 1);
        hits.push({
          recordId,
          item: pickLabel(occ),
          count: bestCount,
          windowStart: window[0].str,
          windowEnd: window[window.length - 1].str,
          dates: window.map((d) => d.str),
          variants: uniqueSorted(occ.map((o) => o[1])),
        });
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Rule 4 — co-occurrence
// ---------------------------------------------------------------------------

// Greedily pair dates from two items that fall within windowDays. One-to-one:
// each occurrence-day used at most once. Candidates consumed smallest-gap first
// (ties: earlier dateA, then dateB) for determinism. Returns matched
// [dateA, dateB, gapDays] sorted chronologically.
function matchWithinWindow(datesA, datesB, windowDays) {
  const pa = [];
  for (const s of datesA) {
    const ms = parseDate(s);
    if (ms !== null) pa.push({ ms, str: s });
  }
  const pb = [];
  for (const s of datesB) {
    const ms = parseDate(s);
    if (ms !== null) pb.push({ ms, str: s });
  }
  pa.sort((x, y) => x.ms - y.ms);
  pb.sort((x, y) => x.ms - y.ms);
  const candidates = [];
  for (const a of pa) {
    for (const b of pb) {
      const gap = Math.abs(dayDiff(a.ms, b.ms));
      if (gap <= windowDays) candidates.push([gap, a.ms, a.str, b.ms, b.str]);
    }
  }
  candidates.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[3] - y[3]);
  const usedA = new Set();
  const usedB = new Set();
  const matched = [];
  for (const [gap, , sa, , sb] of candidates) {
    if (usedA.has(sa) || usedB.has(sb)) continue;
    usedA.add(sa);
    usedB.add(sb);
    matched.push([sa, sb, gap]);
  }
  matched.sort((x, y) =>
    x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0,
  );
  return matched;
}

// all 2-combinations of a sorted array, in order
function combinations2(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) out.push([arr[i], arr[j]]);
  }
  return out;
}

export function detectCooccurrence(
  records,
  {
    field = 'item',
    minCount = 2,
    windowDays = 0,
    normalize = false,
    synonyms = null,
    fuzzyCutoff = null,
  } = {},
) {
  if (minCount < 1) throw new Error(`minCount must be >= 1, got ${minCount}`);
  if (windowDays < 0) throw new Error(`windowDays must be >= 0, got ${windowDays}`);
  checkFuzzyCutoff(fuzzyCutoff);

  const hits = [];
  if (!records || !records.length) return hits;

  const synonymMap = buildSynonymMap(synonyms, normalize);
  for (const record of records) {
    const [recordId, groups] = recordGroups(record, field, synonymMap, normalize, fuzzyCutoff);
    const datesByKey = new Map();
    const labelByKey = new Map();
    const variantsByKey = new Map();
    for (const [key, occ] of groups) {
      const dated = new Set(occ.map((o) => o[0]).filter((d) => d)); // undated "" excluded
      if (dated.size) {
        datesByKey.set(key, dated);
        labelByKey.set(key, pickLabel(occ));
        variantsByKey.set(key, uniqueSorted(occ.map((o) => o[1])));
      }
    }
    for (const [keyA, keyB] of combinations2([...datesByKey.keys()].sort())) {
      const labelA = labelByKey.get(keyA);
      const labelB = labelByKey.get(keyB);
      if (windowDays === 0) {
        const setB = datesByKey.get(keyB);
        const shared = [...datesByKey.get(keyA)].filter((d) => setB.has(d));
        if (shared.length >= minCount) {
          hits.push({
            recordId,
            itemA: labelA,
            itemB: labelB,
            item: `${labelA} + ${labelB}`,
            count: shared.length,
            dates: shared.sort(),
            variantsA: variantsByKey.get(keyA),
            variantsB: variantsByKey.get(keyB),
            windowDays: 0,
            pairs: [],
          });
        }
      } else {
        const matched = matchWithinWindow(datesByKey.get(keyA), datesByKey.get(keyB), windowDays);
        if (matched.length >= minCount) {
          const involved = uniqueSorted(matched.flatMap((p) => [p[0], p[1]]));
          hits.push({
            recordId,
            itemA: labelA,
            itemB: labelB,
            item: `${labelA} + ${labelB}`,
            count: matched.length,
            dates: involved,
            variantsA: variantsByKey.get(keyA),
            variantsB: variantsByKey.get(keyB),
            windowDays,
            pairs: matched,
          });
        }
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Rule 5 — cadence change
// ---------------------------------------------------------------------------

export function detectCadenceChange(
  records,
  {
    field = 'item',
    minOccurrences = 4,
    ratio = 2.0,
    normalize = false,
    synonyms = null,
    fuzzyCutoff = null,
  } = {},
) {
  if (minOccurrences < 2) throw new Error(`minOccurrences must be >= 2, got ${minOccurrences}`);
  if (ratio <= 1.0) throw new Error(`ratio must be > 1.0, got ${ratio}`);
  checkFuzzyCutoff(fuzzyCutoff);

  const hits = [];
  if (!records || !records.length) return hits;

  const synonymMap = buildSynonymMap(synonyms, normalize);
  for (const record of records) {
    const [recordId, groups] = recordGroups(record, field, synonymMap, normalize, fuzzyCutoff);
    for (const key of sortedKeys(groups)) {
      const occ = groups.get(key);
      // Distinct dated days, chronological (one event per day; undated out).
      const days = [];
      for (const { ms, str } of datedSorted(occ)) {
        if (!days.length || ms !== days[days.length - 1].ms) days.push({ ms, str });
      }
      if (days.length < minOccurrences) continue;
      const intervals = [];
      for (let i = 0; i + 1 < days.length; i++) intervals.push(dayDiff(days[i + 1].ms, days[i].ms));
      if (intervals.length < 2) continue;
      const k = pettittPivot(intervals);
      const beforeMed = median(intervals.slice(0, k));
      const afterMed = median(intervals.slice(k));
      if (beforeMed <= 0 || afterMed <= 0) continue;
      if (Math.max(beforeMed / afterMed, afterMed / beforeMed) < ratio) continue;
      hits.push({
        recordId,
        item: pickLabel(occ),
        beforeInterval: pyRound(beforeMed),
        afterInterval: pyRound(afterMed),
        pivotDate: days[k].str,
        dates: days.map((d) => d.str),
        variants: uniqueSorted(occ.map((o) => o[1])),
      });
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Formatters — one provenance-cited line per hit
// ---------------------------------------------------------------------------

function mergeClause(variants) {
  if (variants.length > 1) return ' [merged: ' + variants.map((v) => `"${v}"`).join(', ') + ']';
  return '';
}

export function formatHit(hit, withRecord = true) {
  const dates = hit.dates.map((d) => (d ? d : '(undated)')).join(', ');
  const prefix = withRecord ? `Record ${hit.recordId}: ` : '';
  return (
    `${prefix}"${hit.item}" recurred ${hit.count} times — ${dates}` + mergeClause(hit.variants)
  );
}

export function formatGapHit(hit, withRecord = true) {
  const prefix = withRecord ? `Record ${hit.recordId}: ` : '';
  return (
    `${prefix}"${hit.item}" returned after ${hit.gapDays} days ` +
    `— last seen ${hit.beforeDate}, then ${hit.afterDate}` +
    mergeClause(hit.variants)
  );
}

export function formatFrequencyHit(hit, withRecord = true) {
  const span = dayDiff(parseDate(hit.windowEnd), parseDate(hit.windowStart));
  const dates = hit.dates.join(', ');
  const prefix = withRecord ? `Record ${hit.recordId}: ` : '';
  return (
    `${prefix}"${hit.item}" appeared ${hit.count} times within ${span} days — ${dates}` +
    mergeClause(hit.variants)
  );
}

function pairMergeClause(hit) {
  let clause = '';
  if (hit.variantsA.length > 1) clause += ` "${hit.itemA}"${mergeClause(hit.variantsA)}`;
  if (hit.variantsB.length > 1) clause += ` "${hit.itemB}"${mergeClause(hit.variantsB)}`;
  return clause;
}

export function formatCooccurrenceHit(hit, withRecord = true) {
  const prefix = withRecord ? `Record ${hit.recordId}: ` : '';
  let line;
  if (hit.windowDays > 0) {
    const pairs = hit.pairs.map(([a, b, g]) => `(${a} ~ ${b}: ${g}d)`).join(', ');
    line =
      `${prefix}"${hit.itemA}" + "${hit.itemB}" co-occurred ` +
      `${hit.count} times within ${hit.windowDays} days — ${pairs}`;
  } else {
    const dates = hit.dates.join(', ');
    line = `${prefix}"${hit.itemA}" + "${hit.itemB}" co-occurred ${hit.count} times — ${dates}`;
  }
  return line + pairMergeClause(hit);
}

export function formatCadenceChangeHit(hit, withRecord = true) {
  const dates = hit.dates.join(', ');
  const prefix = withRecord ? `Record ${hit.recordId}: ` : '';
  return (
    `${prefix}"${hit.item}" interval changed from ~${hit.beforeInterval}d ` +
    `to ~${hit.afterInterval}d at ${hit.pivotDate} — ${dates}` +
    mergeClause(hit.variants)
  );
}

// ---------------------------------------------------------------------------
// Router — one dispatch over an expert registry into a per-record report
// ---------------------------------------------------------------------------

// Registry order IS the report's expert order: recurrence (base lens), then
// gap, frequency, co-occurrence, cadence change. `name` is a neutral lens label
// (provenance for which rule surfaced a line) — never a judgment or ranking.
// The router invokes `detect` with ONLY the shared matching knobs; each rule's
// own thresholds fall through to their documented defaults.
export const EXPERTS = [
  { name: 'recurrence', detect: detectRecurrence, formatter: formatHit },
  { name: 'gap', detect: detectGap, formatter: formatGapHit },
  { name: 'frequency', detect: detectFrequency, formatter: formatFrequencyHit },
  { name: 'cooccurrence', detect: detectCooccurrence, formatter: formatCooccurrenceHit },
  { name: 'cadence_change', detect: detectCadenceChange, formatter: formatCadenceChangeHit },
];

// Run every expert over the records and assemble a per-record listing. Each
// expert is invoked once with only the shared matching knobs; rule-specific
// thresholds keep their defaults. Hits are grouped by recordId and ordered
// deterministically: records by id, experts in registry order, hits within an
// expert in that rule's order. Records with no findings are OMITTED — the
// report surfaces what is present, it never asserts a record is "clean".
export function runReport(
  records,
  {
    experts = EXPERTS,
    field = 'item',
    normalize = false,
    synonyms = null,
    fuzzyCutoff = null,
  } = {},
) {
  const reports = new Map();
  for (const expert of experts) {
    const hits = expert.detect(records, { field, normalize, synonyms, fuzzyCutoff });
    for (const hit of hits) {
      if (!reports.has(hit.recordId)) {
        reports.set(hit.recordId, { recordId: hit.recordId, findings: [] });
      }
      reports.get(hit.recordId).findings.push({
        expert: expert.name,
        hit,
        line: expert.formatter(hit, false),
      });
    }
  }
  return [...reports.keys()].sort().map((rid) => reports.get(rid));
}

// Render the combined per-record report as text: a header per record, then one
// line per finding prefixed with its expert (lens) name. Records are blank-line
// separated; an empty report renders as "".
export function formatReport(reports) {
  const blocks = [];
  for (const report of reports) {
    const lines = [`Record ${report.recordId}:`];
    for (const f of report.findings) lines.push(`  [${f.expert}] ${f.line}`);
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}
