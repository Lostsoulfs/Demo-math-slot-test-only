// =====================================================================
// recurrenceData.js — placeholder record set + hand-written oracle for the
// recurrence engine. Ported verbatim from Health-Prototype's
// data/sample_records.py. ZERO real data — every record is invented.
//
// The author is the oracle: each ANSWER_KEY was written BY HAND first (what
// *should* surface), then the engine runs and must match it exactly — never
// patch the key toward the code. test/recurrence.test.js enforces that
// agreement, the same way the Python suite does.
//
// Record shape (domain-agnostic):
//   { id: 'R001', entries: [{ date: '2026-01-10', item: 'poor sleep' }, ...] }
//   - date — ISO 8601; cited for provenance.
//   - item — the text the engine scans (default field).
//   - tag  — OPTIONAL category; carried but ignored by the rules.
// Default rule: an item flags when it appears in 2+ entries of one record.
// =====================================================================

// Each record exists for exactly ONE reason, stated in its comment.
export const SAMPLE_RECORDS = [
  // R001 — baseline 3x recurrence; a one-off item must NOT flag.
  {
    id: 'R001',
    entries: [
      { date: '2026-01-05', item: 'poor sleep' },
      { date: '2026-02-10', item: 'poor sleep' },
      { date: '2026-03-12', item: 'poor sleep' },
      { date: '2026-01-20', item: 'headache' },
    ],
  },
  // R002 — two distinct items each recur; both flag independently.
  {
    id: 'R002',
    entries: [
      { date: '2026-01-08', item: 'appetite change' },
      { date: '2026-02-15', item: 'appetite change' },
      { date: '2026-02-02', item: 'fatigue' },
      { date: '2026-03-01', item: 'fatigue' },
    ],
  },
  // R003 — nothing recurs; clean record proves zero false positives.
  {
    id: 'R003',
    entries: [
      { date: '2026-01-10', item: 'cough' },
      { date: '2026-02-05', item: 'rash' },
      { date: '2026-03-09', item: 'dizziness' },
    ],
  },
  // R004 — exactly-at-threshold (2x) recurrence; a one-off must NOT flag.
  {
    id: 'R004',
    entries: [
      { date: '2026-01-15', item: 'back pain' },
      { date: '2026-02-20', item: 'back pain' },
      { date: '2026-03-25', item: 'nausea' },
    ],
  },
  // R005 — higher count (4x) proves counting beyond the threshold.
  {
    id: 'R005',
    entries: [
      { date: '2026-01-03', item: 'anxiety' },
      { date: '2026-01-31', item: 'anxiety' },
      { date: '2026-02-28', item: 'anxiety' },
      { date: '2026-03-30', item: 'anxiety' },
      { date: '2026-02-14', item: 'chest tightness' },
    ],
  },
  // R006 — v0 EXACT-MATCH LIMITATION. Three synonyms for one concept, each
  // once -> engine does NOT flag (v0). The v1 synonyms case, shown live.
  {
    id: 'R006',
    entries: [
      { date: '2026-01-09', item: 'poor sleep' },
      { date: '2026-02-11', item: 'insomnia' },
      { date: '2026-03-14', item: "can't sleep" },
    ],
  },
  // R007 — matching is LITERAL. Case and trailing whitespace make distinct
  // items under v0; v1 normalize merges them.
  {
    id: 'R007',
    entries: [
      { date: '2026-01-12', item: 'Hypertension' },
      { date: '2026-02-12', item: 'hypertension' },
      { date: '2026-03-12', item: 'hypertension ' },
    ],
  },
  // R008 — optional "tag" is carried but IGNORED; the item still flags.
  {
    id: 'R008',
    entries: [
      { date: '2026-01-18', item: 'medication review', tag: 'encounter:telehealth' },
      { date: '2026-02-22', item: 'medication review', tag: 'encounter:in-person' },
      { date: '2026-03-05', item: 'blood pressure check', tag: 'encounter:telehealth' },
    ],
  },
  // R009 — an undated occurrence is handled gracefully; the hit still surfaces
  // and the missing date shows as "(undated)" in provenance.
  {
    id: 'R009',
    entries: [
      { date: '2026-01-07', item: 'med refill: metformin' },
      { item: 'med refill: metformin' }, // no date
      { date: '2026-03-09', item: 'med refill: metformin' },
    ],
  },
  // R010 — dirty data. Null items, missing-field entries, and a non-object
  // entry are all skipped without crashing; the real 2x signal still surfaces.
  {
    id: 'R010',
    entries: [
      { date: '2026-01-11', item: 'edema' },
      { date: '2026-01-15' }, // no item -> skipped
      { date: '2026-02-11', item: null }, // null item -> skipped
      { date: '2026-02-13', item: 'edema' },
      'ignore-me-not-an-object', // wrong type -> skipped
    ],
  },
  // R011 — the care-coordination payoff: the same lab ordered 3x.
  {
    id: 'R011',
    entries: [
      { date: '2026-01-06', item: 'lab: A1C' },
      { date: '2026-02-09', item: 'lab: A1C' },
      { date: '2026-03-20', item: 'lab: A1C' },
    ],
  },
  // R012 — dense longitudinal record: one item recurs monthly across a year.
  {
    id: 'R012',
    entries: [
      { date: '2026-01-04', item: 'blood pressure elevated' },
      { date: '2026-02-04', item: 'blood pressure elevated' },
      { date: '2026-03-04', item: 'blood pressure elevated' },
      { date: '2026-04-04', item: 'blood pressure elevated' },
      { date: '2026-05-04', item: 'blood pressure elevated' },
      { date: '2026-06-04', item: 'blood pressure elevated' },
      { date: '2026-06-20', item: 'knee pain' },
      { date: '2026-07-04', item: 'blood pressure elevated' },
      { date: '2026-08-04', item: 'blood pressure elevated' },
      { date: '2026-09-04', item: 'blood pressure elevated' },
      { date: '2026-10-04', item: 'blood pressure elevated' },
      { date: '2026-10-15', item: 'flu shot' },
      { date: '2026-11-04', item: 'blood pressure elevated' },
      { date: '2026-12-04', item: 'blood pressure elevated' },
    ],
  },
  // R013 — domain-agnostic proof: the item is a social determinant, not a
  // symptom; recurrence detection works identically.
  {
    id: 'R013',
    entries: [
      { date: '2026-01-22', item: 'housing instability' },
      { date: '2026-02-26', item: 'housing instability' },
      { date: '2026-03-30', item: 'food insecurity' },
    ],
  },
  // R014 — v1 fuzzy/typo demo: one concept written three ways (typo + casing).
  // v0 surfaces NOTHING; v1 normalize + fuzzy merges all three.
  {
    id: 'R014',
    entries: [
      { date: '2026-01-05', item: 'blood pressure' },
      { date: '2026-02-05', item: 'blood presure' }, // typo
      { date: '2026-03-05', item: 'Blood Pressure' }, // casing
    ],
  },
  // R015 — GAP / re-emergence: "depression" goes quiet 243 days, then returns.
  {
    id: 'R015',
    entries: [
      { date: '2026-01-10', item: 'depression' },
      { date: '2026-09-10', item: 'depression' },
      { date: '2026-10-05', item: 'depression' },
    ],
  },
  // R016 — FREQUENCY / burst: "chest pain" clusters 3x within 19 days, then an
  // isolated visit 79 days later (also drives the cadence-change rule).
  {
    id: 'R016',
    entries: [
      { date: '2026-02-01', item: 'chest pain' },
      { date: '2026-02-10', item: 'chest pain' },
      { date: '2026-02-20', item: 'chest pain' },
      { date: '2026-05-10', item: 'chest pain' },
    ],
  },
  // R017 — CO-OCCURRENCE baseline: two items share the SAME date on two
  // distinct dates -> the pairing recurs -> co-occurrence flags (count 2).
  {
    id: 'R017',
    entries: [
      { date: '2026-01-10', item: 'knee pain' },
      { date: '2026-01-10', item: 'poor sleep' },
      { date: '2026-02-14', item: 'knee pain' },
      { date: '2026-02-14', item: 'poor sleep' },
    ],
  },
  // R018 — pair combinatorics: THREE items co-occur on two shared dates.
  {
    id: 'R018',
    entries: [
      { date: '2026-03-01', item: 'dizziness' },
      { date: '2026-03-01', item: 'fatigue' },
      { date: '2026-03-01', item: 'nausea' },
      { date: '2026-04-01', item: 'dizziness' },
      { date: '2026-04-01', item: 'fatigue' },
      { date: '2026-04-01', item: 'nausea' },
    ],
  },
  // R019 — negative control: both items recur, but never share a date.
  {
    id: 'R019',
    entries: [
      { date: '2026-01-05', item: 'cough' },
      { date: '2026-02-05', item: 'cough' },
      { date: '2026-01-20', item: 'rash' },
      { date: '2026-02-20', item: 'rash' },
    ],
  },
  // R020 — threshold control: two items share exactly ONE date -> below
  // min_count=2 -> co-occurrence does NOT flag.
  {
    id: 'R020',
    entries: [
      { date: '2026-01-12', item: 'edema' },
      { date: '2026-01-12', item: 'back pain' },
      { date: '2026-03-18', item: 'edema' },
      { date: '2026-03-22', item: 'back pain' },
    ],
  },
];

// The hand-written recurrence oracle (v0 exact match, min_count = 2): for each
// record, the items that SHOULD surface mapped to the exact dates cited.
export const ANSWER_KEY = {
  R001: { 'poor sleep': ['2026-01-05', '2026-02-10', '2026-03-12'] },
  R002: {
    'appetite change': ['2026-01-08', '2026-02-15'],
    fatigue: ['2026-02-02', '2026-03-01'],
  },
  R003: {},
  R004: { 'back pain': ['2026-01-15', '2026-02-20'] },
  R005: { anxiety: ['2026-01-03', '2026-01-31', '2026-02-28', '2026-03-30'] },
  R006: {}, // exact-match limitation: synonyms do not merge
  R007: {}, // literal matching: case/whitespace variants do not merge
  R008: { 'medication review': ['2026-01-18', '2026-02-22'] },
  R009: { 'med refill: metformin': ['', '2026-01-07', '2026-03-09'] },
  R010: { edema: ['2026-01-11', '2026-02-13'] },
  R011: { 'lab: A1C': ['2026-01-06', '2026-02-09', '2026-03-20'] },
  R012: {
    'blood pressure elevated': [
      '2026-01-04',
      '2026-02-04',
      '2026-03-04',
      '2026-04-04',
      '2026-05-04',
      '2026-06-04',
      '2026-07-04',
      '2026-08-04',
      '2026-09-04',
      '2026-10-04',
      '2026-11-04',
      '2026-12-04',
    ],
  },
  R013: { 'housing instability': ['2026-01-22', '2026-02-26'] },
  R014: {}, // v0 exact-match: typo + casing variants do not merge
  R015: { depression: ['2026-01-10', '2026-09-10', '2026-10-05'] },
  R016: { 'chest pain': ['2026-02-01', '2026-02-10', '2026-02-20', '2026-05-10'] },
  R017: {
    'knee pain': ['2026-01-10', '2026-02-14'],
    'poor sleep': ['2026-01-10', '2026-02-14'],
  },
  R018: {
    dizziness: ['2026-03-01', '2026-04-01'],
    fatigue: ['2026-03-01', '2026-04-01'],
    nausea: ['2026-03-01', '2026-04-01'],
  },
  R019: {
    cough: ['2026-01-05', '2026-02-05'],
    rash: ['2026-01-20', '2026-02-20'],
  },
  R020: {
    'back pain': ['2026-01-12', '2026-03-22'],
    edema: ['2026-01-12', '2026-03-18'],
  },
};

// Declared synonyms (the oracle's data, never inferred). Resolves R006 — true
// synonyms no string-similarity could catch (the words share no letters).
export const SYNONYMS = {
  insomnia: 'poor sleep',
  "can't sleep": 'poor sleep',
};

// The v1 recurrence oracle: normalize + SYNONYMS + fuzzyCutoff=0.85. Identical
// to ANSWER_KEY except the three records that only merge under v1: R006
// (synonyms), R007 (normalize), R014 (normalize + fuzzy typo).
export const ANSWER_KEY_V1 = {
  ...ANSWER_KEY,
  R006: { 'poor sleep': ['2026-01-09', '2026-02-11', '2026-03-14'] }, // synonyms
  R007: { Hypertension: ['2026-01-12', '2026-02-12', '2026-03-12'] }, // normalize
  R014: { 'blood pressure': ['2026-01-05', '2026-02-05', '2026-03-05'] }, // fuzzy
};

// GAP oracle at gapDays=90. Only R015 qualifies (243-day quiet stretch).
//   { recordId: [[item, gapDays, beforeDate, afterDate], ...] }
export const GAP_ANSWER_KEY = {
  R015: [['depression', 243, '2026-01-10', '2026-09-10']],
};

// FREQUENCY oracle at windowDays=30, minCount=3. Only R016 qualifies.
//   { recordId: [[item, count, windowStart, windowEnd, [dates]], ...] }
export const FREQUENCY_ANSWER_KEY = {
  R016: [['chest pain', 3, '2026-02-01', '2026-02-20', ['2026-02-01', '2026-02-10', '2026-02-20']]],
};

// CO-OCCURRENCE oracle at windowDays=0, minCount=2. R017 (one pair) and R018
// (three pairs). R019/R020 deliberately surface nothing.
//   { recordId: [[itemA, itemB, count, [sharedDates]], ...] }
export const CO_OCCURRENCE_ANSWER_KEY = {
  R017: [['knee pain', 'poor sleep', 2, ['2026-01-10', '2026-02-14']]],
  R018: [
    ['dizziness', 'fatigue', 2, ['2026-03-01', '2026-04-01']],
    ['dizziness', 'nausea', 2, ['2026-03-01', '2026-04-01']],
    ['fatigue', 'nausea', 2, ['2026-03-01', '2026-04-01']],
  ],
};

// Combined-report oracle (v0 defaults): for each record that surfaces anything,
// the (expert, item) findings in EXACT render order. Records that surface
// nothing at v0 (R003, R006, R007, R014) are ABSENT by design.
export const REPORT_ANSWER_KEY = {
  R001: [['recurrence', 'poor sleep']],
  R002: [
    ['recurrence', 'appetite change'],
    ['recurrence', 'fatigue'],
  ],
  R004: [['recurrence', 'back pain']],
  R005: [['recurrence', 'anxiety']],
  R008: [['recurrence', 'medication review']],
  R009: [['recurrence', 'med refill: metformin']],
  R010: [['recurrence', 'edema']],
  R011: [['recurrence', 'lab: A1C']],
  R012: [['recurrence', 'blood pressure elevated']],
  R013: [['recurrence', 'housing instability']],
  R015: [
    ['recurrence', 'depression'],
    ['gap', 'depression'],
  ],
  R016: [
    ['recurrence', 'chest pain'],
    ['frequency', 'chest pain'],
    ['cadence_change', 'chest pain'],
  ],
  R017: [
    ['recurrence', 'knee pain'],
    ['recurrence', 'poor sleep'],
    ['cooccurrence', 'knee pain + poor sleep'],
  ],
  R018: [
    ['recurrence', 'dizziness'],
    ['recurrence', 'fatigue'],
    ['recurrence', 'nausea'],
    ['cooccurrence', 'dizziness + fatigue'],
    ['cooccurrence', 'dizziness + nausea'],
    ['cooccurrence', 'fatigue + nausea'],
  ],
  R019: [
    ['recurrence', 'cough'],
    ['recurrence', 'rash'],
  ],
  R020: [
    ['recurrence', 'back pain'],
    ['recurrence', 'edema'],
  ],
};

// The v1 combined report: same opt-in matching. Identical to REPORT_ANSWER_KEY
// except R006/R007/R014 now surface a recurrence line.
export const REPORT_ANSWER_KEY_V1 = {
  R001: [['recurrence', 'poor sleep']],
  R002: [
    ['recurrence', 'appetite change'],
    ['recurrence', 'fatigue'],
  ],
  R004: [['recurrence', 'back pain']],
  R005: [['recurrence', 'anxiety']],
  R006: [['recurrence', 'poor sleep']], // v1: synonyms merge
  R007: [['recurrence', 'Hypertension']], // v1: normalize merges case/space
  R008: [['recurrence', 'medication review']],
  R009: [['recurrence', 'med refill: metformin']],
  R010: [['recurrence', 'edema']],
  R011: [['recurrence', 'lab: A1C']],
  R012: [['recurrence', 'blood pressure elevated']],
  R013: [['recurrence', 'housing instability']],
  R014: [['recurrence', 'blood pressure']], // v1: fuzzy merges the typo
  R015: [
    ['recurrence', 'depression'],
    ['gap', 'depression'],
  ],
  R016: [
    ['recurrence', 'chest pain'],
    ['frequency', 'chest pain'],
    ['cadence_change', 'chest pain'],
  ],
  R017: [
    ['recurrence', 'knee pain'],
    ['recurrence', 'poor sleep'],
    ['cooccurrence', 'knee pain + poor sleep'],
  ],
  R018: [
    ['recurrence', 'dizziness'],
    ['recurrence', 'fatigue'],
    ['recurrence', 'nausea'],
    ['cooccurrence', 'dizziness + fatigue'],
    ['cooccurrence', 'dizziness + nausea'],
    ['cooccurrence', 'fatigue + nausea'],
  ],
  R019: [
    ['recurrence', 'cough'],
    ['recurrence', 'rash'],
  ],
  R020: [
    ['recurrence', 'back pain'],
    ['recurrence', 'edema'],
  ],
};

// Cadence-change rule — a dedicated record set + oracle (kept separate from
// SAMPLE_RECORDS so the rule's test does not ripple the other keys).
export const CADENCE_CHANGE_RECORDS = [
  // RC1 — clean tightening: ~30-day spacing then ~7-day; pivot at the 4th visit.
  {
    id: 'RC1',
    entries: [
      { date: '2026-01-01', item: 'insulin' },
      { date: '2026-01-31', item: 'insulin' },
      { date: '2026-03-02', item: 'insulin' },
      { date: '2026-04-01', item: 'insulin' },
      { date: '2026-04-08', item: 'insulin' },
      { date: '2026-04-15', item: 'insulin' },
      { date: '2026-04-22', item: 'insulin' },
    ],
  },
  // RC2 — steady-cadence negative control: ~monthly throughout, no shift.
  {
    id: 'RC2',
    entries: [
      { date: '2026-01-05', item: 'checkup' },
      { date: '2026-02-05', item: 'checkup' },
      { date: '2026-03-05', item: 'checkup' },
      { date: '2026-04-05', item: 'checkup' },
      { date: '2026-05-05', item: 'checkup' },
      { date: '2026-06-05', item: 'checkup' },
    ],
  },
  // RC3 — too-few control: 3 dated + 1 undated (excluded) -> never long enough.
  {
    id: 'RC3',
    entries: [
      { date: '2026-01-01', item: 'review' },
      { item: 'review' }, // undated -> excluded
      { date: '2026-02-01', item: 'review' },
      { date: '2026-05-01', item: 'review' },
    ],
  },
];

// Cadence oracle. Only RC1 flags: ~30d -> ~7d at the 2026-04-01 pivot.
//   { recordId: [[item, beforeInterval, afterInterval, pivotDate, [dates]], ...] }
export const CADENCE_CHANGE_ANSWER_KEY = {
  RC1: [
    [
      'insulin',
      30,
      7,
      '2026-04-01',
      [
        '2026-01-01',
        '2026-01-31',
        '2026-03-02',
        '2026-04-01',
        '2026-04-08',
        '2026-04-15',
        '2026-04-22',
      ],
    ],
  ],
};
