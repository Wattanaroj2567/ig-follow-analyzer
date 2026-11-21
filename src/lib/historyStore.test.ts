import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildDemoAnalysisResult } from '../data/demoAnalysis';
import {
  clearAllHistory,
  deleteHistoryRecord,
  loadHistoryState,
  persistAnalysisIfConsented,
  saveHistoryPreferences,
  updateHistoryRecordPdfStatus,
} from './historyStore';

const databaseName = 'ig-follow-analyzer-local-db';
const analysis = {
  ...buildDemoAnalysisResult(),
  sourceFileName: 'instagram-test_user-2026-11-21.zip',
  ownerHandle: 'test_user',
  isDemoData: false,
};

async function optIn() {
  await saveHistoryPreferences({
    ...(await loadHistoryState()).prefs,
    tier1SummaryOptIn: true,
    tier2HandlesOptIn: true,
  });
  return (await loadHistoryState()).prefs;
}

describe('history storage', () => {
  beforeAll(async () => {
    const legacy = await openDB(databaseName, 1, {
      upgrade(db) {
        db.createObjectStore('preferences');
        db.createObjectStore('records', { keyPath: 'id' });
        db.createObjectStore('snapshots');
      },
    });
    await legacy.put('preferences', { tier1SummaryOptIn: true, tier2HandlesOptIn: false }, 'prefs');
    await legacy.put('records', {
      id: 'legacy',
      sourceFileName: analysis.sourceFileName,
      analyzedAtIso: analysis.analyzedAtIso,
      counts: analysis.counts,
      savedAnalysis: analysis,
    });
    await legacy.put('snapshots', { followerHandles: ['fictitious_follower'] }, 'latest');
    legacy.close();
  });

  it('migrates legacy summaries and removes lists left behind without consent', async () => {
    const records = (await loadHistoryState()).records;
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('legacy');
    expect(records[0].savedAnalysis).toBeUndefined();
    const db = await openDB(databaseName);
    expect(Array.from(db.objectStoreNames)).toEqual(['preferences', 'records']);
    db.close();
  });

  describe('concurrent writes', () => {
    beforeEach(clearAllHistory);

    it('reuses history and the original time for identical bytes under the same name', async () => {
      const prefs = await optIn();
      const first = await persistAnalysisIfConsented(
        { ...analysis, archiveSha256: 'a'.repeat(64) },
        prefs,
      );
      await updateHistoryRecordPdfStatus(first!.id, 'device', 'first.pdf');
      const reupload = { ...analysis, analyzedAtIso: '2026-11-21T09:00:00Z' };
      const same = await persistAnalysisIfConsented(
        { ...reupload, archiveSha256: 'a'.repeat(64) },
        prefs,
      );
      expect(same).toMatchObject({
        id: first!.id,
        analyzedAtIso: analysis.analyzedAtIso,
        pdfFileName: 'first.pdf',
      });
      const changed = await persistAnalysisIfConsented(
        { ...analysis, archiveSha256: 'b'.repeat(64) },
        prefs,
      );
      expect(changed?.id).not.toBe(first!.id);
      expect((await loadHistoryState()).records).toHaveLength(2);
      await saveHistoryPreferences({ ...prefs, tier2HandlesOptIn: false });
      expect((await loadHistoryState()).records.every((record) => !record.savedAnalysis)).toBe(
        true,
      );
    });

    it('strips names when revoking Tier 2 and rejects writes with stale consent', async () => {
      const prefs = await optIn();
      const saved = await persistAnalysisIfConsented(analysis, prefs);
      expect(saved?.savedAnalysis).toBeDefined();
      await Promise.all([
        saveHistoryPreferences({ ...prefs, tier2HandlesOptIn: false }),
        updateHistoryRecordPdfStatus(saved!.id, 'device', 'report.pdf'),
        persistAnalysisIfConsented(analysis, prefs),
      ]);
      const records = (await loadHistoryState()).records;
      expect(records).toHaveLength(1);
      expect(records[0].savedAnalysis).toBeUndefined();
      expect(records[0].pdfFileName).toBe('report.pdf');
    });

    it('never restores a cleared record, even when history is later enabled again', async () => {
      const prefs = await optIn();
      const saved = await persistAnalysisIfConsented(analysis, prefs);
      await Promise.all([
        clearAllHistory(),
        updateHistoryRecordPdfStatus(saved!.id, 'device', 'report.pdf'),
        persistAnalysisIfConsented(analysis, prefs),
      ]);
      expect((await loadHistoryState()).records).toEqual([]);
      await optIn();
      expect(await persistAnalysisIfConsented(analysis, prefs)).toBeNull();
      expect((await loadHistoryState()).records).toEqual([]);
    });

    it('does not restore a deleted entry when PDF metadata or account lists are saved', async () => {
      const prefs = await optIn();
      const saved = await persistAnalysisIfConsented(analysis, prefs);
      const id = saved!.id;
      await Promise.all([
        deleteHistoryRecord(id),
        updateHistoryRecordPdfStatus(id, 'device', 'report.pdf'),
        persistAnalysisIfConsented(analysis, prefs, id),
      ]);
      expect((await loadHistoryState()).records).toHaveLength(0);
    });
  });
});
