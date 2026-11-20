import {
  AlertTriangle,
  ArrowDownNarrowWide,
  ArrowRight,
  Calendar,
  CheckCircle2,
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
import { useMemo, useRef, useState } from 'react';
import type { PageId } from '../components/AppShell';
import { ComparisonFiles, type ComparisonFilesState } from '../components/ComparisonFiles';
import { FollowerTimeline } from '../components/FollowerTimeline';
import { NormalButton } from '../components/NormalButton';
import { RelationshipOverview } from '../components/RelationshipOverview';
import type { RelationshipKey } from '../data/relationshipMetrics';
import { formatAnalysisTime, formatDate, formatSnapshotDate } from '../lib/dates';
import { buildSafeProfileHref } from '../lib/igParser';
import { useLanguage } from '../lib/language';
import type { AccountEntry, AnalysisResult, HistoryDiff } from '../types/analyzer';

interface ResultsScreenProps {
  result: AnalysisResult;
  diff: HistoryDiff | null;
  comparison: ComparisonFilesState | null;
  comparisonStatus: 'off' | 'waiting' | 'ready' | 'unknown-owner';
  onSelectComparison: (id: string | null) => void;
  onNavigate: (id: PageId) => void;
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
  initialCategory,
}: ResultsScreenProps) {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<SegmentKey | null>(initialCategory ?? null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'az' | 'za'>('newest');
  const [pageIndex, setPageIndex] = useState(0);

  const { counts } = result;
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

  const likelyLastYearPartialExport = useMemo(() => {
    if (result.isDemoData || result.followers.length === 0) return false;
    const fTs = result.followers
      .map((a) => a.timestamp)
      .filter((ts): ts is number => typeof ts === 'number' && ts > 0);
    if (fTs.length < 5) return false;
    const minF = Math.min(...fTs);
    const maxF = Math.max(...fTs);
    const spanDays = (maxF - minF) / 86400;
    const fgTs = result.following
      .map((a) => a.timestamp)
      .filter((ts): ts is number => typeof ts === 'number' && ts > 0);
    const minFg = fgTs.length > 0 ? Math.min(...fgTs) : minF;
    const followingOlderThanFollowers = minF - minFg > 180 * 86400;
    return (
      spanDays <= 370 && (followingOlderThanFollowers || counts.followers < counts.following * 0.55)
    );
  }, [result.isDemoData, result.followers, result.following, counts.followers, counts.following]);

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
      explanation: t(
        'มีชื่อเป็นผู้ติดตามคุณเฉพาะในไฟล์ ZIP ใหม่',
        'Listed as one of your followers only in the newer ZIP.',
      ),
      icon: UserPlus,
      tone: 'bg-ok-soft text-ok',
      entries: newFollowerEntries,
    },
    {
      key: 'recentUnfollowers' as const,
      label: t('หายจากรายชื่อ', 'Missing from the list'),
      explanation: t(
        'มีชื่อเป็นผู้ติดตามคุณเฉพาะในไฟล์ ZIP เก่า',
        'Listed as one of your followers only in the older ZIP.',
      ),
      icon: UserMinus,
      tone: 'bg-bad-soft text-bad',
      entries: recentUnfollowerEntries,
    },
  ];

  const tabMeta: { key: SegmentKey; label: string; count: number; entries: AccountEntry[] }[] = [
    {
      key: 'notFollowingBack',
      label: t('ไม่ติดตามคุณกลับ', 'Not following you back'),
      count: counts.notFollowingBack,
      entries: result.notFollowingBack,
    },
    {
      key: 'notFollowedBack',
      label: t('คุณไม่ได้ติดตามกลับ', 'You don’t follow back'),
      count: counts.notFollowedBack,
      entries: result.notFollowedBack,
    },
    ...(diff ? comparisonTabs.map((tab) => ({ ...tab, count: tab.entries.length })) : []),
    {
      key: 'mutual',
      label: t('ติดตามกันทั้งสองฝ่าย', 'Mutual follows'),
      count: counts.mutual,
      entries: result.mutual,
    },
    {
      key: 'followers',
      label: t('ผู้ติดตามทั้งหมด', 'All followers'),
      count: counts.followers,
      entries: result.followers,
    },
    {
      key: 'following',
      label: t('กำลังติดตามทั้งหมด', 'All following'),
      count: counts.following,
      entries: result.following,
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
    result.detectedFiles.format === 'json'
      ? 'JSON'
      : result.detectedFiles.format === 'html'
        ? 'HTML'
        : 'JSON + HTML';
  const hasHtmlLimitation = result.detectedFiles.format !== 'json';

  return (
    <div className="product-wrap py-9 lg:py-12">
      <header className="rounded-[10px] border border-rule bg-paper-2 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-ok/35 bg-ok-soft px-2.5 py-1 text-xs font-medium text-ok">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('วิเคราะห์เสร็จสมบูรณ์', 'Analysis complete')}
              </span>
              {result.isDemoData && (
                <span className="rounded-md border border-accent/35 bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                  {t('โหมดข้อมูลตัวอย่าง (ไม่บันทึกลงประวัติ)', 'Sample data (excluded from history)')}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl text-ink sm:text-3xl">
              {result.isDemoData
                ? t('ตัวอย่างผลการวิเคราะห์ผู้ติดตาม', 'Sample follower analysis')
                : t('ผลการวิเคราะห์ผู้ติดตาม', 'Follower analysis')}
            </h1>
            {result.isDemoData && diff && (
              <p className="mt-1.5 text-sm text-muted">
                {t(
                  `เทียบไฟล์ ${previousDate} กับ ${currentDate}`,
                  `Comparing the ${previousDate} and ${currentDate} exports`,
                )}
              </p>
            )}
            {!result.isDemoData && (
              <p className="mt-1.5 max-w-[62ch] text-sm text-ink-2">
                {t(
                  'ดูผลด้านล่างได้เลย หากอยากเก็บรายงานรอบนี้ไว้อ่านหรือพิมพ์ภายหลัง เลือกสร้าง PDF แล้วดาวน์โหลดลงเครื่องได้',
                  'View your results below. To keep a copy to read or print later, create a PDF report and download it to your device.',
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:shrink-0">
            {result.isDemoData && (
              <NormalButton variant="secondary" onClick={() => onNavigate('history')}>
                <History className="h-4 w-4" aria-hidden="true" />
                {t('ดูประวัติตัวอย่าง', 'View sample history')}
              </NormalButton>
            )}
            <NormalButton
              variant="secondary"
              onClick={() => onNavigate('upload')}
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t('อัปโหลดไฟล์ใหม่', 'Analyze another ZIP')}
            </NormalButton>
            <NormalButton
              variant={result.isDemoData ? 'primary' : 'secondary'}
              onClick={() => onNavigate('pdf')}
              className="w-full sm:w-auto"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {result.isDemoData
                ? t('สร้างรายงาน PDF ตัวอย่าง', 'Create a sample PDF report')
                : t('สร้างรายงาน PDF', 'Create PDF report')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </NormalButton>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-rule bg-paper-3 px-4 py-3 text-xs sm:grid-cols-3">
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
              <dt className="flex items-center gap-1.5 text-muted">
                <span>{t('ไฟล์ที่วิเคราะห์', 'Source ZIP')}</span>
                <span className="measured rounded border border-rule bg-paper-2 px-1.5 py-px text-[10px] font-semibold text-ink-2">
                  {formatLabel}
                </span>
              </dt>
              <dd
                className="measured mt-0.5 truncate font-medium text-ink"
                title={result.sourceFileName}
              >
                {result.sourceFileName}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-muted">{t('ข้อมูล ณ วันที่', 'Data as of')}</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {formatSnapshotDate(result.snapshotDateLabel, locale)}
              </dd>
            </div>
          </div>
        </dl>
      </header>

      {!diff && !result.isDemoData && (
        <section className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[10px] border border-rule bg-paper-3 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-sm text-ink-2">
            <History className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              {comparisonStatus === 'unknown-owner'
                ? t(
                    'ใช้ชื่อไฟล์ ZIP เดิมจาก Instagram เพื่อให้ระบบรู้ว่าเป็นไฟล์ของบัญชีเดียวกัน',
                    'Use the original Instagram ZIP filename so we can identify exports from the same account.',
                  )
                : comparisonStatus === 'ready'
                  ? t(
                      'บันทึกรายชื่อไว้แล้ว อัปโหลด ZIP รอบใหม่ของบัญชีเดิมเพื่อดูความเปลี่ยนแปลง',
                      'Your follower list is saved. Upload a newer ZIP for the same account to see changes.',
                    )
                  : comparisonStatus === 'waiting'
                    ? t(
                        'เปิดการจำรายชื่อแล้ว อัปโหลด ZIP รอบแรกเพื่อเก็บรายชื่อไว้เทียบ',
                        'Account list storage is on. Upload a first ZIP to save a list for comparison.',
                      )
                    : t(
                        'ประวัติปิดเป็นค่าเริ่มต้น ถ้าอยากรู้ว่าใครติดตามใหม่หรือหายจากรายชื่อ ให้เปิดทั้งบันทึกประวัติและจำรายชื่อ แล้วนำ ZIP รอบถัดไปของบัญชีเดิมมาเทียบในเบราว์เซอร์นี้',
                        'History is off by default. To see who followed you or dropped off the list, turn on history and account list storage, then bring your next ZIP for the same account to this browser.',
                      )}
            </span>
          </div>
          <NormalButton
            variant="secondary"
            onClick={() => onNavigate('history')}
            className="shrink-0 text-xs"
          >
            {t('ตั้งค่าประวัติบนเครื่อง', 'Manage local history')}
          </NormalButton>
        </section>
      )}

      {likelyLastYearPartialExport && (
        <section
          role="note"
          className="mt-6 flex flex-col justify-between gap-4 rounded-[10px] border border-accent bg-accent-soft p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="font-medium text-accent">
                {t(
                  'ข้อสังเกต: รายชื่อผู้ติดตามในไฟล์นี้อาจมีเฉพาะคนที่ติดตามภายใน 1 ปีล่าสุด',
                  'This export may include only followers from the past year',
                )}
              </p>
              <p className="mt-0.5 text-ink-2">
                {t(
                  'ค่าเริ่มต้นของ Instagram ตั้ง ช่วงวันที่ เป็น ปีที่แล้ว หากยอดผู้ติดตามน้อยกว่าหน้าโปรไฟล์จริง ให้ส่งออกไฟล์ใหม่แล้วเปลี่ยน ช่วงวันที่ เป็น ตลอดเวลา (All time)',
                  'Instagram may use Last year as the default date range. If the count is lower than on your profile, request a new export and set the Date range to All time.',
                )}
              </p>
            </div>
          </div>
          <NormalButton
            variant="secondary"
            onClick={() => onNavigate('how-it-works')}
            className="shrink-0 text-xs"
          >
            {t('ดูขั้นตอนเปลี่ยนเป็น ตลอดเวลา', 'How to select All time')}
          </NormalButton>
        </section>
      )}

      {diff && (
        <section
          aria-labelledby="comparison-heading"
          className="mt-5 rounded-[10px] border border-rule bg-paper-2 p-4 sm:p-6"
        >
          <h2 id="comparison-heading" className="text-xl font-semibold text-ink">
            {t('ผู้ติดตามเปลี่ยนไปยังไง', 'What changed in your followers?')}
          </h2>
          {comparison && (
            <ComparisonFiles
              current={result}
              comparison={comparison}
              onSelect={(id) => {
                if (isComparisonTab) setPageIndex(0);
                onSelectComparison(id);
              }}
            />
          )}
          <p
            role="note"
            className="mt-4 flex items-center gap-2 text-sm leading-relaxed text-muted"
          >
            <Info className="size-4 shrink-0" aria-hidden="true" />
            {t(
              'เว็บเทียบรายชื่อคนที่ติดตามคุณจาก ZIP สองไฟล์',
              'The app compares your follower lists from two ZIP files.',
            )}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 sm:gap-3">
            {comparisonTabs.map(({ key, label, explanation, icon: Icon, tone, entries }) => (
              <div key={key} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={activeTab === key}
                  aria-describedby={`${key}-explanation`}
                  onClick={() => jumpToCategory(key)}
                  className={`flex min-h-20 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors hover:border-current sm:p-4 ${tone} ${activeTab === key ? 'border-current' : 'border-transparent'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="measured text-2xl font-semibold">
                      {entries.length.toLocaleString(locale)}
                    </span>
                    <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </span>
                </button>
                <div className="mt-2 space-y-1 px-1 text-sm leading-relaxed text-muted">
                  <p id={`${key}-explanation`}>{explanation}</p>
                  {key === 'recentUnfollowers' && (
                    <p>
                      {t(
                        'ถ้าชื่อหายไป เรารู้ได้ว่าหายระหว่างสองรอบ ส่วนวันที่แน่นอนและสาเหตุยังระบุไม่ได้',
                        'When a name disappears, the ZIPs show the interval in which it happened. The exact date and reason are unknown.',
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              {t('ผู้ติดตามสุทธิ', 'Net followers')}{' '}
              <strong className="text-ink">
                {diff.followersDelta.toLocaleString(locale, { signDisplay: 'exceptZero' })}
              </strong>
            </span>
            <span>
              {t('ยอดไม่ติดตามคุณกลับเปลี่ยนไป', 'Not following back, net change')}{' '}
              <strong className="text-ink">
                {diff.notFollowingBackDelta.toLocaleString(locale, { signDisplay: 'exceptZero' })}
              </strong>
            </span>
          </p>
        </section>
      )}

      <section
        className="mt-7 rounded-[10px] border border-rule bg-paper-2 p-5 sm:p-7"
        aria-labelledby="overview-heading"
      >
        <h2 id="overview-heading" className="mb-4 text-xl text-ink">
          {t('ภาพรวมบัญชี', 'Account overview')}
        </h2>
        <RelationshipOverview
          counts={counts}
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
                  'ไฟล์แบบ HTML ไม่ได้เก็บวันที่ในรูปแบบมาตรฐาน (timestamp) จึงแสดงเป็น “ไม่มีวันที่” และไม่สามารถตรวจเตือนไฟล์ช่วง “ปีที่แล้ว” อัตโนมัติได้ หากต้องการดูวันที่ทั้งฝั่งเขาฟอลคุณและคุณฟอลเขา แนะนำให้ส่งออกใหม่โดยเลือกรูปแบบเป็น ',
                  'HTML lacks standard follow timestamps. Dates are unavailable, and the app can’t flag exports limited to the past year. To see follow dates for both lists, request a new export in ',
                )}
                <strong className="text-ink">JSON</strong>
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
                  className="inline-flex min-h-[36px] cursor-pointer items-center rounded-md border border-rule bg-paper-3 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-rule-2 hover:text-ink"
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
                    className="min-h-[44px] w-full rounded-md border border-rule-2 bg-paper-3 pr-4 pl-10 text-sm text-ink placeholder:text-muted focus:border-accent"
                  />
                </div>

                <div className="relative sm:shrink-0">
                  <ArrowDownNarrowWide
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <select
                    aria-label={t('เรียงลำดับรายชื่อ', 'Sort accounts')}
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as 'newest' | 'az' | 'za');
                      setPageIndex(0);
                    }}
                    className="min-h-[44px] w-full cursor-pointer appearance-none rounded-md border border-rule-2 bg-paper-3 pr-10 pl-10 text-sm text-ink hover:border-muted focus:border-accent sm:min-w-48 forced-colors:appearance-auto"
                  >
                    <option value="newest">{t('วันที่ล่าสุดก่อน', 'Newest first')}</option>
                    <option value="az">{t('ชื่อบัญชี A–Z', 'Username A–Z')}</option>
                    <option value="za">{t('ชื่อบัญชี Z–A', 'Username Z–A')}</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted forced-colors:hidden"
                    aria-hidden="true"
                  />
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
                            className="flex flex-wrap items-start gap-x-4 px-3 sm:flex-nowrap sm:px-4"
                          >
                            <details className="group min-w-0 flex-1">
                              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 text-sm font-semibold text-ink marker:hidden">
                                <ChevronDown
                                  className="size-4 shrink-0 text-accent transition-transform group-open:rotate-180"
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 wrap-anywhere">@{account.handle}</span>
                                <span className="ml-auto text-right text-xs font-medium text-accent">
                                  {t('ดูไทม์ไลน์', 'View timeline')}
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
                                `เปิด @${account.handle} บน Instagram`,
                                `Open @${account.handle} on Instagram`,
                              )}
                              className="grid size-11 shrink-0 place-items-center text-muted hover:text-accent"
                            >
                              <ExternalLink className="size-4" aria-hidden="true" />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <>
                      <div className="mt-4 hidden overflow-hidden rounded-[10px] border border-rule md:block">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-rule bg-paper-3 text-xs font-medium text-muted">
                              <th className="w-16 px-4 py-3">#</th>
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
                          <tbody className="divide-y divide-rule">
                            {pagedList.map((acc, idx) => {
                              const singleTs = isFollowingSideTab
                                ? (acc.followedByUsAt ?? acc.timestamp)
                                : (acc.followedUsAt ?? acc.timestamp);
                              return (
                                <tr
                                  key={acc.handle}
                                  className={idx % 2 === 0 ? 'bg-paper-2' : 'bg-paper'}
                                >
                                  <td className="measured px-4 py-2.5 text-xs text-muted">
                                    {pageStart + idx + 1}
                                  </td>
                                  <td className="px-4 py-2.5 font-medium text-ink">
                                    @{acc.handle}
                                  </td>
                                  {isMutualTab ? (
                                    <>
                                      <td className="measured px-4 py-2.5 text-xs text-ok">
                                        {formatDateOrEmpty(acc.followedUsAt ?? acc.timestamp)}
                                      </td>
                                      <td className="measured px-4 py-2.5 text-xs text-cool">
                                        {formatDateOrEmpty(acc.followedByUsAt ?? acc.timestamp)}
                                      </td>
                                    </>
                                  ) : (
                                    <td className="measured px-4 py-2.5 text-xs text-cool">
                                      {formatDateOrEmpty(singleTs)}
                                    </td>
                                  )}
                                  <td className="px-4 py-2.5 text-right">
                                    <a
                                      href={acc.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded border border-rule-2 bg-paper-3 px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-accent hover:text-accent"
                                    >
                                      {t('เปิดบน Instagram', 'Open on Instagram')}
                                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 space-y-2.5 md:hidden">
                        {pagedList.map((acc, idx) => {
                          const singleTs = isFollowingSideTab
                            ? (acc.followedByUsAt ?? acc.timestamp)
                            : (acc.followedUsAt ?? acc.timestamp);
                          return (
                            <div
                              key={acc.handle}
                              className="flex items-center justify-between gap-3 rounded-[10px] border border-rule bg-paper-3 p-3.5"
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
                                      <span className="text-ok">
                                        {formatDateOrEmpty(acc.followedUsAt ?? acc.timestamp)}
                                      </span>
                                    </p>
                                    <p>
                                      {t('คุณติดตามเขา:', 'You followed them:')}{' '}
                                      <span className="text-cool">
                                        {formatDateOrEmpty(acc.followedByUsAt ?? acc.timestamp)}
                                      </span>
                                    </p>
                                  </div>
                                ) : (
                                  <p className="measured mt-0.5 text-xs text-cool">
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
                                className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded border border-rule-2 bg-paper-2 px-3 text-xs font-medium text-accent"
                              >
                                {t('เปิด IG', 'Open Instagram')}
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
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
