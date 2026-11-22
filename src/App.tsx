import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell, type PageId } from './components/AppShell';
import { PageBreadcrumb } from './components/PageBreadcrumb';
import { demoHref, pageHref, PRIVACY_TOPICS, type PrivacyTopic } from './lib/routes';
import {
  advanceTrail,
  canonicalTrailForPage,
  isValidTrail,
  LANDING_ENTRY,
  type NavigationMode,
  PAGE_IDS,
  sliceTrailToIndex,
  type TrailEntry,
} from './lib/navigationTrail';
import { buildDemoAnalyses, buildDemoAnalysisResult } from './data/demoAnalysis';
import { RELATIONSHIP_ORDER, type RelationshipKey } from './data/relationshipMetrics';
import { getComparisonExports } from './lib/comparison';
import {
  buildHandleSnapshot,
  clearAllHistory,
  DEFAULT_HISTORY_PREFERENCES,
  deleteHistoryRecord,
  loadHistoryState,
  persistAnalysisIfConsented,
  saveHistoryPreferences,
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
import { PdfReportScreen } from './screens/PdfReportScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AboutScreen, TermsAndFaqScreen } from './screens/TrustAndAboutScreen';
import { UploadScreen } from './screens/UploadScreen';
import type { AnalysisResult, HistoryPreferences, HistoryRecord } from './types/analyzer';

const demoAnalysis = buildDemoAnalysisResult();

interface ParsedRoute {
  page: PageId;
  href: string;
  demo: boolean;
  category?: RelationshipKey;
  record?: string;
  privacyTopic?: PrivacyTopic;
  focusExportDateRange: boolean;
}

function parseHash(hash: string): ParsedRoute {
  const raw = hash.replace(/^#\/?/, '');
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
  const focusExportDateRange = page === 'how-it-works' && params.get('section') === 'date-range';
  const href = query && page !== 'landing' ? `${pageHref(page)}?${query}` : pageHref(page);
  return { page, href, demo, category, record, privacyTopic, focusExportDateRange };
}

function readHash(): ParsedRoute {
  return parseHash(window.location.hash);
}

function readTrailFromHistoryState(route: ParsedRoute): TrailEntry[] | null {
  const state = window.history.state as { trail?: unknown } | null;
  if (!state || !isValidTrail(state.trail)) return null;
  const last = state.trail.at(-1);
  if (!last || last.page !== route.page || last.demo !== route.demo) return null;
  return state.trail;
}

function getInitialTrail(route: ParsedRoute): TrailEntry[] {
  const saved = readTrailFromHistoryState(route);
  if (saved) return saved;
  const resultsHref = route.demo
    ? demoHref('results', route.category, route.record)
    : pageHref('results');
  return canonicalTrailForPage(route.page, route.href, route.demo, resultsHref);
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
  const [trail, setTrail] = useState<TrailEntry[]>(() => getInitialTrail(route));
  const trailRef = useRef(trail);
  const activePage = route.page;

  useEffect(() => {
    if (!readTrailFromHistoryState(route)) {
      window.history.replaceState({ trail: trailRef.current }, '', window.location.href);
    }
    // Only seed the initial history entry once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((next: string, mode: NavigationMode = 'contextual') => {
    const nextRoute = parseHash(next);
    const nextTrail = advanceTrail(
      trailRef.current,
      { page: nextRoute.page, href: nextRoute.href, demo: nextRoute.demo },
      mode,
    );
    trailRef.current = nextTrail;
    if (window.location.hash !== next) {
      window.history.pushState({ trail: nextTrail }, '', next);
    } else {
      window.history.replaceState({ trail: nextTrail }, '', next);
    }
    setRoute(nextRoute);
    setTrail(nextTrail);
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }, []);

  const navigateToTrailIndex = useCallback((index: number) => {
    const nextTrail = sliceTrailToIndex(trailRef.current, index);
    const target = nextTrail.at(-1) ?? LANDING_ENTRY;
    trailRef.current = nextTrail;
    if (window.location.hash !== target.href) {
      window.history.pushState({ trail: nextTrail }, '', target.href);
    } else {
      window.history.replaceState({ trail: nextTrail }, '', target.href);
    }
    setRoute(parseHash(target.href));
    setTrail(nextTrail);
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }, []);

  const setActivePage = useCallback(
    (id: PageId, mode: NavigationMode = 'contextual') => navigate(pageHref(id), mode),
    [navigate],
  );
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
      const restored = readTrailFromHistoryState(next);
      if (restored) {
        trailRef.current = restored;
        setTrail(restored);
      } else {
        const nextTrail = advanceTrail(
          trailRef.current,
          { page: next.page, href: next.href, demo: next.demo },
          'contextual',
        );
        trailRef.current = nextTrail;
        window.history.replaceState({ trail: nextTrail }, '', window.location.href);
        setTrail(nextTrail);
      }
      if (!next.privacyTopic && !next.focusExportDateRange) {
        window.scrollTo?.({ top: 0, behavior: 'instant' });
      }
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
  const [sessionRecordId, setSessionRecordId] = useState<string | null>(null);
  const [openedRecordId, setOpenedRecordId] = useState<string | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<{
    currentKey: string;
    previousId: string;
  } | null>(null);

  const [historyPrefs, setHistoryPrefs] = useState<HistoryPreferences>({
    ...DEFAULT_HISTORY_PREFERENCES,
  });
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  const [historySaveError, setHistorySaveError] = useState(false);
  const historyChannel = useRef<BroadcastChannel | null>(null);
  const historyRequest = useRef({ id: 0 });
  const analysisRequest = useRef(0);

  const refreshHistory = useCallback(async () => {
    const request = ++historyRequest.current.id;
    const { prefs, records } = await loadHistoryState();
    if (historyRequest.current.id !== request) return;
    setHistoryPrefs(prefs);
    setHistoryRecords(records);
    if (!prefs.tier2HandlesOptIn) setComparisonSelection(null);
    setSessionRecordId((id) => (records.some((record) => record.id === id) ? id : null));
    setOpenedRecordId((id) => (id && records.some((record) => record.id === id) ? id : null));
  }, []);

  useEffect(() => {
    if (route.demo) return;
    const requests = historyRequest.current;
    const channel =
      typeof BroadcastChannel === 'function'
        ? new BroadcastChannel('ig-follow-analyzer-history')
        : null;
    historyChannel.current = channel;
    if (channel) channel.onmessage = () => void refreshHistory();
    const onFocus = () => void refreshHistory();
    window.addEventListener('focus', onFocus);
    void refreshHistory();
    return () => {
      requests.id++;
      historyChannel.current = null;
      channel?.close();
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshHistory, route.demo]);

  const refreshChangedHistory = async () => {
    historyChannel.current?.postMessage(null);
    await refreshHistory();
  };

  const handleAnalysisComplete = async (result: AnalysisResult) => {
    const request = ++analysisRequest.current;
    setAnalysis(result);
    setOpenedRecordId(null);
    setSessionRecordId(null);
    setComparisonSelection(null);
    setHistorySaveError(false);
    setActivePage('results');
    if (!historyPrefs.tier1SummaryOptIn) return;

    try {
      const saved = await persistAnalysisIfConsented(result, historyPrefs);
      if (analysisRequest.current === request) {
        setSessionRecordId(saved?.id ?? null);
        if (saved?.savedAnalysis && saved.analyzedAtIso !== result.analyzedAtIso) {
          setAnalysis(saved.savedAnalysis);
        }
      }
      await refreshChangedHistory();
    } catch {
      if (analysisRequest.current === request) setHistorySaveError(true);
    }
  };

  const handleUpdatePreferences = async (next: HistoryPreferences) => {
    const request = analysisRequest.current;
    try {
      const savedPrefs = await saveHistoryPreferences({ ...next, revision: historyPrefs.revision });
      const enabledSummary = !historyPrefs.tier1SummaryOptIn && savedPrefs.tier1SummaryOptIn;
      const enabledLists = !historyPrefs.tier2HandlesOptIn && savedPrefs.tier2HandlesOptIn;
      if (!openedRecordId && analysis && (enabledSummary || enabledLists)) {
        const saved = await persistAnalysisIfConsented(
          analysis,
          savedPrefs,
          sessionRecordId ?? undefined,
        );
        if (analysisRequest.current === request && saved) setSessionRecordId(saved.id);
      }
    } finally {
      await refreshChangedHistory();
    }
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteHistoryRecord(id);
    await refreshChangedHistory();
  };

  const handleOpenHistoryRecord = (record: HistoryRecord) => {
    const isSessionRecord = record.id === sessionRecordId && analysis !== null;
    if (!isSessionRecord && !record.savedAnalysis) return;
    setOpenedRecordId(isSessionRecord ? null : record.id);
    setComparisonSelection(null);
    navigate(pageHref('results'), 'history-record');
  };

  const handleClearAllHistory = async () => {
    await clearAllHistory();
    analysisRequest.current++;
    setSessionRecordId(null);
    await refreshChangedHistory();
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
  const openedAnalysis =
    historyRecords.find((record) => record.id === openedRecordId)?.savedAnalysis ?? null;
  const currentAnalysis = openedRecordId ? openedAnalysis : analysis;
  const activeRecordId = openedAnalysis ? openedRecordId : sessionRecordId;
  const activeAnalysis = route.demo ? sampleAnalysis : currentAnalysis;
  const activeAnalysisKey = JSON.stringify([
    activeAnalysis?.isDemoData,
    activeAnalysis?.sourceFileName,
    activeAnalysis?.analyzedAtIso,
  ]);
  const handlePdfSaved = (savedTo: 'device' | 'google_drive', fileName: string) => {
    if (route.demo || !activeRecordId) return;
    void updateHistoryRecordPdfStatus(activeRecordId, savedTo, fileName)
      .then(refreshChangedHistory)
      .catch(() => {
        // The report download already completed. History metadata is optional.
      });
  };
  const comparison = useMemo(() => {
    if (!activeAnalysis || (!route.demo && !historyPrefs.tier2HandlesOptIn)) return null;
    return getComparisonExports(activeAnalysis, historyRecords, sampleAnalyses);
  }, [activeAnalysis, route.demo, historyPrefs.tier2HandlesOptIn, historyRecords, sampleAnalyses]);
  const defaultPrevious = comparison?.earlier[0];
  const previous =
    (comparison?.isLatest && comparisonSelection?.currentKey === activeAnalysisKey
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
    setComparisonSelection(
      previousId && activeAnalysis ? { currentKey: activeAnalysisKey, previousId } : null,
    );
  };
  const diff = useMemo(() => {
    if (!activeAnalysis || !previous) return null;
    const snapshot = buildHandleSnapshot(previous.analysis, previous.ownerHandle);
    return activeAnalysis.isDemoData
      ? compareFollowerSnapshots(snapshot, activeAnalysis)
      : computeHistoryDiff(snapshot, activeAnalysis);
  }, [activeAnalysis, previous]);
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
    : activeAnalysisKey;
  const displayTrail =
    (activePage === 'results' || activePage === 'pdf') && !activeAnalysis
      ? [LANDING_ENTRY, { page: 'upload' as const, href: pageHref('upload'), demo: false }]
      : trail;

  const protectFromPullRefresh =
    !route.demo && Boolean(currentAnalysis) && (activePage === 'results' || activePage === 'pdf');

  useEffect(() => {
    if (protectFromPullRefresh) {
      document.documentElement.dataset.preventPullRefresh = 'true';
    } else {
      delete document.documentElement.dataset.preventPullRefresh;
    }
    return () => {
      delete document.documentElement.dataset.preventPullRefresh;
    };
  }, [protectFromPullRefresh]);

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      hasAnalysis={!route.demo && Boolean(currentAnalysis)}
      breadcrumb={<PageBreadcrumb trail={displayTrail} onNavigateToIndex={navigateToTrailIndex} />}
    >
      {activePage === 'landing' && (
        <LandingScreen
          demo={demoAnalysis}
          previousDemo={sampleAnalyses[1]}
          onNavigate={setActivePage}
          onOpenDemo={() => navigate(demoHref('results'))}
        />
      )}
      {activePage === 'how-it-works' && (
        <HowItWorksScreen onNavigate={setActivePage} focusDateRange={route.focusExportDateRange} />
      )}
      {activePage === 'export-comparison' && <ExportComparisonScreen onNavigate={setActivePage} />}
      {activePage === 'upload' && (
        <UploadScreen
          onAnalysisComplete={(res) => void handleAnalysisComplete(res)}
          onNavigate={setActivePage}
        />
      )}
      {!route.demo &&
        openedRecordId &&
        !openedAnalysis &&
        (activePage === 'results' || activePage === 'pdf') && (
          <div className="product-wrap pt-5 text-sm text-ink">
            <p role="status">
              {t(
                'รายชื่อจากประวัติรอบนี้ไม่พร้อมให้เปิดแล้ว',
                'The saved account list for this result is no longer available.',
              )}
            </p>
            {analysis && (
              <button
                type="button"
                className="mt-2 cursor-pointer text-cool underline underline-offset-4"
                onClick={() => {
                  setOpenedRecordId(null);
                  setActivePage('results');
                }}
              >
                {t('กลับไปดูผล ZIP ที่เพิ่งเลือก', 'Return to the ZIP analyzed in this tab')}
              </button>
            )}
          </div>
        )}
      {activePage === 'results' && !route.demo && !openedAnalysis && historySaveError && (
        <p role="alert" className="product-wrap mt-4 text-sm text-bad">
          {t(
            'บันทึกผลลงประวัติไม่ได้ ผลวิเคราะห์ยังเปิดดูได้',
            'Could not save to history. Your results are still available.',
          )}
        </p>
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
        (activeAnalysis ? (
          <PdfReportScreen
            key={JSON.stringify([resultKey, previous?.id])}
            result={activeAnalysis}
            diff={diff}
            onPdfSaved={handlePdfSaved}
          />
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
            onOpenResults={(record) =>
              navigate(demoHref('results', undefined, record), 'history-record')
            }
          />
        ) : (
          <HistoryScreen
            preferences={historyPrefs}
            records={historyRecords}
            activeRecordId={activeRecordId}
            hasActiveAnalysis={Boolean(analysis && !analysis.isDemoData && !openedRecordId)}
            hasLatestSnapshot={hasSavedLists}
            onUpdatePreferences={handleUpdatePreferences}
            onOpenRecord={handleOpenHistoryRecord}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllHistory}
          />
        ))}
      {activePage === 'terms' && (
        <TermsAndFaqScreen onNavigate={setActivePage} privacyTopic={route.privacyTopic} />
      )}
      {activePage === 'about' && <AboutScreen onNavigate={setActivePage} />}
    </AppShell>
  );
}
