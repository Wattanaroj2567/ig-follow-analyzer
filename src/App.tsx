import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell, type PageId } from './components/AppShell';
import { demoHref, pageHref, PRIVACY_TOPICS, type PrivacyTopic } from './lib/routes';
import { buildDemoAnalyses, buildDemoAnalysisResult } from './data/demoAnalysis';
import { RELATIONSHIP_ORDER, type RelationshipKey } from './data/relationshipMetrics';
import {
  getComparisonExports,
  getHistoryComparisonTargets,
  type ComparisonExport,
} from './lib/comparison';
import {
  buildHandleSnapshot,
  clearAllHistory,
  DEFAULT_HISTORY_PREFERENCES,
  deleteHistoryRecord,
  listHistoryRecords,
  loadHistoryPreferences,
  persistAnalysisIfConsented,
  saveHistoryPreferences,
  syncTier2SnapshotForRecord,
  updateHistoryRecordPdfStatus,
} from './lib/historyStore';
import {
  compareFollowerSnapshots,
  computeHistoryDiff,
  extractOwnerHandleFromFileName,
} from './lib/igParser';
import { LANGUAGE_STORAGE_KEY, LanguageContext, readLanguage, useLanguage } from './lib/language';
import { DemoHistoryScreen } from './screens/DemoHistoryScreen';
import { ExportComparisonScreen } from './screens/ExportComparisonScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HowItWorksScreen } from './screens/HowItWorksScreen';
import { LandingScreen } from './screens/LandingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AboutScreen, TermsAndFaqScreen } from './screens/TrustAndAboutScreen';
import { UploadScreen } from './screens/UploadScreen';
import type { AnalysisResult, HistoryPreferences, HistoryRecord } from './types/analyzer';

const PAGE_IDS: PageId[] = [
  'landing',
  'how-it-works',
  'export-comparison',
  'upload',
  'results',
  'pdf',
  'history',
  'terms',
  'about',
];

const demoAnalysis = buildDemoAnalysisResult();
const PdfReportScreen = lazy(() =>
  import('./screens/PdfReportScreen').then(({ PdfReportScreen }) => ({ default: PdfReportScreen })),
);

function readHash(): {
  page: PageId;
  demo: boolean;
  compareWithLatest: boolean;
  category?: RelationshipKey;
  record?: string;
  privacyTopic?: PrivacyTopic;
} {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [name, query = ''] = raw.split('?');
  const page = PAGE_IDS.find((id) => id === name) ?? 'landing';
  const params = new URLSearchParams(query);
  const demo = (page === 'results' || page === 'pdf' || page === 'history') && params.has('demo');
  const category = demo
    ? RELATIONSHIP_ORDER.find((key) => key === params.get('category'))
    : undefined;
  const record = demo && page !== 'history' ? (params.get('record') ?? undefined) : undefined;
  const privacyTopic =
    page === 'terms' ? PRIVACY_TOPICS.find((topic) => topic === params.get('section')) : undefined;
  const compareWithLatest = page === 'pdf' && params.get('compare') === 'latest';
  return { page, demo, category, record, privacyTopic, compareWithLatest };
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
  const contentRef = useRef<HTMLDivElement>(null);
  const activePage = route.page;
  const navigate = useCallback((next: string) => {
    if (window.location.hash !== next) {
      window.history.pushState(null, '', next);
    }
    setRoute(readHash());
    contentRef.current?.scrollTo?.({ top: 0, behavior: 'instant' });
  }, []);
  const setActivePage = useCallback((id: PageId) => navigate(pageHref(id)), [navigate]);
  const navigateFromResult = (id: PageId) => {
    if (route.demo && (id === 'results' || id === 'pdf')) {
      navigate(demoHref(id, route.category, route.record));
    } else if (route.demo && id === 'history') {
      navigate(demoHref('history'));
    } else {
      setActivePage(id);
    }
  };

  useEffect(() => {
    const onHash = () => {
      const next = readHash();
      if (!next.privacyTopic) contentRef.current?.scrollTo?.({ top: 0, behavior: 'instant' });
      setRoute(next);
    };
    window.addEventListener('popstate', onHash);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('popstate', onHash);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<{
    current: AnalysisResult;
    previousId: string;
  } | null>(null);

  const [historyPrefs, setHistoryPrefs] = useState<HistoryPreferences>({
    ...DEFAULT_HISTORY_PREFERENCES,
  });
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    if (route.demo) return;
    let active = true;
    void (async () => {
      const [prefs, recs] = await Promise.all([loadHistoryPreferences(), listHistoryRecords()]);
      if (!active) return;
      setHistoryPrefs(prefs);
      setHistoryRecords(recs);
    })();
    return () => {
      active = false;
    };
  }, [route.demo]);

  const handleAnalysisComplete = async (result: AnalysisResult) => {
    if (result.isDemoData) {
      navigate(demoHref('results'));
      return;
    }

    setAnalysis(result);
    setComparisonSelection(null);

    if (historyPrefs.tier1SummaryOptIn) {
      const saved = await persistAnalysisIfConsented(result, historyPrefs);
      setActiveRecordId(saved?.id ?? null);
      setHistoryRecords(await listHistoryRecords());
    } else {
      setActiveRecordId(null);
    }

    setActivePage('results');
  };

  const handleUpdatePreferences = async (next: HistoryPreferences) => {
    setHistoryPrefs(next);
    if (!next.tier2HandlesOptIn) setComparisonSelection(null);
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

    setHistoryRecords(await listHistoryRecords());
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
    setComparisonSelection(null);
    setActivePage('results');
  };

  const handleClearAllHistory = async () => {
    await clearAllHistory();
    setHistoryPrefs({ ...DEFAULT_HISTORY_PREFERENCES });
    setHistoryRecords([]);
    setComparisonSelection(null);
    setActiveRecordId(null);
  };

  const needsSamples = route.demo || activePage === 'landing';
  const sampleAnalyses = useMemo(
    () => (needsSamples ? buildDemoAnalyses(demoAnalysis) : []),
    [needsSamples],
  );
  const sampleIndex = Math.max(
    0,
    sampleAnalyses.findIndex((sample) => sample.sourceFileName === route.record),
  );
  const sampleAnalysis = sampleAnalyses[sampleIndex] ?? demoAnalysis;
  const activeAnalysis = route.demo ? sampleAnalysis : analysis;
  const historyComparisonTargets = useMemo(
    () =>
      !route.demo && activePage === 'pdf' && historyPrefs.tier2HandlesOptIn
        ? getHistoryComparisonTargets(historyRecords)
        : null,
    [activePage, route.demo, historyPrefs.tier2HandlesOptIn, historyRecords],
  );
  const selectedRecordId = route.demo ? activeAnalysis?.sourceFileName : activeRecordId;
  const latestSample = sampleIndex > 0 ? sampleAnalyses[0] : undefined;
  const latestPdfTarget: ComparisonExport | undefined =
    activePage === 'pdf' && selectedRecordId
      ? route.demo && latestSample
        ? { id: latestSample.sourceFileName, analysis: latestSample }
        : historyComparisonTargets?.get(selectedRecordId)
      : undefined;
  const latestComparison =
    route.compareWithLatest && latestPdfTarget
      ? getComparisonExports(latestPdfTarget.analysis, historyRecords, sampleAnalyses)
      : null;
  let selectedLatestPreviousId: string | undefined;
  if (comparisonSelection && comparisonSelection.current === latestPdfTarget?.analysis) {
    selectedLatestPreviousId = comparisonSelection.previousId;
  }
  const latestPrevious =
    latestComparison && selectedLatestPreviousId
      ? (latestComparison.earlier.find((file) => file.id === selectedLatestPreviousId) ??
        latestComparison.earlier[0])
      : (latestComparison?.earlier.find((file) => file.id === selectedRecordId) ??
        latestComparison?.earlier[0]);
  const latestPdfPair =
    route.compareWithLatest && latestPdfTarget && latestPrevious && selectedRecordId
      ? {
          latest: latestPdfTarget,
          earlier: {
            id: latestPrevious.id,
            analysis: latestPrevious.analysis,
            ownerHandle: latestPdfTarget.ownerHandle,
          },
        }
      : null;
  const reportResult = latestPdfPair?.latest.analysis ?? activeAnalysis;
  const handlePdfSaved = (savedTo: 'device' | 'google_drive', fileName: string) => {
    const reportRecordId = latestPdfPair?.latest.id ?? activeRecordId;
    if (route.demo || !reportRecordId) return;
    void (async () => {
      await updateHistoryRecordPdfStatus(reportRecordId, savedTo, fileName);
      setHistoryRecords(await listHistoryRecords());
    })();
  };
  const comparison = useMemo(() => {
    if (!activeAnalysis || (!route.demo && !historyPrefs.tier2HandlesOptIn)) return null;
    return getComparisonExports(activeAnalysis, historyRecords, sampleAnalyses);
  }, [activeAnalysis, route.demo, historyPrefs.tier2HandlesOptIn, historyRecords, sampleAnalyses]);
  const defaultPrevious = comparison?.earlier[0];
  const previous =
    (comparison?.isLatest && comparisonSelection?.current === activeAnalysis
      ? comparison.earlier.find((file) => file.id === comparisonSelection.previousId)
      : undefined) ?? defaultPrevious;
  const comparisonFiles =
    comparison && previous && defaultPrevious
      ? {
          isLatest: comparison.isLatest,
          earlier: comparison.earlier,
          previous,
          automatic: previous.id === defaultPrevious.id,
        }
      : null;
  const selectComparison = (previousId: string | null) => {
    if (!previousId && route.compareWithLatest) {
      if (latestPdfTarget && latestComparison?.earlier[0]) {
        const previous = latestComparison.earlier[0];
        setComparisonSelection({
          current: latestPdfTarget.analysis,
          previousId: previous.id,
        });
      } else {
        setComparisonSelection(null);
      }
      return;
    }
    setComparisonSelection(
      previousId && activeAnalysis ? { current: activeAnalysis, previousId } : null,
    );
  };
  const reportBaseline = latestPdfPair?.earlier.analysis ?? previous?.analysis;
  const reportOwner = latestPdfPair ? latestPdfPair.earlier.ownerHandle : previous?.ownerHandle;
  const diff = useMemo(() => {
    if (!reportResult || !reportBaseline) return null;
    const snapshot = buildHandleSnapshot(reportBaseline, reportOwner);
    return reportResult.isDemoData
      ? compareFollowerSnapshots(snapshot, reportResult)
      : computeHistoryDiff(snapshot, reportResult);
  }, [reportResult, reportBaseline, reportOwner]);
  const hasComparisonBaseline = historyRecords.some(
    (record) => record.id === activeRecordId && record.savedAnalysis,
  );
  const hasSavedLists = historyRecords.some(
    (record) => record.savedAnalysis && (record.savedAnalysis.ownerHandle ?? record.ownerHandle),
  );
  const hasKnownOwner =
    activeAnalysis &&
    (activeAnalysis.ownerHandle ?? extractOwnerHandleFromFileName(activeAnalysis.sourceFileName));
  const comparisonStatus = !historyPrefs.tier2HandlesOptIn
    ? 'off'
    : !hasKnownOwner
      ? 'unknown-owner'
      : hasComparisonBaseline
        ? 'ready'
        : 'waiting';
  const resultKey = route.demo
    ? `demo-${sampleAnalysis.sourceFileName}-${route.category ?? ''}`
    : 'analysis';

  return (
    <AppShell
      activePage={activePage}
      contentRef={contentRef}
      onNavigate={setActivePage}
      hasAnalysis={!route.demo && Boolean(analysis)}
    >
      {activePage === 'landing' && (
        <LandingScreen
          demo={demoAnalysis}
          previousDemo={sampleAnalyses[1]}
          onNavigate={setActivePage}
          onOpenDemo={() => navigate(demoHref('results'))}
        />
      )}
      {activePage === 'how-it-works' && <HowItWorksScreen onNavigate={setActivePage} />}
      {activePage === 'export-comparison' && <ExportComparisonScreen onNavigate={setActivePage} />}
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
            diff={diff}
            comparison={comparisonFiles}
            comparisonStatus={comparisonStatus}
            onSelectComparison={selectComparison}
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
        (reportResult ? (
          <Suspense
            fallback={
              <div
                className="grid min-h-[calc(100dvh-var(--nav-bar-height)-2rem)] place-items-center px-5"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-muted">
                  {t('กำลังโหลดหน้ารายงาน PDF…', 'Loading the PDF report…')}
                </p>
              </div>
            }
          >
            <PdfReportScreen
              key={resultKey}
              result={reportResult}
              diff={diff}
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
      {activePage === 'history' &&
        (route.demo ? (
          <DemoHistoryScreen
            samples={sampleAnalyses}
            onOpenResults={(record) => navigate(demoHref('results', undefined, record))}
          />
        ) : (
          <HistoryScreen
            preferences={historyPrefs}
            records={historyRecords}
            activeRecordId={activeRecordId}
            hasActiveAnalysis={Boolean(analysis && !analysis.isDemoData)}
            hasLatestSnapshot={hasSavedLists}
            onUpdatePreferences={handleUpdatePreferences}
            onOpenRecord={handleOpenHistoryRecord}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllHistory}
            onNavigate={setActivePage}
          />
        ))}
      {activePage === 'terms' && (
        <TermsAndFaqScreen onNavigate={setActivePage} privacyTopic={route.privacyTopic} />
      )}
      {activePage === 'about' && <AboutScreen onNavigate={setActivePage} />}
    </AppShell>
  );
}
