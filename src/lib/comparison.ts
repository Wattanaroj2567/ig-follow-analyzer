import type { AnalysisResult, HistoryDiff, HistoryRecord } from '../types/analyzer';
import { parseSnapshotDate } from './dates';
import { extractOwnerHandleFromFileName } from './igParser';

export interface ComparisonExport {
  id: string;
  analysis: AnalysisResult;
  ownerHandle?: string;
}

export function getLargeFollowerDrop(previousCount: number, currentCount: number): number | null {
  if (previousCount <= 0) return null;
  const missingCount = previousCount - currentCount;
  const fraction = missingCount / previousCount;
  return missingCount >= 10 && fraction >= 0.3 ? fraction : null;
}

export function getFollowerComparisonRisk(
  currentCount: number,
  diff: Pick<HistoryDiff, 'followersDelta' | 'recentUnfollowers' | 'newFollowers'>,
) {
  const previousCount = currentCount - diff.followersDelta;
  const drop = getLargeFollowerDrop(previousCount, currentCount);
  if (drop !== null) return { kind: 'drop' as const, fraction: drop };

  const missing = diff.recentUnfollowers.length;
  const added = diff.newFollowers.length;
  if (
    getLargeFollowerDrop(previousCount, previousCount - missing) !== null &&
    getLargeFollowerDrop(currentCount, currentCount - added) !== null
  ) {
    return { kind: 'turnover' as const, missing, added };
  }
  return null;
}

type ExportDate = Pick<AnalysisResult, 'snapshotDateLabel' | 'analyzedAtIso'>;

function exportOrder(file: ExportDate) {
  const date = parseSnapshotDate(file.snapshotDateLabel) ?? new Date(file.analyzedAtIso);
  return { day: date.setHours(0, 0, 0, 0), analyzedAtIso: file.analyzedAtIso };
}

type ExportOrder = ReturnType<typeof exportOrder>;

function compareExportOrder(a: ExportOrder, b: ExportOrder): number {
  return a.day - b.day || a.analyzedAtIso.localeCompare(b.analyzedAtIso);
}

function historyOwner(record: HistoryRecord): string | undefined {
  return (
    record.savedAnalysis?.ownerHandle ??
    record.ownerHandle ??
    extractOwnerHandleFromFileName(record.sourceFileName)
  );
}

export function getComparisonExports(
  current: AnalysisResult,
  records: HistoryRecord[],
  samples: AnalysisResult[],
) {
  const ownerHandle = current.ownerHandle ?? extractOwnerHandleFromFileName(current.sourceFileName);
  const candidates: ComparisonExport[] = current.isDemoData
    ? samples.map((analysis) => ({ id: analysis.sourceFileName, analysis }))
    : records.flatMap((record) => {
        const { savedAnalysis, id } = record;
        const savedOwner = historyOwner(record);
        const sameArchive =
          current.archiveSha256 && current.archiveSha256 === savedAnalysis?.archiveSha256;
        return savedAnalysis &&
          !savedAnalysis.isDemoData &&
          !sameArchive &&
          ownerHandle &&
          savedOwner === ownerHandle
          ? [{ id, analysis: savedAnalysis, ownerHandle: savedOwner }]
          : [];
      });

  const currentOrder = exportOrder(current);
  const byDate = candidates
    .map((file) => ({ file, order: exportOrder(file.analysis) }))
    .sort((a, b) => compareExportOrder(b.order, a.order));

  return {
    isLatest: !byDate.some(({ order }) => compareExportOrder(order, currentOrder) > 0),
    earlier: byDate
      .filter(({ order }) => compareExportOrder(order, currentOrder) < 0)
      .map(({ file }) => file),
  };
}
