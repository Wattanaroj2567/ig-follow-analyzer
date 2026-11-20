import { describe, expect, it } from 'vitest';
import { buildDemoAnalysisResult } from '../data/demoAnalysis';
import type { HistoryRecord } from '../types/analyzer';
import { getComparisonExports, getHistoryComparisonTargets } from './comparison';

function savedExport(
  id: string,
  ownerHandle: string,
  snapshotDateLabel: string,
  analyzedAtIso: string,
  saveAccounts = true,
): HistoryRecord {
  const analysis = {
    ...buildDemoAnalysisResult(),
    isDemoData: false,
    ownerHandle,
    sourceFileName: `instagram-${ownerHandle}-${id}.zip`,
    analyzedAtIso,
    snapshotDateLabel,
  };
  return {
    id,
    ownerHandle,
    sourceFileName: analysis.sourceFileName,
    analyzedAtIso,
    snapshotDateLabel,
    counts: analysis.counts,
    savedAnalysis: saveAccounts ? analysis : undefined,
  };
}

describe('Saved exports for comparison', () => {
  it('orders matching exports by export date then analysis time and excludes ineligible files', () => {
    const owner = 'demo.owner';
    const current = savedExport('current', owner, '19 พ.ย. 2569', '2026-11-20T17:00:00.000Z');
    const records = [
      current,
      savedExport('older-analyzed-later', owner, '19 ต.ค. 2569', '2026-11-21T12:00:00.000Z'),
      savedExport('same-day-morning', owner, '19 พ.ย. 2569', '2026-11-20T08:00:00.000Z'),
      savedExport('same-day-evening', owner, '19 พ.ย. 2569', '2026-11-20T16:00:00.000Z'),
      savedExport('another-owner', 'another.demo', '19 พ.ย. 2569', '2026-11-20T16:20:00.000Z'),
      savedExport('summary-only', owner, '19 พ.ย. 2569', '2026-11-20T16:30:00.000Z', false),
    ];
    const latest = getComparisonExports(current.savedAnalysis!, records, []);
    expect(latest.isLatest).toBe(true);
    expect(latest.earlier.map(({ id }) => id)).toEqual([
      'same-day-evening',
      'same-day-morning',
      'older-analyzed-later',
    ]);

    const older = getComparisonExports(records[2].savedAnalysis!, records, []);
    expect(older.isLatest).toBe(false);
    expect(older.earlier.map(({ id }) => id)).toEqual(['older-analyzed-later']);
  });

  it('requires a verifiable owner for real comparisons and keeps sample exports separate', () => {
    const current = savedExport(
      'current',
      'demo.owner',
      '19 พ.ย. 2569',
      '2026-11-20T12:00:00.000Z',
    );
    const earlier = savedExport(
      'earlier',
      'demo.owner',
      '19 ต.ค. 2569',
      '2026-10-20T12:00:00.000Z',
    );
    const sample = { ...earlier.savedAnalysis!, isDemoData: true };
    expect(getComparisonExports(current.savedAnalysis!, [current], [sample]).earlier).toEqual([]);
    const renamed = {
      ...current.savedAnalysis!,
      sourceFileName: 'renamed.zip',
      ownerHandle: undefined,
    };
    expect(getComparisonExports(renamed, [earlier], []).earlier).toEqual([]);
  });

  it('opens history PDFs only when the earlier and latest exports for the same owner have lists', () => {
    const owner = 'demo.owner';
    const earlier = savedExport('earlier', owner, '19 ต.ค. 2569', '2026-11-21T12:00:00.000Z');
    const latest = savedExport('latest', owner, '19 พ.ย. 2569', '2026-11-20T12:00:00.000Z');
    const summary = savedExport(
      'summary',
      owner,
      '19 ก.ย. 2569',
      '2026-09-19T12:00:00.000Z',
      false,
    );
    const other = savedExport('other', 'another.demo', '20 พ.ย. 2569', '2026-11-21T12:00:00.000Z');
    const records = [earlier, latest, summary, other];

    expect([...getHistoryComparisonTargets(records).entries()]).toEqual([
      ['earlier', { id: latest.id, analysis: latest.savedAnalysis, ownerHandle: owner }],
    ]);

    const latestSummary = savedExport(
      'newest',
      owner,
      '20 พ.ย. 2569',
      '2026-11-20T12:00:00.000Z',
      false,
    );
    expect(getHistoryComparisonTargets([...records, latestSummary]).size).toBe(0);
  });
});
