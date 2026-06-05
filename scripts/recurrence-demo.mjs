// recurrence-demo.mjs — mirrors Health-Prototype's `python recurrence.py
// --report`. Runs all five surfacing rules over the sample records and prints
// the combined, provenance-cited per-record report. Pass --v1 for the opt-in
// matching layers (normalize + declared synonyms + fuzzy).
//
//   node scripts/recurrence-demo.mjs        # v0 exact match
//   node scripts/recurrence-demo.mjs --v1   # normalize + synonyms + fuzzy 0.85

import { runReport, formatReport } from '../src/recurrence.js';
import { SAMPLE_RECORDS, SYNONYMS } from '../src/recurrenceData.js';

const v1 = process.argv.includes('--v1');
const opts = v1 ? { normalize: true, synonyms: SYNONYMS, fuzzyCutoff: 0.85 } : {};

const reports = runReport(SAMPLE_RECORDS, opts);
console.log(reports.length ? formatReport(reports) : 'No findings surfaced across the records.');
