import type { AnalysisResult, HistoryRecord } from '../types/analyzer';
import { parseSnapshotDate } from './dates';
import { extractOwnerHandleFromFileName } from './igParser';

export interface ComparisonExport {
  id: string;
  analysis: AnalysisResult;
  ownerHandle?: string;
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

export function getHistoryComparisonTargets(records: HistoryRecord[]) {
  const exports = records.flatMap((record) => {
    const owner = historyOwner(record);
    return owner && !record.savedAnalysis?.isDemoData
      ? [{ record, owner, order: exportOrder(record.savedAnalysis ?? record) }]
      : [];
  });
  const latestByOwner = new Map<string, (typeof exports)[number]>();
  for (const entry of exports) {
    const { owner, order } = entry;
    const latest = latestByOwner.get(owner);
    if (!latest || compareExportOrder(order, latest.order) > 0) latestByOwner.set(owner, entry);
  }

  const targets = new Map<string, ComparisonExport>();
  for (const { owner, order, record } of exports) {
    const latest = latestByOwner.get(owner);
    if (
      record.savedAnalysis &&
      latest?.record.savedAnalysis &&
      compareExportOrder(latest.order, order) > 0
    ) {
      targets.set(record.id, {
        id: latest.record.id,
        analysis: latest.record.savedAnalysis,
        ownerHandle: owner,
      });
    }
  }
  return targets;
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
        return savedAnalysis &&
          !savedAnalysis.isDemoData &&
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
