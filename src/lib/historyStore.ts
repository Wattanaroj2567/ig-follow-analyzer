import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AnalysisResult,
  HistoryPreferences,
  HistoryRecord,
  LatestHandleSnapshot,
} from '../types/analyzer';
import { extractOwnerHandleFromFileName } from './igParser';

interface AnalyzerDbSchema extends DBSchema {
  preferences: {
    key: 'prefs';
    value: HistoryPreferences;
  };
  records: {
    key: string;
    value: HistoryRecord;
  };
  snapshots: {
    key: string;
    value: LatestHandleSnapshot;
  };
}

const DB_NAME = 'ig-follow-analyzer-local-db';
const DB_VERSION = 1;
const LEGACY_DEMO_FILENAME = 'instagram-demo-2026-11-19.zip';

export const DEFAULT_HISTORY_PREFERENCES: HistoryPreferences = {
  tier1SummaryOptIn: false,
  tier2HandlesOptIn: false,
};

let dbPromise: Promise<IDBPDatabase<AnalyzerDbSchema>> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function getSnapshotKey(ownerHandle?: string): string {
  return ownerHandle ? `account:${ownerHandle}` : 'latest';
}

export function buildHandleSnapshot(
  result: AnalysisResult,
  ownerHandle?: string,
): LatestHandleSnapshot {
  const followerTimestamps: [string, number][] = [];
  for (const entry of result.followers) {
    const timestamp = entry.followedUsAt ?? entry.timestamp;
    if (timestamp !== undefined) followerTimestamps.push([entry.handle, timestamp]);
  }
  return {
    id: getSnapshotKey(ownerHandle),
    ownerHandle,
    analyzedAtIso: result.analyzedAtIso,
    snapshotDateLabel: result.snapshotDateLabel,
    sourceFileName: result.sourceFileName,
    counts: result.counts,
    followerHandles: result.followers.map((entry) => entry.handle),
    followerTimestamps: Object.fromEntries(followerTimestamps),
  };
}

function isLegacyDemoRecord(rec: HistoryRecord): boolean {
  return Boolean(rec.savedAnalysis?.isDemoData || rec.sourceFileName === LEGACY_DEMO_FILENAME);
}

function getDb(): Promise<IDBPDatabase<AnalyzerDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AnalyzerDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences');
        }
        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots');
        }
      },
    });
  }
  return dbPromise;
}

export async function loadHistoryPreferences(): Promise<HistoryPreferences> {
  if (!isIndexedDbSupported()) return { ...DEFAULT_HISTORY_PREFERENCES };
  try {
    const db = await getDb();
    const prefs = await db.get('preferences', 'prefs');
    return prefs ?? { ...DEFAULT_HISTORY_PREFERENCES };
  } catch {
    return { ...DEFAULT_HISTORY_PREFERENCES };
  }
}

export async function saveHistoryPreferences(prefs: HistoryPreferences): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getDb();
  const sanitized: HistoryPreferences = {
    tier1SummaryOptIn: prefs.tier1SummaryOptIn,
    tier2HandlesOptIn: prefs.tier1SummaryOptIn ? prefs.tier2HandlesOptIn : false,
  };
  await db.put('preferences', sanitized, 'prefs');

  // If user revokes Tier 2 consent, immediately wipe all stored follower snapshots and saved account lists
  if (!sanitized.tier2HandlesOptIn) {
    await db.clear('snapshots');
    const records = await db.getAll('records');
    const withAnalysis = records.filter((rec) => Boolean(rec.savedAnalysis));
    if (withAnalysis.length > 0) {
      const tx = db.transaction('records', 'readwrite');
      await Promise.all([
        ...withAnalysis.map((rec) => {
          const rest: HistoryRecord = {
            id: rec.id,
            ownerHandle: rec.ownerHandle,
            analyzedAtIso: rec.analyzedAtIso,
            snapshotDateLabel: rec.snapshotDateLabel,
            sourceFileName: rec.sourceFileName,
            sourceFileSize: rec.sourceFileSize ?? rec.savedAnalysis?.sourceFileSize,
            counts: rec.counts,
            pdfSavedTo: rec.pdfSavedTo,
            pdfFileName: rec.pdfFileName,
          };
          return tx.store.put(rest);
        }),
        tx.done,
      ]);
    }
  }
}

export async function listHistoryRecords(): Promise<HistoryRecord[]> {
  if (!isIndexedDbSupported()) return [];
  try {
    const db = await getDb();
    const all = await db.getAll('records');

    // Auto-purge any legacy demo records persisted before demo-isolation guard
    const demoRecords = all.filter(isLegacyDemoRecord);
    if (demoRecords.length > 0) {
      const tx = db.transaction('records', 'readwrite');
      await Promise.all([...demoRecords.map((rec) => tx.store.delete(rec.id)), tx.done]);
    }

    return all
      .filter((rec) => !isLegacyDemoRecord(rec))
      .map((rec) => ({
        ...rec,
        ownerHandle: rec.ownerHandle ?? extractOwnerHandleFromFileName(rec.sourceFileName),
        sourceFileSize: rec.sourceFileSize ?? rec.savedAnalysis?.sourceFileSize,
      }))
      .sort((a, b) => b.analyzedAtIso.localeCompare(a.analyzedAtIso));
  } catch {
    return [];
  }
}

export async function persistAnalysisIfConsented(
  result: AnalysisResult,
  prefs: HistoryPreferences,
  pdfInfo?: { savedTo: 'device' | 'google_drive'; fileName: string },
): Promise<HistoryRecord | null> {
  // Never mix sandbox demo data into the user's real local history
  if (!isIndexedDbSupported() || !prefs.tier1SummaryOptIn || result.isDemoData) return null;

  const db = await getDb();
  const existingRecords = await db.getAll('records');
  const existing = existingRecords.find(
    (rec) =>
      rec.analyzedAtIso === result.analyzedAtIso && rec.sourceFileName === result.sourceFileName,
  );

  const ownerHandle = result.ownerHandle ?? extractOwnerHandleFromFileName(result.sourceFileName);

  const record: HistoryRecord = {
    id: existing?.id ?? `run-${Date.now()}`,
    ownerHandle,
    analyzedAtIso: result.analyzedAtIso,
    snapshotDateLabel: result.snapshotDateLabel,
    sourceFileName: result.sourceFileName,
    sourceFileSize: result.sourceFileSize,
    counts: result.counts,
    pdfSavedTo: pdfInfo?.savedTo ?? existing?.pdfSavedTo ?? 'none',
    pdfFileName: pdfInfo?.fileName ?? existing?.pdfFileName,
    ...(prefs.tier2HandlesOptIn ? { savedAnalysis: result } : {}),
  };

  await db.put('records', record);

  if (prefs.tier2HandlesOptIn) {
    const snapshot = buildHandleSnapshot(result, ownerHandle);
    await db.put('snapshots', snapshot, snapshot.id);
  }

  return record;
}

export async function syncTier2SnapshotForRecord(
  result: AnalysisResult,
  recordId: string | null,
): Promise<void> {
  if (!isIndexedDbSupported() || result.isDemoData) return;
  const db = await getDb();

  const ownerHandle = result.ownerHandle ?? extractOwnerHandleFromFileName(result.sourceFileName);
  const snapshot = buildHandleSnapshot(result, ownerHandle);
  await db.put('snapshots', snapshot, snapshot.id);

  if (recordId) {
    const existing = await db.get('records', recordId);
    if (existing) {
      await db.put('records', { ...existing, ownerHandle, savedAnalysis: result });
    }
  }
}

export async function updateHistoryRecordPdfStatus(
  recordId: string,
  savedTo: 'device' | 'google_drive',
  pdfFileName: string,
): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getDb();
  const existing = await db.get('records', recordId);
  if (!existing) return;
  await db.put('records', { ...existing, pdfSavedTo: savedTo, pdfFileName });
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getDb();
  await db.delete('records', id);
}

export async function clearAllHistory(): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getDb();
  const tx = db.transaction(['preferences', 'records', 'snapshots'], 'readwrite');
  await Promise.all([
    tx.objectStore('records').clear(),
    tx.objectStore('snapshots').clear(),
    tx.objectStore('preferences').put({ ...DEFAULT_HISTORY_PREFERENCES }, 'prefs'),
    tx.done,
  ]);
}
