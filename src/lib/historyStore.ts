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
    indexes: {
      'by-result': [string, string];
      'by-archive': [string, string];
    };
  };
}

const DB_NAME = 'ig-follow-analyzer-local-db';
const DB_VERSION = 3;
const LEGACY_DEMO_FILENAME = 'instagram-demo-2026-11-19.zip';

export const DEFAULT_HISTORY_PREFERENCES: HistoryPreferences = {
  revision: 0,
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

function summaryOnly(record: HistoryRecord): HistoryRecord {
  const { savedAnalysis, ...summary } = record;
  return { ...summary, sourceFileSize: summary.sourceFileSize ?? savedAnalysis?.sourceFileSize };
}

function getDb(): Promise<IDBPDatabase<AnalyzerDbSchema>> {
  if (!dbPromise) {
    const opened = new Promise<IDBPDatabase<AnalyzerDbSchema>>((resolve, reject) => {
      let blocked = false;
      void openDB<AnalyzerDbSchema>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, _newVersion, tx) {
          if (oldVersion === 0) {
            db.createObjectStore('preferences');
            db.createObjectStore('records', { keyPath: 'id' });
          }
          const records = tx.objectStore('records');
          if (oldVersion < 2) records.createIndex('by-result', ['analyzedAtIso', 'sourceFileName']);
          records.createIndex('by-archive', ['sourceFileName', 'savedAnalysis.archiveSha256']);
          if (oldVersion !== 1) return;

          // The v1 snapshots duplicated names already in records and had no readers.
          const legacyDb = db as IDBPDatabase;
          if (legacyDb.objectStoreNames.contains('snapshots'))
            legacyDb.deleteObjectStore('snapshots');
          void (async () => {
            const prefs = await tx.objectStore('preferences').get('prefs');
            for (
              let cursor = await records.openCursor();
              cursor;
              cursor = await cursor.continue()
            ) {
              if (isLegacyDemoRecord(cursor.value)) {
                await cursor.delete();
              } else if (
                !(prefs?.tier1SummaryOptIn && prefs.tier2HandlesOptIn) &&
                cursor.value.savedAnalysis
              ) {
                await cursor.update(summaryOnly(cursor.value));
              }
            }
          })().catch(() => {
            // Any failed request aborts the upgrade transaction.
          });
        },
        blocked() {
          blocked = true;
          reject(new Error('History upgrade is blocked by another tab'));
        },
        blocking(_currentVersion, _blockedVersion, event) {
          (event.target as IDBDatabase).close();
          dbPromise = null;
        },
        terminated() {
          dbPromise = null;
        },
      }).then((db) => {
        if (blocked) db.close();
        else resolve(db);
      }, reject);
    });
    dbPromise = opened.catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function loadHistoryState() {
  const empty = { prefs: DEFAULT_HISTORY_PREFERENCES, records: [] as HistoryRecord[] };
  if (!isIndexedDbSupported()) return empty;
  try {
    const db = await getDb();
    const tx = db.transaction(['preferences', 'records']);
    const [storedPrefs, all] = await Promise.all([
      tx.objectStore('preferences').get('prefs'),
      tx.objectStore('records').getAll(),
      tx.done,
    ]);
    const prefs = storedPrefs ?? DEFAULT_HISTORY_PREFERENCES;
    const records = all
      .filter((record) => !isLegacyDemoRecord(record))
      .map((record) => ({
        ...(prefs.tier1SummaryOptIn && prefs.tier2HandlesOptIn ? record : summaryOnly(record)),
        ownerHandle: record.ownerHandle ?? extractOwnerHandleFromFileName(record.sourceFileName),
        sourceFileSize: record.sourceFileSize ?? record.savedAnalysis?.sourceFileSize,
      }))
      .sort((a, b) => b.analyzedAtIso.localeCompare(a.analyzedAtIso));
    return { prefs, records };
  } catch {
    return empty;
  }
}

class HistoryConflictError extends Error {
  constructor() {
    super('History preferences changed in another operation');
    this.name = 'HistoryConflictError';
  }
}

async function writeHistoryPreferences(prefs: HistoryPreferences): Promise<HistoryPreferences> {
  const db = await getDb();
  const tx = db.transaction(['preferences', 'records'], 'readwrite');
  const store = tx.objectStore('preferences');
  const current = await store.get('prefs');
  const revision = current?.revision ?? 0;
  // A caller that passes a revision is asserting the consent it saw; omitting it applies to the latest state.
  if (prefs.revision !== undefined && prefs.revision !== revision) {
    await tx.done;
    throw new HistoryConflictError();
  }
  const next: HistoryPreferences = {
    revision: revision + 1,
    tier1SummaryOptIn: prefs.tier1SummaryOptIn,
    tier2HandlesOptIn: prefs.tier1SummaryOptIn && prefs.tier2HandlesOptIn,
  };
  await store.put(next, 'prefs');
  if (!next.tier2HandlesOptIn) {
    const records = tx.objectStore('records');
    for (let cursor = await records.openCursor(); cursor; cursor = await cursor.continue()) {
      if (cursor.value.savedAnalysis) await cursor.update(summaryOnly(cursor.value));
    }
  }
  await tx.done;
  return next;
}

export async function saveHistoryPreferences(
  prefs: HistoryPreferences,
): Promise<HistoryPreferences> {
  try {
    return await writeHistoryPreferences(prefs);
  } catch (error) {
    if (!(error instanceof HistoryConflictError)) throw error;
    // Another tab saved first. Apply the same choice to the latest revision instead of failing the toggle.
    return writeHistoryPreferences({ ...prefs, revision: undefined });
  }
}

export async function persistAnalysisIfConsented(
  result: AnalysisResult,
  prefs: HistoryPreferences,
  recordId?: string,
): Promise<HistoryRecord | null> {
  if (!isIndexedDbSupported() || !prefs.tier1SummaryOptIn || result.isDemoData) return null;

  const db = await getDb();
  const tx = db.transaction(['preferences', 'records'], 'readwrite');
  const stored = await tx.objectStore('preferences').get('prefs');
  if (!stored?.tier1SummaryOptIn || (stored.revision ?? 0) !== (prefs.revision ?? 0)) {
    await tx.done;
    return null;
  }

  const records = tx.objectStore('records');
  const matchesResult = (record: HistoryRecord) =>
    record.analyzedAtIso === result.analyzedAtIso &&
    record.sourceFileName === result.sourceFileName;
  const duplicate =
    !recordId && stored.tier2HandlesOptIn && prefs.tier2HandlesOptIn && result.archiveSha256
      ? await records.index('by-archive').get([result.sourceFileName, result.archiveSha256])
      : undefined;
  // Preserve the original analysis date and PDF metadata for a byte-identical reupload.
  if (duplicate) {
    await tx.done;
    return duplicate;
  }

  const candidate = recordId
    ? await records.get(recordId)
    : await records.index('by-result').get([result.analyzedAtIso, result.sourceFileName]);
  const oldDigest = candidate?.savedAnalysis?.archiveSha256;
  const existing =
    oldDigest && result.archiveSha256 && oldDigest !== result.archiveSha256 ? undefined : candidate;
  // Upgrading a specific record must not resurrect it after a concurrent deletion.
  if (recordId && (!existing || !matchesResult(existing))) {
    await tx.done;
    return null;
  }

  const record: HistoryRecord = {
    id: existing?.id ?? `run-${crypto.randomUUID()}`,
    ownerHandle: result.ownerHandle ?? extractOwnerHandleFromFileName(result.sourceFileName),
    analyzedAtIso: result.analyzedAtIso,
    snapshotDateLabel: result.snapshotDateLabel,
    sourceFileName: result.sourceFileName,
    sourceFileSize: result.sourceFileSize,
    counts: result.counts,
    pdfSavedTo: existing?.pdfSavedTo ?? 'none',
    pdfFileName: existing?.pdfFileName,
    ...(stored.tier2HandlesOptIn && prefs.tier2HandlesOptIn ? { savedAnalysis: result } : {}),
  };
  await Promise.all([records.put(record), tx.done]);
  return record;
}

export async function updateHistoryRecordPdfStatus(
  recordId: string,
  savedTo: 'device' | 'google_drive',
  pdfFileName: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['preferences', 'records'], 'readwrite');
  const prefs = await tx.objectStore('preferences').get('prefs');
  if (prefs?.tier1SummaryOptIn) {
    const records = tx.objectStore('records');
    const existing = await records.get(recordId);
    if (existing) {
      const record = prefs.tier2HandlesOptIn ? existing : summaryOnly(existing);
      await records.put({ ...record, pdfSavedTo: savedTo, pdfFileName });
    }
  }
  await tx.done;
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('records', id);
}

export async function clearAllHistory(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['preferences', 'records'], 'readwrite');
  const prefs = tx.objectStore('preferences');
  const current = await prefs.get('prefs');
  await Promise.all([
    tx.objectStore('records').clear(),
    prefs.put({ ...DEFAULT_HISTORY_PREFERENCES, revision: (current?.revision ?? 0) + 1 }, 'prefs'),
    tx.done,
  ]);
}
