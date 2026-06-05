import { describe, it, expect } from 'vitest';
import {
  detectRecurrence,
  detectGap,
  detectFrequency,
  detectCooccurrence,
  detectCadenceChange,
  runReport,
  formatReport,
} from '../src/recurrence.js';
import {
  SAMPLE_RECORDS,
  SYNONYMS,
  ANSWER_KEY,
  ANSWER_KEY_V1,
  GAP_ANSWER_KEY,
  FREQUENCY_ANSWER_KEY,
  CO_OCCURRENCE_ANSWER_KEY,
  REPORT_ANSWER_KEY,
  REPORT_ANSWER_KEY_V1,
  CADENCE_CHANGE_RECORDS,
  CADENCE_CHANGE_ANSWER_KEY,
} from '../src/recurrenceData.js';

// Shape detectRecurrence hits into {recordId: {item: [dates]}} for key compare.
function recurrenceShape(hits) {
  const out = {};
  for (const id of new Set(SAMPLE_RECORDS.map((r) => r.id))) out[id] = {};
  for (const h of hits) out[h.recordId][h.item] = h.dates;
  return out;
}

// The six required spec cases — a direct port of recurrence.py's self-test.
describe('recurrence self-test (the six spec cases)', () => {
  it('1. item recurs 3 times -> caught, count 3, all 3 dates', () => {
    const hits = detectRecurrence([
      {
        id: 'R001',
        entries: [
          { date: '2026-01-10', item: 'poor sleep' },
          { date: '2026-02-02', item: 'poor sleep' },
          { date: '2026-03-15', item: 'poor sleep' },
        ],
      },
    ]);
    expect(hits).toHaveLength(1);
    expect(hits[0].count).toBe(3);
    expect(hits[0].item).toBe('poor sleep');
    expect(hits[0].dates).toEqual(['2026-01-10', '2026-02-02', '2026-03-15']);
  });

  it('2. single occurrence -> NOT flagged', () => {
    const hits = detectRecurrence([
      { id: 'R002', entries: [{ date: '2026-01-10', item: 'headache' }] },
    ]);
    expect(hits).toEqual([]);
  });

  it('3. nothing recurring -> empty, zero false positives', () => {
    const hits = detectRecurrence([
      {
        id: 'R003',
        entries: [
          { date: '2026-01-10', item: 'cough' },
          { date: '2026-02-02', item: 'rash' },
          { date: '2026-03-15', item: 'fatigue' },
        ],
      },
    ]);
    expect(hits).toEqual([]);
  });

  it('4. two different items each recur -> both caught independently', () => {
    const hits = detectRecurrence([
      {
        id: 'R004',
        entries: [
          { date: '2026-01-10', item: 'poor sleep' },
          { date: '2026-02-02', item: 'poor sleep' },
          { date: '2026-02-20', item: 'appetite change' },
          { date: '2026-03-01', item: 'appetite change' },
        ],
      },
    ]);
    const byItem = Object.fromEntries(hits.map((h) => [h.item, h]));
    expect(hits).toHaveLength(2);
    expect(byItem['poor sleep'].count).toBe(2);
    expect(byItem['appetite change'].count).toBe(2);
  });

  it('5. malformed records -> handled gracefully, no crash, no false hit', () => {
    const hits = detectRecurrence([
      { id: 'R005', entries: [] },
      { id: 'R006' },
      { id: 'R007', entries: [{ date: '2026-01-10' }, { item: null }] },
      {},
    ]);
    expect(hits).toEqual([]);
  });

  it('6. minCount respected (3 -> a 2x item does NOT flag)', () => {
    const hits = detectRecurrence(
      [
        {
          id: 'R008',
          entries: [
            { date: '2026-01-10', item: 'poor sleep' },
            { date: '2026-02-02', item: 'poor sleep' },
          ],
        },
      ],
      { minCount: 3 },
    );
    expect(hits).toEqual([]);
  });
});

describe('recurrence over SAMPLE_RECORDS matches the hand-written oracle', () => {
  it('v0 exact match == ANSWER_KEY', () => {
    expect(recurrenceShape(detectRecurrence(SAMPLE_RECORDS))).toEqual(ANSWER_KEY);
  });

  it('v1 (normalize + synonyms + fuzzy 0.85) == ANSWER_KEY_V1', () => {
    const hits = detectRecurrence(SAMPLE_RECORDS, {
      normalize: true,
      synonyms: SYNONYMS,
      fuzzyCutoff: 0.85,
    });
    expect(recurrenceShape(hits)).toEqual(ANSWER_KEY_V1);
  });
});

describe('gap rule matches the oracle', () => {
  it('detectGap(SAMPLE_RECORDS) == GAP_ANSWER_KEY', () => {
    const hits = detectGap(SAMPLE_RECORDS);
    const out = {};
    for (const h of hits) {
      (out[h.recordId] ||= []).push([h.item, h.gapDays, h.beforeDate, h.afterDate]);
    }
    expect(out).toEqual(GAP_ANSWER_KEY);
  });
});

describe('frequency rule matches the oracle', () => {
  it('detectFrequency(SAMPLE_RECORDS) == FREQUENCY_ANSWER_KEY', () => {
    const hits = detectFrequency(SAMPLE_RECORDS);
    const out = {};
    for (const h of hits) {
      (out[h.recordId] ||= []).push([h.item, h.count, h.windowStart, h.windowEnd, h.dates]);
    }
    expect(out).toEqual(FREQUENCY_ANSWER_KEY);
  });
});

describe('co-occurrence rule matches the oracle', () => {
  it('detectCooccurrence(SAMPLE_RECORDS) == CO_OCCURRENCE_ANSWER_KEY', () => {
    const hits = detectCooccurrence(SAMPLE_RECORDS);
    const out = {};
    for (const h of hits) {
      (out[h.recordId] ||= []).push([h.itemA, h.itemB, h.count, h.dates]);
    }
    expect(out).toEqual(CO_OCCURRENCE_ANSWER_KEY);
  });
});

describe('cadence-change rule matches the oracle', () => {
  it('detectCadenceChange(CADENCE_CHANGE_RECORDS) == CADENCE_CHANGE_ANSWER_KEY', () => {
    const hits = detectCadenceChange(CADENCE_CHANGE_RECORDS);
    const out = {};
    for (const h of hits) {
      (out[h.recordId] ||= []).push([
        h.item,
        h.beforeInterval,
        h.afterInterval,
        h.pivotDate,
        h.dates,
      ]);
    }
    expect(out).toEqual(CADENCE_CHANGE_ANSWER_KEY);
  });
});

// Shape a report into {recordId: [[expert, item], ...]} for ordered compare.
function reportShape(reports) {
  const out = {};
  for (const r of reports) out[r.recordId] = r.findings.map((f) => [f.expert, f.hit.item]);
  return out;
}

describe('combined report (router) matches the oracle, in render order', () => {
  it('v0 == REPORT_ANSWER_KEY', () => {
    expect(reportShape(runReport(SAMPLE_RECORDS))).toEqual(REPORT_ANSWER_KEY);
  });

  it('v1 == REPORT_ANSWER_KEY_V1', () => {
    const reports = runReport(SAMPLE_RECORDS, {
      normalize: true,
      synonyms: SYNONYMS,
      fuzzyCutoff: 0.85,
    });
    expect(reportShape(reports)).toEqual(REPORT_ANSWER_KEY_V1);
  });

  it('formatReport renders the librarian lines (provenance, never interpretation)', () => {
    const text = formatReport(runReport(SAMPLE_RECORDS));
    expect(text).toContain('Record R016:');
    expect(text).toContain('[cadence_change] "chest pain" interval changed from ~10d to ~79d');
    expect(text).toContain('[cooccurrence] "knee pain" + "poor sleep" co-occurred 2 times');
    // firewall: no scoring / ranking / diagnosis language ever appears
    expect(text).not.toMatch(/risk|severe|concern|worsening|caution/i);
  });
});
