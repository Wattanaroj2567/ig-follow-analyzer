import { describe, expect, it } from 'vitest';
import { buildDemoAnalysisResult } from '../data/demoAnalysis';
import type { HistoryRecord } from '../types/analyzer';
import {
  getComparisonExports,
  getFollowerComparisonRisk,
  getLargeFollowerDrop,
} from './comparison';

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
  it.each([
    { previous: 100, current: 70, expected: 0.3 },
    { previous: 100, current: 71, expected: null },
    { previous: 9, current: 0, expected: null },
    { previous: 10, current: 0, expected: 1 },
    { previous: 0, current: 0, expected: null },
    { previous: 100, current: 101, expected: null },
  ])('checks the drop from $previous to $current', ({ previous, current, expected }) => {
    expect(getLargeFollowerDrop(previous, current)).toBe(expected);
  });

  it('warns about large changes in both directions even when the net count is unchanged', () => {
    const accounts = (count: number) => Array.from({ length: count }, (_, i) => `sample_${i}`);
    const diff = { followersDelta: 0, recentUnfollowers: accounts(30), newFollowers: accounts(30) };
    expect(getFollowerComparisonRisk(100, diff)).toEqual({
      kind: 'turnover',
      missing: 30,
      added: 30,
    });
    expect(getFollowerComparisonRisk(101, diff)).toBeNull();
    expect(
      getFollowerComparisonRisk(9, {
        ...diff,
        recentUnfollowers: accounts(9),
        newFollowers: accounts(9),
      }),
    ).toBeNull();
  });

  it('skips byte-identical imports but keeps older exports with different data', () => {
    const hash = 'a'.repeat(64);
    const earlier = savedExport('earlier', 'fictitious', '18 พ.ย. 2569', '2026-11-18T05:00:00Z');
    const duplicate = savedExport(
      'duplicate',
      'fictitious',
      '19 พ.ย. 2569',
      '2026-11-19T05:00:00Z',
    );
    duplicate.savedAnalysis!.archiveSha256 = hash;
    const current = savedExport('current', 'fictitious', '21 พ.ย. 2569', '2026-11-21T05:00:00Z');
    current.savedAnalysis!.archiveSha256 = hash;
    expect(
      getComparisonExports(current.savedAnalysis!, [earlier, duplicate], []).earlier.map(
        (x) => x.id,
      ),
    ).toEqual(['earlier']);
  });

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
});
