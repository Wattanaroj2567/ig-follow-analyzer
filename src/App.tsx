import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AppShell, type PageId } from './components/AppShell';
import { demoHref, pageHref } from './lib/routes';
import { buildDemoAnalysisResult, buildDemoHistoryDiff } from './data/demoAnalysis';
import { RELATIONSHIP_ORDER, type RelationshipKey } from './data/relationshipMetrics';
import {
  clearAllHistory,
  DEFAULT_HISTORY_PREFERENCES,
  deleteHistoryRecord,
  hasAnySavedSnapshot,
  listHistoryRecords,
  loadHistoryPreferences,
  loadLatestHandleSnapshot,
  persistAnalysisIfConsented,
  saveHistoryPreferences,
  syncTier2SnapshotForRecord,
  updateHistoryRecordPdfStatus,
} from './lib/historyStore';
import { computeHistoryDiff } from './lib/igParser';
import { LANGUAGE_STORAGE_KEY, LanguageContext, readLanguage, useLanguage } from './lib/language';
import { HistoryScreen } from './screens/HistoryScreen';
import { HowItWorksScreen } from './screens/HowItWorksScreen';
import { LandingScreen } from './screens/LandingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AboutScreen, TermsAndFaqScreen } from './screens/TrustAndAboutScreen';
import { UploadScreen } from './screens/UploadScreen';
import type {
  AnalysisResult,
  HistoryDiff,
  HistoryPreferences,
  HistoryRecord,
} from './types/analyzer';

const PAGE_IDS: PageId[] = [
  'landing',
  'how-it-works',
  'upload',
  'results',
  'pdf',
  'history',
  'terms',
  'about',
];

const demoAnalysis = buildDemoAnalysisResult();
const demoDiff = buildDemoHistoryDiff(demoAnalysis);
const PdfReportScreen = lazy(() =>
  import('./screens/PdfReportScreen').then(({ PdfReportScreen }) => ({ default: PdfReportScreen })),
);

function readHash(): { page: PageId; demo: boolean; category?: RelationshipKey } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [name, query = ''] = raw.split('?');
  const page = PAGE_IDS.find((id) => id === name) ?? 'landing';
  const params = new URLSearchParams(query);
  const demo = (page === 'results' || page === 'pdf') && params.has('demo');
  const category = demo
    ? RELATIONSHIP_ORDER.find((key) => key === params.get('category'))
    : undefined;
  return { page, demo, category };
}

export function App() {
  const [language, setLanguage] = useState(readLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === 'th'
        ? 'IG Follow Analyzer: เครื่องมือวิเคราะห์ผู้ติดตาม Instagram จากไฟล์ ZIP'
        : 'IG Follow Analyzer: Analyze your Instagram followers from a ZIP file';
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The current language still works when storage is unavailable.
    }
  }, [language]);

  return (
    <LanguageContext value={{ language, setLanguage }}>
      <AppContent />
    </LanguageContext>
  );
}

function AppContent() {
  const { t } = useLanguage();
  const [route, setRoute] = useState(readHash);
  const activePage = route.page;
  const navigate = useCallback((next: string) => {
    if (window.location.hash !== next) window.history.pushState(null, '', next);
    setRoute(readHash());
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const setActivePage = useCallback((id: PageId) => navigate(pageHref(id)), [navigate]);
  const navigateFromResult = (id: PageId) => {
    if (route.demo && (id === 'results' || id === 'pdf')) {
      navigate(demoHref(id, route.category));
    } else {
      setActivePage(id);
    }
  };

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener('popstate', onHash);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('popstate', onHash);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [diff, setDiff] = useState<HistoryDiff | null>(null);

  const [historyPrefs, setHistoryPrefs] = useState<HistoryPreferences>({
    ...DEFAULT_HISTORY_PREFERENCES,
  });
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [hasSavedSnapshot, setHasSavedSnapshot] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [prefs, recs, hasSnap] = await Promise.all([
        loadHistoryPreferences(),
        listHistoryRecords(),
        hasAnySavedSnapshot(),
      ]);
      if (!active) return;
      setHistoryPrefs(prefs);
      setHistoryRecords(recs);
      setHasSavedSnapshot(hasSnap);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAnalysisComplete = async (result: AnalysisResult) => {
    if (result.isDemoData) {
      navigate(demoHref('results'));
      return;
    }

    setAnalysis(result);
    const matchingSnapshot = historyPrefs.tier2HandlesOptIn
      ? await loadLatestHandleSnapshot(result.ownerHandle)
      : null;
    const computedDiff = computeHistoryDiff(matchingSnapshot, result);
    setDiff(computedDiff);

    if (historyPrefs.tier1SummaryOptIn) {
      const saved = await persistAnalysisIfConsented(result, historyPrefs);
      setActiveRecordId(saved?.id ?? null);
      const [recs, hasSnap] = await Promise.all([listHistoryRecords(), hasAnySavedSnapshot()]);
      setHistoryRecords(recs);
      setHasSavedSnapshot(hasSnap);
    } else {
      setActiveRecordId(null);
    }

    setActivePage('results');
  };

  const handleUpdatePreferences = async (next: HistoryPreferences) => {
    setHistoryPrefs(next);
    if (!next.tier2HandlesOptIn) setDiff(null);
    await saveHistoryPreferences(next);

    // If user turns on opt-in while holding a REAL analysis result, save once (never save demo data)
    if (analysis && !analysis.isDemoData) {
      if (next.tier1SummaryOptIn && !activeRecordId) {
        const saved = await persistAnalysisIfConsented(analysis, next);
        setActiveRecordId(saved?.id ?? null);
      } else if (next.tier1SummaryOptIn && next.tier2HandlesOptIn && activeRecordId) {
        await syncTier2SnapshotForRecord(analysis, activeRecordId);
      }
    }

    const [recs, hasSnap] = await Promise.all([listHistoryRecords(), hasAnySavedSnapshot()]);
    setHistoryRecords(recs);
    setHasSavedSnapshot(hasSnap);
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteHistoryRecord(id);
    if (activeRecordId === id) {
      setActiveRecordId(null);
    }
    setHistoryRecords(await listHistoryRecords());
  };

  const handleOpenHistoryRecord = (record: HistoryRecord) => {
    const targetAnalysis = record.savedAnalysis ?? (record.id === activeRecordId ? analysis : null);
    if (!targetAnalysis) return;
    setAnalysis(targetAnalysis);
    setActiveRecordId(record.id);
    setDiff(null);
    setActivePage('results');
  };

  const handleClearAllHistory = async () => {
    await clearAllHistory();
    setHistoryPrefs({ ...DEFAULT_HISTORY_PREFERENCES });
    setHistoryRecords([]);
    setHasSavedSnapshot(false);
    setDiff(null);
    setActiveRecordId(null);
  };

  const handlePdfSaved = (savedTo: 'device' | 'google_drive', fileName: string) => {
    if (route.demo || !activeRecordId) return;
    void (async () => {
      await updateHistoryRecordPdfStatus(activeRecordId, savedTo, fileName);
      setHistoryRecords(await listHistoryRecords());
    })();
  };

  const activeAnalysis = route.demo ? demoAnalysis : analysis;
  const activeDiff = route.demo ? null : diff;
  const hasComparisonBaseline =
    hasSavedSnapshot &&
    historyRecords.some((record) => record.id === activeRecordId && record.savedAnalysis);
  const resultKey = route.demo ? `demo-${route.category ?? ''}` : 'analysis';

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage} hasAnalysis={Boolean(analysis)}>
      {activePage === 'landing' && (
        <LandingScreen
          demo={demoAnalysis}
          onNavigate={setActivePage}
          onOpenDemo={() => navigate(demoHref('results'))}
        />
      )}
      {activePage === 'how-it-works' && <HowItWorksScreen onNavigate={setActivePage} />}
      {activePage === 'upload' && (
        <UploadScreen
          onAnalysisComplete={(res) => void handleAnalysisComplete(res)}
          onNavigate={setActivePage}
        />
      )}
      {activePage === 'results' &&
        (activeAnalysis ? (
          <ResultsScreen
            key={resultKey}
            result={activeAnalysis}
            diff={route.demo ? demoDiff : activeDiff}
            comparisonStatus={
              historyPrefs.tier2HandlesOptIn ? (hasComparisonBaseline ? 'ready' : 'waiting') : 'off'
            }
            initialCategory={route.category}
            onNavigate={navigateFromResult}
          />
        ) : (
          <UploadScreen
            onAnalysisComplete={(res) => void handleAnalysisComplete(res)}
            onNavigate={setActivePage}
          />
        ))}
      {activePage === 'pdf' &&
        (activeAnalysis ? (
          <Suspense
            fallback={
              <p className="product-wrap py-9 text-muted" role="status">
                {t('กำลังโหลดหน้ารายงาน PDF…', 'Loading the PDF report…')}
              </p>
            }
          >
            <PdfReportScreen
              key={resultKey}
              result={activeAnalysis}
              diff={activeDiff}
              onPdfSaved={handlePdfSaved}
              onNavigate={navigateFromResult}
            />
          </Suspense>
        ) : (
          <UploadScreen
            onAnalysisComplete={(res) => void handleAnalysisComplete(res)}
            onNavigate={setActivePage}
          />
        ))}
      {activePage === 'history' && (
        <HistoryScreen
          preferences={historyPrefs}
          records={historyRecords}
          activeRecordId={activeRecordId}
          hasActiveAnalysis={Boolean(analysis && !analysis.isDemoData)}
          hasLatestSnapshot={hasSavedSnapshot}
          onUpdatePreferences={handleUpdatePreferences}
          onOpenRecord={handleOpenHistoryRecord}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAllHistory}
        />
      )}
      {activePage === 'terms' && <TermsAndFaqScreen onNavigate={setActivePage} />}
      {activePage === 'about' && <AboutScreen onNavigate={setActivePage} />}
    </AppShell>
  );
}
