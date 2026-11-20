import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PageId } from '../components/AppShell';
import { BackButton } from '../components/BackButton';
import { NormalButton } from '../components/NormalButton';
import { formatDate, formatSnapshotDate } from '../lib/dates';
import {
  buildPdfDonutArcs,
  buildReportFileName,
  estimatePdfPageCount,
  generatePdfBlob,
  getPdfComparisonSummary,
  getPdfReportLabels,
  getPdfSummaryMetrics,
  getRelationshipTotal,
  PDF_PREVIEW_PALETTE,
  PDF_TABLE_ROWS_PER_PAGE,
  triggerBrowserDownload,
} from '../lib/pdfGenerator';
import { getLanguageFormat, type Language, useLanguage } from '../lib/language';
import { buildSafeProfileHref } from '../lib/igParser';
import type {
  AccountEntry,
  AnalysisResult,
  HistoryDiff,
  PdfReportOptions,
} from '../types/analyzer';
import './pdf-report.css';

const A4_WIDTH = 560;
const A4_HEIGHT = 792;
const MAX_PREVIEW_PAGES = 60;

interface PdfReportScreenProps {
  result: AnalysisResult;
  diff: HistoryDiff | null;
  onPdfSaved: (savedTo: 'device' | 'google_drive', fileName: string) => void;
  onNavigate: (id: PageId) => void;
}

type PresetId = 'recommended' | 'unfollowers' | 'complete';

type PreviewPageDescriptor =
  | { kind: 'summary'; pageNumber: number }
  | {
      kind: 'table';
      pageNumber: number;
      sectionNumber: number;
      title: string;
      dateHeader: string;
      accent: string;
      fill: string;
      totalInCategory: number;
      startIndex: number;
      rows: AccountEntry[];
    };

export function PdfReportScreen({ result, diff, onPdfSaved, onNavigate }: PdfReportScreenProps) {
  const { language, t } = useLanguage();
  const [reportLanguage, setReportLanguage] = useState<Language>(language);
  useEffect(() => {
    setReportLanguage(language);
  }, [language]);
  const { t: reportT, locale: reportLocale } = getLanguageFormat(reportLanguage);
  const report = useMemo(() => getPdfReportLabels(reportT), [reportT]);
  const comparisonSummary = diff && getPdfComparisonSummary(diff, report, reportLocale);
  const snapshotDate = formatSnapshotDate(result.snapshotDateLabel, reportLocale);
  const [options, setOptions] = useState<PdfReportOptions>({
    includeSummary: true,
    includeNotFollowingBack: true,
    includeNotFollowedBack: true,
    includeAllFollowers: false,
    includeDiffSection: true,
    includeTimestamps: true,
  });

  const [inlinePageIndex, setInlinePageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<
    { kind: 'success'; fileName: string } | { kind: 'error' } | null
  >(null);
  const statusText =
    statusMsg?.kind === 'success'
      ? t(
          `สร้างและเริ่มดาวน์โหลดไฟล์ ${statusMsg.fileName} เรียบร้อยแล้ว`,
          `Created PDF and started downloading ${statusMsg.fileName}.`,
        )
      : t('ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง', 'Couldn’t create the PDF. Try again.');

  // True-A4 responsive scaling so mobile previews never squish or clip
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [inlineScale, setInlineScale] = useState(1);

  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [lightboxFitScale, setLightboxFitScale] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [lightboxPage, setLightboxPage] = useState(1);
  const lightboxScrollRef = useRef<HTMLDivElement>(null);
  const lightboxPageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lightboxScale = (lightboxFitScale * zoomPercent) / 100;

  const { counts } = result;
  const totalUnique = getRelationshipTotal(counts) || 1;
  const mutualPct = ((counts.mutual / totalUnique) * 100).toFixed(1);
  const notBackPct = ((counts.notFollowingBack / totalUnique) * 100).toFixed(1);
  const notFollowedPct = ((counts.notFollowedBack / totalUnique) * 100).toFixed(1);
  const followBackRate =
    counts.following > 0 ? ((counts.mutual / counts.following) * 100).toFixed(1) : '0.0';
  const netDiff = counts.following - counts.followers;

  const previewFileName = useMemo(() => buildReportFileName(), []);
  const estimate = useMemo(
    () => estimatePdfPageCount(result, options, diff),
    [result, options, diff],
  );
  const donutArcs = useMemo(() => buildPdfDonutArcs(counts), [counts]);

  const hasFrontPage = options.includeSummary || (options.includeDiffSection && Boolean(diff));

  // Build every selected A4 page for the scrollable report preview
  const { pages: previewPages, truncatedPages } = useMemo(() => {
    const list: PreviewPageDescriptor[] = [];
    let pageNumber = 0;

    if (hasFrontPage) {
      pageNumber += 1;
      list.push({ kind: 'summary', pageNumber });
    }

    const categories: {
      enabled: boolean;
      title: string;
      dateHeader: string;
      accent: string;
      fill: string;
      entries: AccountEntry[];
    }[] = [
      ...(diff && options.includeDiffSection
        ? [
            {
              enabled: true,
              title: report.newFollowers,
              dateHeader: report.dateTheyFollowed,
              accent: PDF_PREVIEW_PALETTE.ok,
              fill: PDF_PREVIEW_PALETTE.surface,
              entries: result.followers.filter((entry) => diff.newFollowers.includes(entry.handle)),
            },
            {
              enabled: true,
              title: report.missingFollowers,
              dateHeader: report.dateTheyFollowed,
              accent: PDF_PREVIEW_PALETTE.accent,
              fill: PDF_PREVIEW_PALETTE.accentSoft,
              entries: diff.recentUnfollowers.map((handle) => ({
                handle,
                href: buildSafeProfileHref(handle),
                timestamp: diff.unfollowerTimestamps.get(handle),
              })),
            },
          ]
        : []),
      {
        enabled: options.includeNotFollowingBack,
        title: report.notFollowingBackList,
        dateHeader: report.dateYouFollowed,
        accent: PDF_PREVIEW_PALETTE.accent,
        fill: PDF_PREVIEW_PALETTE.accentSoft,
        entries: result.notFollowingBack,
      },
      {
        enabled: options.includeNotFollowedBack,
        title: report.notFollowedBackList,
        dateHeader: report.dateTheyFollowed,
        accent: PDF_PREVIEW_PALETTE.cool,
        fill: PDF_PREVIEW_PALETTE.coolSoft,
        entries: result.notFollowedBack,
      },
      {
        enabled: options.includeAllFollowers,
        title: report.followersList,
        dateHeader: report.dateTheyFollowed,
        accent: PDF_PREVIEW_PALETTE.ink,
        fill: PDF_PREVIEW_PALETTE.surface,
        entries: result.followers,
      },
    ];

    let sectionNumber = 0;
    for (const cat of categories) {
      if (!cat.enabled) continue;
      sectionNumber += 1;
      if (cat.entries.length === 0) {
        pageNumber += 1;
        list.push({
          kind: 'table',
          pageNumber,
          sectionNumber,
          title: cat.title,
          dateHeader: cat.dateHeader,
          accent: cat.accent,
          fill: cat.fill,
          totalInCategory: 0,
          startIndex: 0,
          rows: [],
        });
        continue;
      }
      for (let start = 0; start < cat.entries.length; start += PDF_TABLE_ROWS_PER_PAGE) {
        pageNumber += 1;
        list.push({
          kind: 'table',
          pageNumber,
          sectionNumber,
          title: cat.title,
          dateHeader: cat.dateHeader,
          accent: cat.accent,
          fill: cat.fill,
          totalInCategory: cat.entries.length,
          startIndex: start,
          rows: cat.entries.slice(start, start + PDF_TABLE_ROWS_PER_PAGE),
        });
      }
    }

    const capped = list.slice(0, MAX_PREVIEW_PAGES);
    return {
      pages: capped,
      truncatedPages: Math.max(0, list.length - capped.length),
    };
  }, [
    hasFrontPage,
    options.includeDiffSection,
    options.includeNotFollowingBack,
    options.includeNotFollowedBack,
    options.includeAllFollowers,
    report,
    result.notFollowingBack,
    result.notFollowedBack,
    result.followers,
    diff,
  ]);

  const totalPreviewPages = previewPages.length;
  const totalDocumentPages = totalPreviewPages + truncatedPages;
  const hasAnySection = totalPreviewPages > 0;
  const safeInlineIndex = Math.min(inlinePageIndex, Math.max(0, totalPreviewPages - 1));
  const currentInlinePage = previewPages[safeInlineIndex];

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setInlineScale(Math.min(1, width / A4_WIDTH));
      }
    };
    updateScale();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const container = lightboxScrollRef.current;
    if (!container) return;

    const updateScale = () => {
      const { paddingLeft, paddingRight } = getComputedStyle(container);
      const width = container.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
      if (width > 0) setLightboxFitScale(Math.min(1, width / A4_WIDTH));
    };

    updateScale();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isZoomOpen, hasAnySection]);

  useEffect(() => {
    if (!isZoomOpen) return;
    const opener = document.activeElement;
    lightboxScrollRef.current?.focus({ preventScroll: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isZoomOpen]);

  const scrollLightboxToPage = (targetPage: number) => {
    const clamped = Math.max(1, Math.min(totalPreviewPages, targetPage));
    setLightboxPage(clamped);
    const el = lightboxPageRefs.current[clamped - 1];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openLightboxAtPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(totalPreviewPages, pageNum));
    setZoomPercent(100);
    setLightboxPage(clamped);
    setIsZoomOpen(true);
    window.requestAnimationFrame(() => {
      const el = lightboxPageRefs.current[clamped - 1];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'start' });
      }
    });
  };

  const handleLightboxScroll = () => {
    const container = lightboxScrollRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const midY = containerRect.top + containerRect.height * 0.35;
    let closest = 1;
    let bestDist = Infinity;
    for (let i = 0; i < totalPreviewPages; i += 1) {
      const node = lightboxPageRefs.current[i];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(centerY - midY);
      if (dist < bestDist) {
        bestDist = dist;
        closest = i + 1;
      }
    }
    setLightboxPage(closest);
  };

  const activePreset: PresetId | null = (() => {
    if (
      options.includeSummary &&
      options.includeNotFollowingBack &&
      options.includeNotFollowedBack &&
      !options.includeAllFollowers
    ) {
      return 'recommended';
    }
    if (
      options.includeSummary &&
      options.includeNotFollowingBack &&
      !options.includeNotFollowedBack &&
      !options.includeAllFollowers
    ) {
      return 'unfollowers';
    }
    if (
      options.includeSummary &&
      options.includeNotFollowingBack &&
      options.includeNotFollowedBack &&
      options.includeAllFollowers
    ) {
      return 'complete';
    }
    return null;
  })();

  const applyPreset = (preset: PresetId) => {
    setInlinePageIndex(0);
    if (preset === 'recommended') {
      setOptions((prev) => ({
        ...prev,
        includeSummary: true,
        includeNotFollowingBack: true,
        includeNotFollowedBack: true,
        includeAllFollowers: false,
      }));
    } else if (preset === 'unfollowers') {
      setOptions((prev) => ({
        ...prev,
        includeSummary: true,
        includeNotFollowingBack: true,
        includeNotFollowedBack: false,
        includeAllFollowers: false,
      }));
    } else {
      setOptions((prev) => ({
        ...prev,
        includeSummary: true,
        includeNotFollowingBack: true,
        includeNotFollowedBack: true,
        includeAllFollowers: true,
      }));
    }
  };

  const handleDownloadLocalPdf = async () => {
    if (!hasAnySection) return;
    setIsGenerating(true);
    setStatusMsg(null);
    try {
      const { blob, fileName } = await generatePdfBlob(result, options, diff, reportLanguage);
      triggerBrowserDownload(blob, fileName);
      onPdfSaved('device', fileName);
      setStatusMsg({ kind: 'success', fileName });
    } catch {
      setStatusMsg({ kind: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggle = (key: keyof PdfReportOptions) => {
    setInlinePageIndex(0);
    setLightboxPage(1);
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderA4Page = (page: PreviewPageDescriptor) => {
    if (page.kind === 'summary') {
      return (
        <div
          lang={reportLanguage}
          className="pdf-sheet-font flex flex-col justify-between overflow-hidden rounded-lg border border-rule bg-paper-2 text-ink shadow-sm"
          style={{ width: A4_WIDTH, height: A4_HEIGHT }}
        >
          <div>
            <div className="h-1.5 w-full bg-accent" />

            <div className="p-7">
              <div className="flex items-start justify-between gap-3 border-b border-rule pb-3.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight text-accent">
                    {report.eyebrow}
                  </p>
                  <h3 className="mt-0.5 text-[18px] font-bold leading-tight text-ink">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-snug wrap-anywhere text-ink-2">
                    {result.ownerHandle && (
                      <>
                        <strong className="font-bold text-ink">@{result.ownerHandle}</strong> •{' '}
                      </>
                    )}
                    {report.source} {result.sourceFileName}
                    {result.isDemoData ? ` (${report.demo})` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-bold leading-tight text-ink">
                    {report.asOf} {snapshotDate}
                  </p>
                </div>
              </div>

              {options.includeSummary && (
                <>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {getPdfSummaryMetrics(counts, report).map(({ label, count, ink, fill }) => (
                      <div
                        key={label}
                        className="rounded border border-rule px-1.5 py-2.5 text-center"
                        style={{ backgroundColor: fill, color: ink }}
                      >
                        <p className="text-[11px] leading-tight font-bold">{label}</p>
                        <p className="mt-0.5 text-[23px] leading-none font-bold">
                          {count.toLocaleString(reportLocale)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-12 items-center gap-4 rounded border border-rule bg-paper-3 px-4 py-3.5">
                    <div className="col-span-4 flex justify-center">
                      <svg viewBox="0 0 180 180" className="h-33 w-33" aria-hidden="true">
                        <circle
                          cx="90"
                          cy="90"
                          r="64"
                          fill="none"
                          stroke={PDF_PREVIEW_PALETTE.rule}
                          strokeWidth="22"
                        />
                        {donutArcs.map((arc) => (
                          <path
                            key={arc.color}
                            d={arc.d}
                            fill="none"
                            stroke={arc.color}
                            strokeWidth="22"
                          />
                        ))}
                      </svg>
                    </div>

                    <div className="col-span-8">
                      <p className="text-[14px] font-bold text-ink">{report.chart}</p>
                      <div className="mt-1.5 divide-y divide-rule text-[11px] font-bold">
                        <div className="flex items-center justify-between py-1">
                          <span className="inline-flex items-center gap-1.5 text-ink-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: PDF_PREVIEW_PALETTE.ok }}
                            />
                            {report.mutual}
                          </span>
                          <strong style={{ color: PDF_PREVIEW_PALETTE.ok }}>
                            {counts.mutual.toLocaleString(reportLocale)} ({mutualPct}%)
                          </strong>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="inline-flex items-center gap-1.5 text-ink-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: PDF_PREVIEW_PALETTE.accent }}
                            />
                            {report.notFollowingBack}
                          </span>
                          <strong style={{ color: PDF_PREVIEW_PALETTE.accent }}>
                            {counts.notFollowingBack.toLocaleString(reportLocale)} ({notBackPct}%)
                          </strong>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="inline-flex items-center gap-1.5 text-ink-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: PDF_PREVIEW_PALETTE.cool }}
                            />
                            {report.notFollowedBack}
                          </span>
                          <strong style={{ color: PDF_PREVIEW_PALETTE.cool }}>
                            {counts.notFollowedBack.toLocaleString(reportLocale)} ({notFollowedPct}
                            %)
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 divide-y divide-rule border-y border-rule text-[11px]">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-ink-2">{report.mutualDetail}</span>
                      <strong className="font-bold text-ok">
                        {counts.mutual.toLocaleString(reportLocale)} {report.accounts} ({mutualPct}
                        %)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-ink-2">{report.followBackRate}</span>
                      <strong className="font-bold text-cool">{followBackRate}%</strong>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-ink-2">{report.netDifference}</span>
                      <strong className="font-bold text-ink">
                        {netDiff >= 0 ? '+' : ''}
                        {netDiff.toLocaleString(reportLocale)} {report.accounts}
                      </strong>
                    </div>
                  </div>
                </>
              )}

              {options.includeDiffSection && comparisonSummary && (
                <div className="mt-3 rounded border border-rule bg-accent-soft px-3 py-2 text-[11px]">
                  <p className="font-bold text-accent">{report.comparisonTitle}</p>
                  <p className="wrap-anywhere text-ink-2">{comparisonSummary.reference}</p>
                  <p className="text-ink-2">{comparisonSummary.counts}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper-3 px-6 py-2 text-[9px] text-muted">
            <span>
              © 2026 IG Follow Analyzer • {report.affiliation} • {report.snapshotNotice}
            </span>
            <span className="shrink-0 font-bold text-ink">
              {report.page} {page.pageNumber} / {totalDocumentPages}
            </span>
          </div>
        </div>
      );
    }

    const isContinuation = page.startIndex > 0;

    return (
      <div
        lang={reportLanguage}
        className="pdf-sheet-font flex flex-col justify-between overflow-hidden rounded-lg border border-rule bg-paper-2 text-ink shadow-sm"
        style={{ width: A4_WIDTH, height: A4_HEIGHT }}
      >
        <div>
          <div className="h-1.5 w-full" style={{ backgroundColor: page.accent }} />
          <div className="p-7">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2.5">
              <h3 className="text-[15px] font-bold leading-tight" style={{ color: page.accent }}>
                {page.sectionNumber}. {page.title} (
                {page.totalInCategory.toLocaleString(reportLocale)} {report.accounts})
                {isContinuation ? reportT(' — ต่อ', ' — continued') : ''}
              </h3>
              <span className="shrink-0 text-[10px] text-muted">
                {report.asOf} {snapshotDate}
              </span>
            </div>

            {page.rows.length === 0 ? (
              <p className="mt-4 text-[11px] text-muted">{report.empty}</p>
            ) : (
              <div className="mt-3 overflow-hidden border-y border-rule">
                <table className="w-full table-fixed border-collapse text-left text-[10px] leading-tight wrap-anywhere">
                  <colgroup>
                    <col className="w-[8%]" />
                    <col />
                    {options.includeTimestamps && <col className="w-[20%]" />}
                    <col className="w-[38%]" />
                  </colgroup>
                  <thead>
                    <tr
                      className="text-[10px]"
                      style={{ backgroundColor: page.fill, color: page.accent }}
                    >
                      <th className="px-2 py-1.5 font-bold">{report.rank}</th>
                      <th className="px-2 py-1.5 font-bold">{report.username}</th>
                      {options.includeTimestamps && (
                        <th className="px-2 py-1.5 font-bold">{page.dateHeader}</th>
                      )}
                      <th className="px-2 py-1.5 font-bold">{report.profileLink}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {page.rows.map((acc, idx) => (
                      <tr key={acc.handle} className={idx % 2 === 1 ? 'bg-paper-3' : 'bg-paper-2'}>
                        <td className="px-2 py-1 text-muted">{page.startIndex + idx + 1}</td>
                        <td className="px-2 py-1 font-bold text-ink">@{acc.handle}</td>
                        {options.includeTimestamps && (
                          <td className="px-2 py-1 text-ink-2">
                            {acc.timestamp
                              ? formatDate(new Date(acc.timestamp * 1000), reportLocale)
                              : '—'}
                          </td>
                        )}
                        <td className="px-2 py-1 text-cool">
                          <span>
                            instagram.com/{acc.handle}{' '}
                            <ExternalLink className="inline size-2.5" aria-hidden="true" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper-3 px-6 py-2 text-[9px] text-muted">
          <span>
            © 2026 IG Follow Analyzer • {report.affiliation} • {report.snapshotNotice}
          </span>
          <span className="shrink-0 font-bold text-ink">
            {report.page} {page.pageNumber} / {totalDocumentPages}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="product-wrap py-9 lg:py-14">
      <BackButton onNavigate={onNavigate} target="results" />
      <header className="flex flex-col justify-between gap-4 border-b border-rule pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-heading">
            {result.isDemoData
              ? t('สร้างรายงาน PDF ตัวอย่าง', 'Create a sample PDF report')
              : t('สร้างรายงาน PDF (ไทย / อังกฤษ)', 'Create a PDF report (Thai / English)')}
          </h1>
          <p className="text-base text-ink-2">
            {result.isDemoData
              ? t(
                  'เลือกหัวข้อ ภาษาของเอกสาร และดูตัวอย่างรายงานก่อนดาวน์โหลด',
                  'Choose sections and report language, preview the sample report, then download it.',
                )
              : t(
                  'เก็บรายงานไว้เปิดอ่านหรือพิมพ์ภายหลังได้ เลือกหัวข้อและภาษา ดูตัวอย่าง แล้วดาวน์โหลด PDF ลงเครื่องได้แม้ปิดประวัติอยู่',
                  'Keep a report to read or print later. Choose sections and language, preview the report, then download it to your device even if history is off.',
                )}
          </p>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Controls Panel */}
        <div className="rounded-[10px] border border-rule bg-paper-2 p-4 sm:p-6 lg:sticky lg:top-20 lg:col-span-5">
          {/* Quick Presets */}
          <div>
            <h2 className="text-base font-semibold text-ink">
              {t('1. เลือกชุดรายงานแบบด่วน', '1. Quick presets')}
            </h2>
            <div
              className="mt-3 grid grid-cols-3 gap-2"
              role="group"
              aria-label={t('ชุดรายงานด่วน', 'Report presets')}
            >
              {(
                [
                  {
                    id: 'recommended',
                    label: t('แบบแนะนำ', 'Recommended'),
                    sub: t('สรุป + 2 หมวด', 'Summary + 2 lists'),
                  },
                  {
                    id: 'unfollowers',
                    label: t('ไม่ฟอลกลับ', 'Doesn’t follow back'),
                    sub: t('สั้น กระชับ', 'Short report'),
                  },
                  {
                    id: 'complete',
                    label: t('ครบทุกหมวด', 'All categories'),
                    sub: t('รวมผู้ติดตาม', 'Includes followers'),
                  },
                ] as const
              ).map((preset) => {
                const selected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => applyPreset(preset.id)}
                    className={`flex min-h-13.5 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors ${
                      selected
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-rule bg-paper-3 text-ink hover:border-rule-2'
                    }`}
                  >
                    <span className="text-xs font-semibold sm:text-sm">{preset.label}</span>
                    <span className="mt-0.5 text-[11px] text-muted">{preset.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Section Checkboxes */}
          <div className="mt-6">
            <h2 className="text-base font-semibold text-ink">
              {t('2. ปรับหัวข้อเองได้', '2. Choose sections')}
            </h2>
            <div className="mt-3 space-y-2">
              {(
                [
                  {
                    key: 'includeSummary',
                    label: t('หน้าสรุปภาพรวมและกราฟวงกลม', 'Summary and relationship chart'),
                    badge: t('1 หน้า', '1 page'),
                  },
                  {
                    key: 'includeNotFollowingBack',
                    label: t('รายชื่อคนที่ไม่ติดตามคุณกลับ', 'Accounts that don’t follow you back'),
                    badge: `${counts.notFollowingBack.toLocaleString()}`,
                  },
                  {
                    key: 'includeNotFollowedBack',
                    label: t('รายชื่อคนที่คุณไม่ได้ติดตามกลับ', 'Accounts you don’t follow back'),
                    badge: `${counts.notFollowedBack.toLocaleString()}`,
                  },
                  {
                    key: 'includeAllFollowers',
                    label: t('รายชื่อผู้ติดตามทั้งหมด', 'All followers'),
                    hint: t('ไฟล์จะมีหลายหน้า', 'Multiple pages'),
                    badge: `${counts.followers.toLocaleString()}`,
                  },
                  ...(diff
                    ? [
                        {
                          key: 'includeDiffSection' as const,
                          label: t('สรุปผลเทียบสองไฟล์', 'Summary of changes between exports'),
                        },
                      ]
                    : []),
                  {
                    key: 'includeTimestamps',
                    label: t('แสดงคอลัมน์วันที่เริ่มติดตาม', 'Include follow dates'),
                  },
                ] as {
                  key: keyof PdfReportOptions;
                  label: string;
                  hint?: string;
                  badge?: string;
                }[]
              ).map((opt) => (
                <label
                  key={opt.key}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-rule bg-paper-3 px-3.5 py-2 text-sm text-ink transition-colors hover:border-accent"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={options[opt.key]}
                      onChange={() => toggle(opt.key)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        options[opt.key]
                          ? 'border-accent bg-accent text-accent-ink'
                          : 'border-rule-2 bg-paper'
                      }`}
                    >
                      {options[opt.key] && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{opt.label}</span>
                      {opt.hint && <span className="block text-xs text-muted">{opt.hint}</span>}
                    </span>
                  </span>
                  {opt.badge && (
                    <span className="measured shrink-0 rounded bg-paper px-2 py-0.5 text-xs font-medium text-muted">
                      {opt.badge}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Report Language */}
          <div className="mt-6">
            <h2 className="text-base font-semibold text-ink">
              {t('3. ภาษาของเอกสาร PDF', '3. PDF document language')}
            </h2>
            <div
              className="mt-3 grid grid-cols-2 gap-2"
              role="group"
              aria-label={t('เลือกภาษาของเอกสาร PDF', 'Choose PDF document language')}
            >
              {(
                [
                  { id: 'th', label: 'ภาษาไทย (TH)' },
                  { id: 'en', label: 'English (EN)' },
                ] as const
              ).map((langOpt) => {
                const selected = reportLanguage === langOpt.id;
                return (
                  <button
                    key={langOpt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setReportLanguage(langOpt.id)}
                    className={`min-h-11 cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-rule bg-paper-3 text-ink hover:border-rule-2'
                    }`}
                  >
                    {langOpt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live File Meta Summary */}
          <div className="mt-5 rounded-md border border-rule bg-paper-3 px-4 py-3 text-xs">
            <p className="font-medium text-ink">
              {hasAnySection
                ? t(
                    `ทั้งหมด ${totalDocumentPages.toLocaleString()} หน้า A4 · ${estimate.listedAccounts.toLocaleString()} บัญชี`,
                    `${totalDocumentPages.toLocaleString()} A4 pages · ${estimate.listedAccounts.toLocaleString()} accounts`,
                  )
                : t('ยังไม่ได้เลือกหัวข้อ', 'No sections selected')}
            </p>
            <p className="measured mt-1 truncate text-cool">{previewFileName}</p>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2.5">
            <NormalButton
              variant="primary"
              disabled={isGenerating || !hasAnySection}
              onClick={() => void handleDownloadLocalPdf()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('กำลังสร้างไฟล์ PDF…', 'Creating PDF…')}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t('ดาวน์โหลด PDF ลงเครื่อง', 'Download PDF')}
                </>
              )}
            </NormalButton>
          </div>

          {!hasAnySection && (
            <p className="mt-3 text-center text-xs text-accent">
              {t(
                'กรุณาเลือกอย่างน้อย 1 หัวข้อด้านบนเพื่อสร้างไฟล์ PDF',
                'Choose at least one section to create a PDF.',
              )}
            </p>
          )}

          {statusMsg && (
            <div
              role="status"
              className={`mt-4 flex items-start gap-2.5 rounded-md border p-3.5 text-xs leading-relaxed ${
                statusMsg.kind === 'success'
                  ? 'border-ok bg-ok-soft text-ok'
                  : 'border-bad bg-bad-soft text-bad'
              }`}
            >
              {statusMsg.kind === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{statusText}</span>
            </div>
          )}
        </div>

        {/* Right Live A4 Preview */}
        <div className="lg:col-span-7">
          <div className="rounded-[10px] border border-rule bg-paper-3 p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">
                  {t('ตัวอย่างเอกสาร A4', 'A4 report preview')}
                </span>
              </div>

              {hasAnySection && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper-2 p-1">
                    <button
                      type="button"
                      aria-label={t('หน้าก่อนหน้า', 'Previous page')}
                      disabled={safeInlineIndex <= 0}
                      onClick={() => setInlinePageIndex((i) => Math.max(0, i - 1))}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-ink transition-colors hover:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="measured px-2 text-xs font-medium text-ink">
                      {t('หน้า ', 'Page ')}
                      {safeInlineIndex + 1} / {totalPreviewPages}
                    </span>
                    <button
                      type="button"
                      aria-label={t('หน้าถัดไป', 'Next page')}
                      disabled={safeInlineIndex >= totalPreviewPages - 1}
                      onClick={() =>
                        setInlinePageIndex((i) => Math.min(totalPreviewPages - 1, i + 1))
                      }
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-ink transition-colors hover:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openLightboxAtPage(safeInlineIndex + 1)}
                    aria-label={t(
                      'ขยายดูตัวอย่างเอกสาร A4 ครบทุกหน้าแบบเต็มจอ',
                      'Open the full A4 report preview',
                    )}
                    className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-rule-2 bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('ขยายดูครบทุกหน้า', 'Preview all pages')}</span>
                  </button>
                </div>
              )}
            </div>

            <div
              ref={previewContainerRef}
              className="mx-auto w-full"
              style={{ maxWidth: A4_WIDTH }}
            >
              {!hasAnySection || !currentInlinePage ? (
                <div className="flex aspect-210/297 w-full items-center justify-center rounded-lg border border-dashed border-rule-2 bg-paper-2 p-8 text-center text-sm text-muted">
                  {t(
                    'เลือกหัวข้อด้านซ้ายเพื่อดูตัวอย่างหน้าเอกสาร PDF ขนาด A4',
                    'Choose a section to preview the A4 report.',
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={t(
                      'แตะเพื่อขยายดูตัวอย่างเอกสาร PDF ครบทุกหน้าแบบเต็มจอ',
                      'Open the full PDF preview',
                    )}
                    onClick={() => openLightboxAtPage(safeInlineIndex + 1)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLightboxAtPage(safeInlineIndex + 1);
                      }
                    }}
                    className="group relative mx-auto cursor-zoom-in overflow-hidden rounded-lg"
                    style={{
                      width: Math.round(A4_WIDTH * inlineScale),
                      height: Math.round(A4_HEIGHT * inlineScale),
                    }}
                  >
                    <div
                      style={{
                        width: A4_WIDTH,
                        height: A4_HEIGHT,
                        transform: `scale(${inlineScale})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      {renderA4Page(currentInlinePage)}
                    </div>
                  </div>
                  <p className="mt-2.5 text-center text-xs text-muted">
                    {t('แตะที่หน้ากระดาษหรือกด ', 'Tap the page or choose ')}
                    <strong className="text-ink">
                      {t('ขยายดูครบทุกหน้า', 'Preview all pages')}
                    </strong>{' '}
                    {t(' เพื่อเลื่อนดูหน้าต่อเนื่องในรายงาน', ' to scroll through the report.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Multi-Page Scrollable A4 Preview Lightbox */}
      {isZoomOpen && hasAnySection && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('ตัวอย่างเอกสาร PDF ขนาด A4 แบบขยายครบทุกหน้า', 'Full A4 report preview')}
          className="pdf-preview-dialog fixed inset-0 z-50 flex flex-col bg-paper/95 backdrop-blur-xs"
        >
          {/* Minimal Top Bar: Filename + Close */}
          <header className="pdf-preview-toolbar mobile-top-bar flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-xs text-ink sm:text-sm">
              <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate font-medium">{previewFileName}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="mobile-top-bar__action inline-flex min-h-9.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-rule bg-paper-2 px-3.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <X className="size-5 shrink-0 lg:size-4" aria-hidden="true" />
              <span className="sr-only lg:not-sr-only">{t('ปิด', 'Close')}</span>
            </button>
          </header>

          {/* Continuous Scrollable Stack of All A4 Pages */}
          <div
            ref={lightboxScrollRef}
            role="region"
            aria-label={t('หน้ารายงาน', 'Report pages')}
            tabIndex={0}
            onScroll={handleLightboxScroll}
            className="pdf-preview-scroll flex-1 overflow-auto overscroll-contain px-3 pt-2 pb-24 sm:px-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsZoomOpen(false);
            }}
          >
            <div className="flex w-max min-w-full flex-col items-center gap-6">
              {previewPages.map((page, idx) => (
                <div
                  key={`${page.kind}-${page.pageNumber}`}
                  ref={(el) => {
                    lightboxPageRefs.current[idx] = el;
                  }}
                  className="scroll-mt-4 overflow-hidden rounded-lg"
                  style={{
                    width: A4_WIDTH * lightboxScale,
                    height: A4_HEIGHT * lightboxScale,
                  }}
                >
                  <div
                    style={{
                      width: A4_WIDTH,
                      height: A4_HEIGHT,
                      transform: `scale(${lightboxScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {renderA4Page(page)}
                  </div>
                </div>
              ))}

              {truncatedPages > 0 && (
                <p
                  className="rounded-lg border border-rule bg-paper-2 px-4 py-2.5 text-center text-xs text-muted"
                  style={{ maxWidth: A4_WIDTH * lightboxFitScale }}
                >
                  {t('แสดงตัวอย่างครบ ', 'Previewing the first ')}
                  {MAX_PREVIEW_PAGES}
                  {t('หน้าแรก (มีอีก ', ' pages (')}
                  {truncatedPages}
                  {t(
                    'หน้า) — กดดาวน์โหลด PDF ลงเครื่องเพื่อดูครบทั้ง ',
                    ' more). Download the PDF to see all ',
                  )}
                  {totalDocumentPages}
                  {t('หน้าครับ', ' pages.')}
                </p>
              )}
            </div>
          </div>

          {/* Floating Bottom-Center Preview Controls */}
          <div className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-4">
            <div className="pointer-events-auto inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-rule-2 bg-paper-2/95 px-2.5 py-1.5 shadow-2xl backdrop-blur-md">
              <div className="inline-flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label={t('เลื่อนไปหน้าก่อนหน้า', 'Scroll to previous page')}
                  disabled={lightboxPage <= 1}
                  onClick={() => scrollLightboxToPage(lightboxPage - 1)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-3 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="measured min-w-19.5 px-1.5 text-center text-xs font-semibold text-ink">
                  {t('หน้า ', 'Page ')}
                  {lightboxPage} / {totalPreviewPages}
                </span>
                <button
                  type="button"
                  aria-label={t('เลื่อนไปหน้าถัดไป', 'Scroll to next page')}
                  disabled={lightboxPage >= totalPreviewPages}
                  onClick={() => scrollLightboxToPage(lightboxPage + 1)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-3 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <span className="h-5 w-px bg-rule" aria-hidden="true" />

              <div className="inline-flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label={t('ย่อขนาดเอกสาร', 'Zoom out')}
                  disabled={zoomPercent <= 60}
                  onClick={() => setZoomPercent((z) => Math.max(60, z - 20))}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-3 disabled:opacity-40"
                >
                  <ZoomOut className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPercent(100)}
                  aria-label={t('ปรับให้พอดีกับความกว้าง', 'Fit to width')}
                  className="measured min-w-17 cursor-pointer rounded-full px-1.5 py-1 text-center text-xs font-semibold text-ink transition-colors hover:bg-paper-3"
                >
                  {zoomPercent === 100 ? t('พอดีจอ', 'Fit width') : `${zoomPercent}%`}
                </button>
                <button
                  type="button"
                  aria-label={t('ขยายขนาดเอกสาร', 'Zoom in')}
                  disabled={zoomPercent >= 180}
                  onClick={() => setZoomPercent((z) => Math.min(180, z + 20))}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-3 disabled:opacity-40"
                >
                  <ZoomIn className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
