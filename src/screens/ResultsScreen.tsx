import {
  AlertTriangle,
  ArrowDown,
  ArrowDownNarrowWide,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileArchive,
  FileText,
  History,
  Info,
  Search,
  Upload,
  User,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageId } from '../components/AppShell';
import {
  ComparisonFiles,
  type ComparisonFilesState,
  type InspectedComparisonSide,
} from '../components/ComparisonFiles';
import { FollowerTimeline } from '../components/FollowerTimeline';
import { NormalButton } from '../components/NormalButton';
import { RelationshipOverview } from '../components/RelationshipOverview';
import type { RelationshipKey } from '../data/relationshipMetrics';
import { getFollowerComparisonRisk } from '../lib/comparison';
import { formatAnalysisTime, formatDate, formatSnapshotDate } from '../lib/dates';
import { buildSafeProfileHref } from '../lib/igParser';
import { useLanguage } from '../lib/language';
import { exportDateRangeHref } from '../lib/routes';
import type { UploadMode } from './UploadScreen';
import type { AccountEntry, AnalysisResult, HistoryDiff } from '../types/analyzer';

interface ResultsScreenProps {
  result: AnalysisResult;
  diff: HistoryDiff | null;
  comparison: ComparisonFilesState | null;
  comparisonStatus: 'off' | 'waiting' | 'ready' | 'unknown-owner';
  onSelectComparison: (id: string | null) => void;
  onNavigate: (id: PageId) => void;
  isStandalone?: boolean;
  onStartUpload?: (mode: UploadMode) => void;
  onSaveStandaloneToHistory?: () => void;
  initialCategory?: RelationshipKey;
}

type ComparisonKey = 'recentUnfollowers' | 'newFollowers';
type SegmentKey = RelationshipKey | ComparisonKey;

const PAGE_SIZE = 25;

export function ResultsScreen({
  result,
  diff,
  comparison,
  comparisonStatus,
  onSelectComparison,
  onNavigate,
  isStandalone = false,
  onStartUpload,
  onSaveStandaloneToHistory,
  initialCategory,
}: ResultsScreenProps) {
  const { t, locale } = useLanguage();
  const fileName = result.sourceFileName;
  const zipExtension = fileName.match(/\.zip$/i)?.[0] ?? '';
  const showComparisonPrompt = !diff && !result.isDemoData && !isStandalone;
  const canUploadToCompare = !result.isDemoData && (comparisonStatus === 'ready' || Boolean(diff));
  const showSingleFileUploadButton =
    !result.isDemoData && !isStandalone && (Boolean(diff) || comparisonStatus === 'ready');
  const compareUploadLabel = t('อัปโหลด ZIP เพื่อเทียบ', 'Upload a ZIP to compare');
  const openUpload = (mode: UploadMode) =>
    onStartUpload ? onStartUpload(mode) : onNavigate('upload');
  const comparisonPrompt = {
    off: {
      description: t(
        'เปิดบันทึกประวัติและจำรายชื่อ เพื่อเก็บผลรอบนี้ไว้เทียบกับ ZIP รอบถัดไปของบัญชีเดิม',
        'Turn on local history and account list storage to save this result for comparison with your next ZIP from the same account.',
      ),
      action: t('ตั้งค่าประวัติบนเครื่อง', 'Set up local history'),
      page: 'history',
    },
    ready: {
      description: t(
        'บันทึกรายชื่อรอบนี้ไว้แล้ว อัปโหลด ZIP รอบใหม่ของบัญชีเดิมเพื่อดูว่าใครติดตามใหม่หรือหายจากรายชื่อ',
        'This list is saved. Upload a newer ZIP from the same account to see who followed you or dropped off the list.',
      ),
      action: compareUploadLabel,
      page: 'upload',
    },
    waiting: {
      description: t(
        'เปิดการจำรายชื่อแล้ว อัปโหลด ZIP ของบัญชีนี้เพื่อเก็บรายชื่อไว้เทียบในรอบถัดไป',
        'Account list storage is on. Upload a ZIP from this account to save a list for next time.',
      ),
      action: t('อัปโหลด ZIP เพื่อเก็บรายชื่อ', 'Upload a ZIP to save a follower list'),
      page: 'upload',
    },
    'unknown-owner': {
      description: t(
        'อัปโหลด ZIP โดยใช้ชื่อไฟล์เดิมจาก Instagram เพื่อให้ระบบระบุบัญชีและจับคู่ไฟล์ได้',
        'Upload a ZIP with its original Instagram filename so we can identify the account and match exports.',
      ),
      action: t('อัปโหลด ZIP ชื่อเดิม', 'Upload a ZIP with its original filename'),
      page: 'upload',
    },
  } as const;
  const prompt = comparisonPrompt[comparisonStatus];
  const [activeTab, setActiveTab] = useState<SegmentKey | null>(initialCategory ?? null);
  const [inspectedSide, setInspectedSide] = useState<InspectedComparisonSide>('current');
  const effectiveInspectedSide: InspectedComparisonSide = comparison ? inspectedSide : 'current';
  const inspectedResult =
    effectiveInspectedSide === 'previous' && comparison ? comparison.previous.analysis : result;
  const handleInspectSide = (side: InspectedComparisonSide) => {
    setInspectedSide(side);
    if (activeTab !== 'recentUnfollowers' && activeTab !== 'newFollowers') {
      setPageIndex(0);
    }
  };
  const overviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'az' | 'za'>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const sortControlRef = useRef<HTMLDivElement>(null);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const sortOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const sortOptions = [
    { value: 'newest', label: t('วันที่ล่าสุดก่อน', 'Newest first') },
    { value: 'az', label: t('ชื่อบัญชี A–Z', 'Username A–Z') },
    { value: 'za', label: t('ชื่อบัญชี Z–A', 'Username Z–A') },
  ] as const;
  const selectedSortOption = sortOptions.find((option) => option.value === sortBy)!;

  useEffect(() => {
    if (!sortOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!sortControlRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSortOpen(false);
        sortTriggerRef.current?.focus();
      } else if (event.key === 'Tab') {
        setSortOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnKey);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnKey);
    };
  }, [sortOpen]);

  const focusSortOption = (index: number) => {
    sortOptionRefs.current[index]?.focus();
  };

  const openSortMenu = (index = sortOptions.findIndex((option) => option.value === sortBy)) => {
    setSortOpen(true);
    window.requestAnimationFrame(() => focusSortOption(index));
  };

  const { counts: currentCounts } = result;
  const inspectedCounts = inspectedResult.counts;
  const comparisonRisk =
    diff && !result.isDemoData ? getFollowerComparisonRisk(currentCounts.followers, diff) : null;
  const followerDropPercent =
    comparisonRisk?.kind === 'drop'
      ? comparisonRisk.fraction.toLocaleString(locale, {
          style: 'percent',
          maximumFractionDigits: 1,
        })
      : undefined;
  const selectCategory = (key: SegmentKey) => {
    setActiveTab(key);
    setPageIndex(0);
  };

  const jumpToCategory = (key: SegmentKey) => {
    selectCategory(key);
    window.requestAnimationFrame(() => {
      listHeadingRef.current?.focus({ preventScroll: true });
      if (typeof listHeadingRef.current?.scrollIntoView === 'function') {
        listHeadingRef.current.scrollIntoView({ block: 'start' });
      }
    });
  };

  const mayHaveLimitedDateRange = useMemo(() => {
    if (result.isDemoData || result.followers.length === 0) return false;
    let followerDateCount = 0;
    let minF = Infinity;
    let maxF = -Infinity;
    for (const { timestamp } of result.followers) {
      if (timestamp === undefined || timestamp <= 0) continue;
      followerDateCount++;
      minF = Math.min(minF, timestamp);
      maxF = Math.max(maxF, timestamp);
    }
    if (followerDateCount < 5) return false;
    const spanDays = (maxF - minF) / 86400;

    let minFg = minF;
    for (const { timestamp } of result.following) {
      if (timestamp !== undefined && timestamp > 0) minFg = Math.min(minFg, timestamp);
    }
    const followingOlderThanFollowers = minF - minFg > 180 * 86400;
    return (
      spanDays <= 370 &&
      (followingOlderThanFollowers || currentCounts.followers < currentCounts.following * 0.55)
    );
  }, [
    result.isDemoData,
    result.followers,
    result.following,
    currentCounts.followers,
    currentCounts.following,
  ]);

  const recentUnfollowerEntries: AccountEntry[] = useMemo(
    () =>
      (diff?.recentUnfollowers ?? []).map((handle) => ({
        handle,
        href: buildSafeProfileHref(handle),
        timestamp: diff?.unfollowerTimestamps.get(handle),
      })),
    [diff],
  );
  const newFollowerEntries = useMemo(() => {
    if (!diff) return [];
    const newHandles = new Set(diff.newFollowers);
    return result.followers.filter((entry) => newHandles.has(entry.handle));
  }, [diff, result.followers]);
  const comparisonTabs = [
    {
      key: 'newFollowers' as const,
      label: t('ติดตามใหม่', 'New followers'),
      description: t(
        'ไฟล์ที่ใช้เทียบไม่มีชื่อ → ไฟล์ที่กำลังดูมีชื่อ',
        'Absent from the comparison ZIP → Present in the ZIP you’re viewing',
      ),
      icon: UserPlus,
      tone: 'text-ok',
      iconSurface: 'bg-ok-soft',
      entries: newFollowerEntries,
    },
    {
      key: 'recentUnfollowers' as const,
      label: t('หายจากรายชื่อผู้ติดตาม', 'Missing from the follower list'),
      description: t(
        'ไฟล์ที่ใช้เทียบมีชื่อ → ไฟล์ที่กำลังดูไม่มีชื่อ',
        'Present in the comparison ZIP → Absent from the ZIP you’re viewing',
      ),
      icon: UserMinus,
      tone: 'text-bad',
      iconSurface: 'bg-bad-soft',
      entries: recentUnfollowerEntries,
    },
  ];

  const tabMeta: { key: SegmentKey; label: string; count: number; entries: AccountEntry[] }[] = [
    {
      key: 'notFollowingBack',
      label: t('ไม่ติดตามคุณกลับ', 'Not following you back'),
      count: inspectedCounts.notFollowingBack,
      entries: inspectedResult.notFollowingBack,
    },
    {
      key: 'notFollowedBack',
      label: t('คุณไม่ได้ติดตามกลับ', 'You don’t follow back'),
      count: inspectedCounts.notFollowedBack,
      entries: inspectedResult.notFollowedBack,
    },
    ...(diff ? comparisonTabs.map((tab) => ({ ...tab, count: tab.entries.length })) : []),
    {
      key: 'mutual',
      label: t('ติดตามกันทั้งสองฝ่าย', 'Mutual follows'),
      count: inspectedCounts.mutual,
      entries: inspectedResult.mutual,
    },
    {
      key: 'followers',
      label: t('ผู้ติดตามทั้งหมด', 'All followers'),
      count: inspectedCounts.followers,
      entries: inspectedResult.followers,
    },
    {
      key: 'following',
      label: t('กำลังติดตามทั้งหมด', 'All following'),
      count: inspectedCounts.following,
      entries: inspectedResult.following,
    },
  ];

  const currentTab = tabMeta.find((t) => t.key === activeTab) ?? tabMeta[0];

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@+/, '');
    const base = q
      ? currentTab.entries.filter((a) => a.handle.includes(q))
      : [...currentTab.entries];

    if (sortBy === 'az') {
      base.sort((a, b) => a.handle.localeCompare(b.handle));
    } else if (sortBy === 'za') {
      base.sort((a, b) => b.handle.localeCompare(a.handle));
    } else {
      base.sort(
        (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0) || a.handle.localeCompare(b.handle),
      );
    }
    return base;
  }, [currentTab.entries, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageStart = safePageIndex * PAGE_SIZE;
  const pagedList = filteredList.slice(pageStart, pageStart + PAGE_SIZE);

  const formatDateOrEmpty = (ts?: number) =>
    ts ? formatDate(new Date(ts * 1000), locale) : t('ไม่มีวันที่', 'No date');

  const isMutualTab = currentTab.key === 'mutual';
  const isComparisonTab =
    currentTab.key === 'recentUnfollowers' || currentTab.key === 'newFollowers';
  const previousDate = diff ? formatSnapshotDate(diff.previousDateLabel, locale) : '';
  const currentDate = formatSnapshotDate(result.snapshotDateLabel, locale);
  const showTimelineTime = previousDate === currentDate && comparison;
  const timelineMilliseconds =
    comparison?.previous.analysis.analyzedAtIso.slice(0, 19) === result.analyzedAtIso.slice(0, 19);
  const timelinePreviousDate = showTimelineTime
    ? `${previousDate} · ${formatAnalysisTime(comparison.previous.analysis.analyzedAtIso, locale, timelineMilliseconds)}`
    : previousDate;
  const timelineCurrentDate = showTimelineTime
    ? `${currentDate} · ${formatAnalysisTime(result.analyzedAtIso, locale, timelineMilliseconds)}`
    : currentDate;
  const isFollowingSideTab =
    currentTab.key === 'notFollowingBack' || currentTab.key === 'following';
  const singleDateColumnLabel = isFollowingSideTab
    ? t('คุณเริ่มติดตามเมื่อ', 'Date you followed them')
    : t('เขาเริ่มติดตามคุณเมื่อ', 'Date they followed you');
  const singleDateMobilePrefix = isFollowingSideTab
    ? t('คุณเริ่มติดตาม', 'You followed them')
    : t('เขาเริ่มติดตามคุณ', 'They followed you');

  const formatLabel =
    inspectedResult.detectedFiles.format === 'json'
      ? 'JSON'
      : inspectedResult.detectedFiles.format === 'html'
        ? 'HTML'
        : 'JSON + HTML';
  const hasHtmlLimitation = inspectedResult.detectedFiles.format !== 'json';

  return (
    <div className="product-wrap pt-3 pb-9 lg:pt-4 lg:pb-14">
      <header>
        <h1 className="page-heading">
          {result.isDemoData
            ? t('ตัวอย่างผลการวิเคราะห์ผู้ติดตาม', 'Sample follower analysis')
            : t('ผลการวิเคราะห์ผู้ติดตาม', 'Follower analysis')}
        </h1>
        {result.isDemoData && (
          <p className="text-sm text-ink-2">
            {t(
              'ใช้ข้อมูลสมมติและไม่บันทึกลงประวัติ',
              'Sample data is fictional and isn’t saved to history.',
            )}
          </p>
        )}
        <NormalButton
          variant="primary"
          className="mt-4 w-full sm:hidden"
          onClick={() => {
            const heading = overviewHeadingRef.current;
            heading?.focus({ preventScroll: true });
            heading?.scrollIntoView?.({ block: 'start' });
          }}
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
          {t('ดูภาพรวมบัญชีและรายชื่อ', 'See account totals and lists')}
        </NormalButton>
      </header>

      <div className="mt-4 flex flex-col gap-4 rounded-[10px] border border-rule bg-paper-2 p-5 sm:p-6 lg:flex-row lg:items-center">
        <dl
          className={`grid min-w-0 flex-1 gap-3 text-xs ${comparison ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}
        >
          <div className="flex items-start gap-2.5">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-cool" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-muted">{t('บัญชีเจ้าของไฟล์', 'Account')}</dt>
              <dd className="mt-0.5 truncate font-semibold text-cool">
                {result.ownerHandle
                  ? `@${result.ownerHandle}`
                  : t('ไม่พบชื่อบัญชีจากชื่อไฟล์', 'Not in filename')}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <FileArchive className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0">
              {comparison ? (
                <>
                  <dt className="text-muted">{t('รูปแบบไฟล์', 'Export format')}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatLabel}</dd>
                </>
              ) : (
                <>
                  <dt className="flex items-center gap-1.5 text-muted">
                    <span>{t('ไฟล์ที่วิเคราะห์', 'Source ZIP')}</span>
                    <span className="measured rounded border border-rule bg-paper-2 px-1.5 py-px text-[10px] font-semibold text-ink-2">
                      {formatLabel}
                    </span>
                  </dt>
                  <dd
                    className="measured mt-0.5 flex min-w-0 font-medium text-ink"
                    title={fileName}
                  >
                    <span className="min-w-0 truncate">
                      {fileName.slice(0, fileName.length - zipExtension.length)}
                    </span>
                    {zipExtension && <span className="shrink-0">{zipExtension}</span>}
                  </dd>
                </>
              )}
            </div>
          </div>

          {!comparison && (
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-muted">{t('ข้อมูล ณ วันที่', 'Data as of')}</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {formatSnapshotDate(result.snapshotDateLabel, locale)}
                </dd>
              </div>
            </div>
          )}
        </dl>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:shrink-0">
          {isStandalone ? (
            <NormalButton
              variant="secondary"
              onClick={() => openUpload('single')}
              className="w-full sm:w-auto"
            >
              <Upload className="size-4" aria-hidden="true" />
              {t('อัปโหลดไฟล์ใหม่', 'Analyze another ZIP')}
            </NormalButton>
          ) : (
            (!showComparisonPrompt || comparisonStatus === 'off') && (
              <NormalButton
                variant={canUploadToCompare ? 'cool' : 'secondary'}
                onClick={() => openUpload(canUploadToCompare ? 'compare' : 'single')}
                className="w-full sm:w-auto"
              >
                <Upload className="size-4" aria-hidden="true" />
                {canUploadToCompare ? compareUploadLabel : t('อัปโหลดไฟล์ใหม่', 'Analyze another ZIP')}
              </NormalButton>
            )
          )}
          {showSingleFileUploadButton && (
            <NormalButton
              variant="secondary"
              onClick={() => openUpload('single')}
              className="w-full sm:w-auto"
            >
              <FileArchive className="size-4" aria-hidden="true" />
              {t('วิเคราะห์ไฟล์เดี่ยว (ไม่เทียบ)', 'Analyze single ZIP')}
            </NormalButton>
          )}
          <NormalButton
            variant={result.isDemoData ? 'primary' : 'secondary'}
            onClick={() => onNavigate('pdf')}
            className="w-full sm:w-auto"
          >
            <FileText className="size-4" aria-hidden="true" />
            {result.isDemoData
              ? t('สร้างรายงาน PDF ตัวอย่าง', 'Create a sample PDF report')
              : t('สร้างรายงาน PDF', 'Create PDF report')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </NormalButton>
        </div>
      </div>

      {showComparisonPrompt && (
        <section
          aria-label={t('ขั้นตอนถัดไปสำหรับเทียบไฟล์', 'Next step for comparing exports')}
          className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[10px] border border-rule bg-paper-3 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3 text-sm text-ink-2">
            <History className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <span>{prompt.description}</span>
          </div>
          <NormalButton
            variant={canUploadToCompare ? 'cool' : 'secondary'}
            onClick={() =>
              prompt.page === 'upload' ? openUpload('compare') : onNavigate(prompt.page)
            }
            className="w-full text-xs sm:w-auto sm:shrink-0"
          >
            {prompt.action}
          </NormalButton>
        </section>
      )}

      {isStandalone && !result.isDemoData && (
        <section
          aria-label={t('สถานะการวิเคราะห์ไฟล์เดี่ยว', 'Single-file analysis status')}
          className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[10px] border border-rule bg-paper-3 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3 text-sm text-ink-2">
            <FileArchive className="mt-0.5 size-5 shrink-0 text-cool" aria-hidden="true" />
            <span>
              {t(
                'กำลังดูผลแบบไฟล์เดี่ยว (ไม่ได้เทียบและไม่ได้บันทึกลงประวัติบนเครื่อง)',
                'Viewing in single-file mode (not compared and not saved to local history).',
              )}
            </span>
          </div>
          {onSaveStandaloneToHistory && (
            <NormalButton
              variant="cool"
              onClick={onSaveStandaloneToHistory}
              className="w-full text-xs sm:w-auto sm:shrink-0"
            >
              {comparisonStatus === 'off'
                ? t('บันทึกลงประวัติ', 'Save to history')
                : t('บันทึกและเทียบกับประวัติ', 'Save & compare with history')}
            </NormalButton>
          )}
        </section>
      )}

      {mayHaveLimitedDateRange && comparisonRisk === null && (
        <section
          role="note"
          className="mt-6 flex flex-col justify-between gap-4 rounded-[10px] border border-accent bg-accent-soft p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="font-medium text-accent">
                {t(
                  'รายชื่อผู้ติดตามใน ZIP อาจครอบคลุมแค่บางช่วง',
                  'The ZIP may only cover part of your follower list',
                )}
              </p>
              <p className="mt-0.5 text-ink-2">
                {t(
                  'ช่วงสั้นหรือช่วงที่กำหนดเองอาจทำให้บางบัญชีไม่อยู่ในไฟล์ วันที่ติดตามใน ZIP บอกไม่ได้ว่าคุณตั้งช่วงไหน หากยอดต่ำกว่าหน้าโปรไฟล์ ให้ขอ ZIP ใหม่โดยเลือก ตลอดเวลา (All time)',
                  'A short or custom range may leave some accounts out. Follow dates in the ZIP can’t tell us which range you selected. If the count is lower than on your profile, request a fresh ZIP with Date range set to All time.',
                )}
              </p>
            </div>
          </div>
          <a href={exportDateRangeHref} className="btn btn--secondary shrink-0 text-xs">
            {t('ดูขั้นตอนเลือกช่วงตลอดเวลา', 'How to select All time')}
          </a>
        </section>
      )}

      {diff && (
        <section
          aria-labelledby="comparison-heading"
          className="mt-5 rounded-[10px] border border-rule bg-paper-2 p-4 sm:p-6"
        >
          <h2 id="comparison-heading" className="text-xl font-semibold text-ink">
            {t('รายชื่อผู้ติดตามเปลี่ยนไปยังไง?', 'How did your follower list change?')}
          </h2>
          {comparison && (
            <ComparisonFiles
              current={result}
              comparison={comparison}
              inspectedSide={effectiveInspectedSide}
              onInspectSide={handleInspectSide}
              onSelect={(id) => {
                if (isComparisonTab || effectiveInspectedSide === 'previous') setPageIndex(0);
                onSelectComparison(id);
              }}
            />
          )}
          {comparisonRisk && (
            <div
              role="status"
              className="mt-4 flex flex-col items-start gap-3 rounded-lg border border-accent/45 bg-accent-soft p-4 sm:flex-row sm:justify-between"
            >
              <div className="flex items-start gap-3 text-sm leading-relaxed">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">
                    {comparisonRisk.kind === 'drop'
                      ? t('ยอดผู้ติดตามลดลงผิดสังเกต', 'Large drop in follower count')
                      : t(
                          'รายชื่อผู้ติดตามเปลี่ยนมากทั้งสองฝั่ง',
                          'Many follower names changed in both lists',
                        )}
                  </p>
                  <p className="mt-1 text-ink-2">
                    {comparisonRisk.kind === 'drop'
                      ? t(
                          `ZIP ที่เปิดอยู่มีผู้ติดตามน้อยกว่า ZIP ที่ใช้เทียบ ${followerDropPercent} อาจมาจากรายชื่อไม่ครบหรือการเปลี่ยนแปลงจริง`,
                          `The open ZIP has ${followerDropPercent} fewer followers than the comparison ZIP. This may reflect an incomplete list or a real change.`,
                        )
                      : t(
                          `พบชื่อใหม่ ${comparisonRisk.added.toLocaleString(locale)} บัญชี และไม่พบชื่อเดิม ${comparisonRisk.missing.toLocaleString(locale)} บัญชี ยอดรวมอาจเปลี่ยนเพียงเล็กน้อยแม้รายชื่อจะเปลี่ยนมาก`,
                          `${comparisonRisk.added.toLocaleString(locale)} names appear only in the open ZIP, and ${comparisonRisk.missing.toLocaleString(locale)} appear only in the comparison ZIP. A small net change can hide large differences in the lists.`,
                        )}{' '}
                    {t(
                      'ตรวจว่าทั้งสอง ZIP มาจากบัญชีเดียวกันและตั้งช่วงวันที่เป็น ตลอดเวลา (All time) ก่อนสรุปว่าใครเลิกติดตาม',
                      'Check that both ZIPs came from the same account and used the All time date range before drawing conclusions about unfollows.',
                    )}
                  </p>
                </div>
              </div>
              <a href={exportDateRangeHref} className="btn btn--secondary shrink-0 text-xs">
                {t('ดูขั้นตอนเลือกช่วงตลอดเวลา', 'How to select All time')}
              </a>
            </div>
          )}
          {!result.isDemoData && !comparisonRisk && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t(
                'ก่อนใช้ผลเทียบ ตรวจว่า ZIP ทั้งสองเลือกช่วง ตลอดเวลา (All time) ช่วงวันที่จำกัดอาจทำให้ชื่อหายจากไฟล์แม้บัญชียังติดตามอยู่',
                'Before using these results, check that both ZIPs were exported with All time. A limited date range can leave accounts out of the file.',
              )}
            </p>
          )}
          <div className="mt-3 grid gap-4 sm:grid-cols-2 sm:gap-3">
            {comparisonTabs.map(
              ({ key, label, description, icon: Icon, tone, iconSurface, entries }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={activeTab === key}
                  aria-labelledby={`${key}-label ${key}-count`}
                  aria-describedby={`${key}-description`}
                  onClick={() => jumpToCategory(key)}
                  className={`comparison-card flex min-w-0 cursor-pointer flex-col justify-between gap-3 rounded-lg border p-4 text-left transition-colors sm:p-5 ${tone}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid min-w-0 gap-1.5">
                      <span id={`${key}-label`} className="text-sm font-semibold text-ink-2">
                        {label}
                      </span>
                      <span
                        id={`${key}-count`}
                        className="measured text-3xl leading-none font-bold text-ink tabular-nums"
                      >
                        {entries.length.toLocaleString(locale)}
                      </span>
                    </span>
                    <span
                      className={`inline-grid size-11 shrink-0 place-items-center rounded-xl border border-current/20 ${iconSurface}`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="flex items-end justify-between gap-2">
                    <span id={`${key}-description`} className="text-sm leading-relaxed text-muted">
                      {description}
                    </span>
                    <ArrowRight className="mb-0.5 size-4 shrink-0" aria-hidden="true" />
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-ink-2">{t('ตัวอย่างสมมติ', 'Example')}</p>
              <ul className="list-disc ps-4">
                <li>{t('ZIP วันที่ 1 พ.ย. มีชื่อบัญชี A', 'Account A appears in the Nov. 1 ZIP.')}</li>
                <li>
                  {t('ZIP วันที่ 8 พ.ย. ไม่พบชื่อบัญชี A', 'Account A is missing from the Nov. 8 ZIP.')}
                </li>
              </ul>
              <p>
                {t(
                  'พอเทียบสองไฟล์ เว็บจะแสดงบัญชี A ในหมวด “หายจากรายชื่อผู้ติดตาม”',
                  'When you compare the two ZIPs, Account A appears under “Missing from the follower list.”',
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      <section
        className="mt-7 rounded-[10px] border border-rule bg-paper-2 p-5 sm:p-7"
        aria-labelledby="overview-heading"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="overview-heading"
            ref={overviewHeadingRef}
            tabIndex={-1}
            className="scroll-mt-4 text-xl text-ink"
          >
            {t('ภาพรวมบัญชี', 'Account overview')}
          </h2>
          {comparison && (
            <div
              role="group"
              aria-label={t(
                'สลับดูภาพรวมบัญชีของไฟล์ในชุดเทียบ',
                'Switch which compared ZIP is shown in Account overview',
              )}
              className="inline-flex flex-wrap gap-1 rounded-lg border border-rule bg-paper-3 p-1"
            >
              <button
                type="button"
                aria-pressed={effectiveInspectedSide === 'current'}
                onClick={() => handleInspectSide('current')}
                className="comparison-switch-btn min-h-9 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium"
              >
                {t(`ไฟล์ที่กำลังดู (${currentDate})`, `Current ZIP (${currentDate})`)}
              </button>
              <button
                type="button"
                aria-pressed={effectiveInspectedSide === 'previous'}
                onClick={() => handleInspectSide('previous')}
                className="comparison-switch-btn min-h-9 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium"
              >
                {t(`ไฟล์ที่ใช้เทียบ (${previousDate})`, `Comparison ZIP (${previousDate})`)}
              </button>
            </div>
          )}
        </div>
        <RelationshipOverview
          counts={inspectedCounts}
          selected={
            activeTab === 'recentUnfollowers' || activeTab === 'newFollowers' ? null : activeTab
          }
          onSelect={jumpToCategory}
        />
        {activeTab === null && (
          <p className="mt-5 border-t border-rule pt-4 text-sm text-muted">
            {t(
              'กดเลือกการ์ดตัวเลขด้านบน เพื่อเปิดดูรายชื่อบัญชีของหมวดนั้น',
              'Select a card to see the accounts in that category.',
            )}
          </p>
        )}
      </section>

      {hasHtmlLimitation && (
        <section
          role="note"
          className="mt-6 flex flex-col justify-between gap-4 rounded-[10px] border border-cool/40 bg-cool-soft p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-cool" aria-hidden="true" />
            <div>
              <p className="font-medium text-cool">
                {t(
                  'ข้อจำกัดของไฟล์รูปแบบ HTML: แยกหมวดรายชื่อได้ครบ แต่ไม่มีข้อมูลวันที่เริ่มติดตาม',
                  'HTML exports contain account lists but no usable follow dates',
                )}
              </p>
              <p className="mt-0.5 text-ink-2">
                {t(
                  'ไฟล์ HTML ไม่มีวันที่ติดตามในรูปแบบที่เว็บอ่านได้ จึงใช้วันที่ช่วยสังเกตว่ารายชื่ออาจไม่ครบไม่ได้ หากต้องการดูวันที่ติดตาม ให้ขอไฟล์ใหม่โดยเลือก ตลอดเวลา (All time) และรูปแบบ ',
                  'HTML lacks usable follow dates, so the app can’t use dates to flag potentially incomplete lists. For follow dates, request a new export with All time and the ',
                )}
                <strong className="text-ink">JSON</strong>
                {t('', ' format.')}
              </p>
            </div>
          </div>
          <NormalButton
            variant="secondary"
            onClick={() => onNavigate('how-it-works')}
            className="shrink-0 text-xs"
          >
            {t('ดูวิธีเลือกรูปแบบ JSON', 'How to choose JSON')}
          </NormalButton>
        </section>
      )}

      {activeTab !== null &&
        (() => {
          const badgeTheme: Record<SegmentKey, { dot: string; countPill: string }> = {
            notFollowingBack: {
              dot: 'bg-accent',
              countPill: 'border-accent/40 bg-accent-soft text-accent',
            },
            notFollowedBack: {
              dot: 'bg-cool',
              countPill: 'border-cool/40 bg-cool-soft text-cool',
            },
            recentUnfollowers: {
              dot: 'bg-bad',
              countPill: 'border-bad/40 bg-bad-soft text-bad',
            },
            newFollowers: {
              dot: 'bg-ok',
              countPill: 'border-ok/40 bg-ok-soft text-ok',
            },
            mutual: {
              dot: 'bg-ok',
              countPill: 'border-ok/40 bg-ok-soft text-ok',
            },
            followers: {
              dot: 'bg-ink',
              countPill: 'border-rule-2 bg-paper-3 text-ink',
            },
            following: {
              dot: 'bg-cool',
              countPill: 'border-cool/40 bg-cool-soft text-cool',
            },
          };
          const activeTheme = badgeTheme[currentTab.key];

          return (
            <section
              aria-label={t(`รายชื่อบัญชีหมวด${currentTab.label}`, `Accounts in ${currentTab.label}`)}
              className="mt-7 rounded-[10px] border border-rule bg-paper-2 p-5 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${activeTheme.dot}`}
                      aria-hidden="true"
                    />
                    <h2
                      ref={listHeadingRef}
                      tabIndex={-1}
                      className="scroll-mt-24 text-xl font-semibold text-ink"
                    >
                      {currentTab.label}
                    </h2>
                    <span
                      className={`measured rounded-md border px-2 py-0.5 text-xs font-semibold ${activeTheme.countPill}`}
                    >
                      {currentTab.count.toLocaleString(locale)}
                      {t(' บัญชี', ' accounts')}
                    </span>
                    {!isComparisonTab && effectiveInspectedSide === 'previous' && comparison && (
                      <span className="rounded-md border border-cool/35 bg-cool-soft px-2 py-0.5 text-xs font-medium text-cool">
                        {t(
                          `ข้อมูลจากไฟล์ที่ใช้เทียบ (${previousDate})`,
                          `From comparison ZIP (${previousDate})`,
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-muted">
                    {isComparisonTab
                      ? t(
                          'เปิดไทม์ไลน์เพื่อดูว่าพบชื่อบัญชีนี้ในไฟล์ไหนบ้าง',
                          'Open a timeline to see which exports included the account.',
                        )
                      : t(
                          'ค้นหา กรอง และกดเปิดโปรไฟล์ Instagram เพื่อตรวจสอบด้วยตัวเอง',
                          'Search, sort, or open a profile on Instagram.',
                        )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="inline-flex min-h-9 cursor-pointer items-center rounded-md border border-rule bg-paper-3 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-rule-2 hover:text-ink"
                >
                  {t('ซ่อนรายชื่อ', 'Hide list')}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPageIndex(0);
                    }}
                    placeholder={t('ค้นหาชื่อบัญชี (@username)…', 'Search by username…')}
                    aria-label={t('ค้นหาชื่อบัญชี', 'Search by username')}
                    className="min-h-11 w-full rounded-md border border-rule-2 bg-paper-3 pr-4 pl-10 text-sm text-ink placeholder:text-muted focus:border-accent"
                  />
                </div>

                <div ref={sortControlRef} className="relative sm:shrink-0">
                  <ArrowDownNarrowWide
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <button
                    ref={sortTriggerRef}
                    type="button"
                    aria-label={t('เรียงลำดับรายชื่อ', 'Sort accounts')}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    aria-controls="account-sort-options"
                    onClick={() => {
                      if (sortOpen) {
                        setSortOpen(false);
                      } else {
                        openSortMenu();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        openSortMenu();
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        openSortMenu(sortOptions.length - 1);
                      } else if (event.key === 'Home') {
                        event.preventDefault();
                        openSortMenu(0);
                      } else if (event.key === 'End') {
                        event.preventDefault();
                        openSortMenu(sortOptions.length - 1);
                      }
                    }}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-rule-2 bg-paper-3 pr-3.5 pl-10 text-left text-sm text-ink hover:border-muted focus:border-accent sm:min-w-48"
                  >
                    <span>{selectedSortOption.label}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {sortOpen && (
                    <div
                      id="account-sort-options"
                      role="listbox"
                      aria-label={t('เรียงลำดับรายชื่อ', 'Sort accounts')}
                      className="absolute top-full right-0 z-30 mt-1 w-full overflow-hidden rounded-md border border-rule-2 bg-paper-3 py-1 shadow-xl"
                    >
                      {sortOptions.map((option, index) => (
                        <button
                          key={option.value}
                          ref={(element) => {
                            sortOptionRefs.current[index] = element;
                          }}
                          type="button"
                          role="option"
                          aria-selected={sortBy === option.value}
                          tabIndex={sortBy === option.value ? 0 : -1}
                          onClick={() => {
                            setSortBy(option.value);
                            setPageIndex(0);
                            setSortOpen(false);
                            sortTriggerRef.current?.focus();
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'ArrowDown') {
                              event.preventDefault();
                              focusSortOption((index + 1) % sortOptions.length);
                            } else if (event.key === 'ArrowUp') {
                              event.preventDefault();
                              focusSortOption(
                                (index - 1 + sortOptions.length) % sortOptions.length,
                              );
                            } else if (event.key === 'Home') {
                              event.preventDefault();
                              focusSortOption(0);
                            } else if (event.key === 'End') {
                              event.preventDefault();
                              focusSortOption(sortOptions.length - 1);
                            }
                          }}
                          className={`flex min-h-10 w-full cursor-pointer items-center px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ${sortBy === option.value ? 'bg-paper-2 font-medium text-accent' : 'text-ink hover:bg-paper-2'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <p role="status">
                  {t('พบ ', 'Found ')}
                  {filteredList.length.toLocaleString(locale)}
                  {t(' บัญชีในหมวด', ' accounts in ')}
                  {currentTab.label}
                </p>
                {filteredList.length > PAGE_SIZE && (
                  <p className="measured text-xs text-cool">
                    {t('แสดง ', 'Showing ')}
                    {pageStart + 1}
                    {t(' ถึง ', ' to ')}
                    {Math.min(pageStart + PAGE_SIZE, filteredList.length)} {t('จาก ', 'of ')}
                    {filteredList.length.toLocaleString(locale)}
                  </p>
                )}
              </div>

              {filteredList.length === 0 ? (
                <div className="mt-5 rounded-[10px] border border-dashed border-rule-2 bg-paper-3 p-8 text-center text-sm text-muted">
                  {searchQuery
                    ? t(
                        `ไม่พบบัญชีที่ตรงกับคำว่า "${searchQuery}" ในหมวดนี้`,
                        `No accounts in this category match “${searchQuery}”.`,
                      )
                    : t('ไม่มีรายชื่อบัญชีในหมวดนี้', 'No accounts in this category.')}
                </div>
              ) : (
                <>
                  {isComparisonTab ? (
                    <ul
                      role="list"
                      className="mt-4 divide-y divide-rule rounded-lg border border-rule"
                    >
                      {pagedList.map((account) => {
                        const timestamp = account.followedUsAt ?? account.timestamp;
                        return (
                          <li
                            key={account.handle}
                            className="grid items-start gap-x-5 px-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4"
                          >
                            <details className="group min-w-0">
                              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 text-sm font-semibold text-ink marker:hidden">
                                <ChevronDown
                                  className="size-4 shrink-0 text-accent transition-transform group-open:rotate-180"
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 wrap-anywhere">@{account.handle}</span>
                                <span className="ml-auto shrink-0 text-right text-xs font-medium text-accent">
                                  <span className="group-open:hidden">
                                    {t('ดูไทม์ไลน์', 'View timeline')}
                                  </span>
                                  <span className="hidden group-open:inline">
                                    {t('ซ่อนไทม์ไลน์', 'Hide timeline')}
                                  </span>
                                </span>
                              </summary>
                              <div className="pt-1 pb-4 pl-6">
                                <FollowerTimeline
                                  previousDate={timelinePreviousDate}
                                  currentDate={timelineCurrentDate}
                                  followDate={
                                    timestamp
                                      ? formatDate(new Date(timestamp * 1000), locale)
                                      : undefined
                                  }
                                  missing={currentTab.key === 'recentUnfollowers'}
                                  previousWasSelected={comparison?.automatic === false}
                                  isLatestExport={comparison?.isLatest}
                                />
                              </div>
                            </details>
                            <a
                              href={account.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t(
                                `เปิดโปรไฟล์ Instagram ของ @${account.handle}`,
                                `Open Instagram profile for @${account.handle}`,
                              )}
                              className="ms-6 inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-sm text-xs font-medium text-cool hover:text-ink sm:ms-0"
                            >
                              <span className="underline decoration-current/40 underline-offset-3">
                                {t('เปิดโปรไฟล์ Instagram', 'Open Instagram profile')}
                              </span>
                              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <>
                      <div className="results-table-wrap mt-4 hidden overflow-hidden rounded-[10px] border md:block">
                        <table className="results-table w-full table-fixed border-collapse text-left text-sm">
                          <colgroup>
                            <col className="w-[5%]" />
                            <col className={isMutualTab ? 'w-[29%]' : 'w-[33%]'} />
                            {isMutualTab ? (
                              <>
                                <col className="w-[19%]" />
                                <col className="w-[19%]" />
                              </>
                            ) : (
                              <col className="w-[27%]" />
                            )}
                            <col className={isMutualTab ? 'w-[28%]' : 'w-[35%]'} />
                          </colgroup>
                          <thead>
                            <tr className="text-xs">
                              <th className="px-4 py-3">#</th>
                              <th className="px-4 py-3">
                                {t('ชื่อบัญชี (@username)', 'Username (@username)')}
                              </th>
                              {isMutualTab ? (
                                <>
                                  <th className="px-4 py-3">
                                    {t('เขาติดตามคุณเมื่อ', 'They followed you on')}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t('คุณติดตามเขาเมื่อ', 'You followed them on')}
                                  </th>
                                </>
                              ) : (
                                <th className="px-4 py-3">{singleDateColumnLabel}</th>
                              )}
                              <th className="px-4 py-3 text-right">{t('เปิดดูโปรไฟล์', 'Profile')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedList.map((acc, idx) => {
                              const singleTs = isFollowingSideTab
                                ? (acc.followedByUsAt ?? acc.timestamp)
                                : (acc.followedUsAt ?? acc.timestamp);
                              return (
                                <tr key={acc.handle}>
                                  <td className="measured px-4 py-2.5 text-xs text-muted">
                                    {pageStart + idx + 1}
                                  </td>
                                  <td className="px-4 py-2.5 font-medium text-ink">
                                    @{acc.handle}
                                  </td>
                                  {isMutualTab ? (
                                    <>
                                      <td className="measured px-4 py-2.5 text-xs text-ink-2">
                                        {formatDateOrEmpty(acc.followedUsAt ?? acc.timestamp)}
                                      </td>
                                      <td className="measured px-4 py-2.5 text-xs text-ink-2">
                                        {formatDateOrEmpty(acc.followedByUsAt ?? acc.timestamp)}
                                      </td>
                                    </>
                                  ) : (
                                    <td className="measured px-4 py-2.5 text-xs text-ink-2">
                                      {formatDateOrEmpty(singleTs)}
                                    </td>
                                  )}
                                  <td className="px-4 py-2.5 text-right">
                                    <a
                                      href={acc.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-cool hover:text-ink"
                                    >
                                      <span className="underline decoration-current/40 underline-offset-3">
                                        {t('เปิดบน Instagram', 'Open on Instagram')}
                                      </span>
                                      <ExternalLink
                                        className="size-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <ul
                        role="list"
                        className="results-table-wrap mt-4 divide-y divide-rule overflow-hidden rounded-[10px] border md:hidden"
                      >
                        {pagedList.map((acc, idx) => {
                          const singleTs = isFollowingSideTab
                            ? (acc.followedByUsAt ?? acc.timestamp)
                            : (acc.followedUsAt ?? acc.timestamp);
                          return (
                            <li
                              key={acc.handle}
                              className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-ink">
                                  <span className="measured mr-1.5 text-xs text-muted">
                                    {pageStart + idx + 1}.
                                  </span>
                                  @{acc.handle}
                                </p>
                                {isMutualTab ? (
                                  <div className="measured mt-1 space-y-0.5 text-xs text-muted">
                                    <p>
                                      {t('เขาติดตามคุณ:', 'They followed you:')}{' '}
                                      <span className="text-ink-2">
                                        {formatDateOrEmpty(acc.followedUsAt ?? acc.timestamp)}
                                      </span>
                                    </p>
                                    <p>
                                      {t('คุณติดตามเขา:', 'You followed them:')}{' '}
                                      <span className="text-ink-2">
                                        {formatDateOrEmpty(acc.followedByUsAt ?? acc.timestamp)}
                                      </span>
                                    </p>
                                  </div>
                                ) : (
                                  <p className="measured mt-0.5 text-xs text-ink-2">
                                    {singleTs
                                      ? `${singleDateMobilePrefix}: ${formatDate(new Date(singleTs * 1000), locale)}`
                                      : t('ไม่มีข้อมูลวันที่ในไฟล์', 'No dates in this export')}
                                  </p>
                                )}
                              </div>
                              <a
                                href={acc.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-cool hover:text-ink"
                              >
                                <span className="underline decoration-current/40 underline-offset-3">
                                  {t('เปิด IG', 'Open Instagram')}
                                </span>
                                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}

                  {totalPages > 1 && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                      <p className="measured text-xs text-muted">
                        {t('หน้า ', 'Page ')}
                        {safePageIndex + 1} / {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <NormalButton
                          variant="secondary"
                          disabled={safePageIndex === 0}
                          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          {t('ก่อนหน้า', 'Previous')}
                        </NormalButton>
                        <NormalButton
                          variant="secondary"
                          disabled={safePageIndex >= totalPages - 1}
                          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                        >
                          {t('ถัดไป', 'Next')}
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </NormalButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        })()}
    </div>
  );
}
