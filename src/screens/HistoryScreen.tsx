import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NormalButton } from '../components/NormalButton';
import { getFollowBackSummary } from '../data/relationshipMetrics';
import { formatSnapshotDate } from '../lib/dates';
import { formatBytes } from '../lib/fileSize';
import { useLanguage } from '../lib/language';
import type { HistoryPreferences, HistoryRecord } from '../types/analyzer';

interface HistoryScreenProps {
  preferences: HistoryPreferences;
  records: HistoryRecord[];
  activeRecordId: string | null;
  hasActiveAnalysis: boolean;
  hasLatestSnapshot: boolean;
  onUpdatePreferences: (next: HistoryPreferences) => Promise<void>;
  onOpenRecord: (record: HistoryRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

const HISTORY_PAGE_SIZE = 5;

function formatAnalyzedDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryScreen({
  preferences,
  records,
  activeRecordId,
  hasActiveAnalysis,
  hasLatestSnapshot,
  onUpdatePreferences,
  onOpenRecord,
  onDeleteRecord,
  onClearAll,
}: HistoryScreenProps) {
  const { t, locale } = useLanguage();
  const feedbackMessages = {
    summaryOn: t('เปิดบันทึกสถิติสรุปบนเบราว์เซอร์เครื่องนี้แล้ว', 'Summary history is on in this browser.'),
    summaryOff: t(
      'ปิดการบันทึกประวัติแล้ว (ข้อมูลครั้งต่อไปจะไม่ถูกบันทึกไว้)',
      'History is off. Future analyses won’t be saved.',
    ),
    accountsOn: t(
      'เปิดบันทึกรายชื่อในเบราว์เซอร์นี้แล้ว คุณเลือกไฟล์ที่มีรายชื่อบันทึกไว้มาเทียบย้อนหลังได้',
      'Follower list storage is on. You can compare your latest export with an earlier one that has saved lists.',
    ),
    accountsOff: t(
      'ปิดการจำรายชื่อและลบรายชื่อที่บันทึกไว้จากเบราว์เซอร์นี้แล้ว',
      'Follower list storage is off. Saved lists were removed from this browser.',
    ),
    cleared: t(
      'ล้างประวัติและปิดสวิตช์บันทึกข้อมูลทั้งหมดในเบราว์เซอร์เครื่องนี้เรียบร้อยแล้ว',
      'History was cleared and both history settings were turned off.',
    ),
  };
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [feedback, setFeedback] = useState<keyof typeof feedbackMessages | null>(null);
  const formatSignedDelta = (delta: number) =>
    `${delta > 0 ? '+' : ''}${delta.toLocaleString(locale)}`;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const [pendingDeletion, setPendingDeletion] = useState<
    { kind: 'record'; record: HistoryRecord } | { kind: 'all' } | null
  >(null);
  const deletionDialog = useRef<HTMLDialogElement>(null);
  const cancelDeletion = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingDeletion || deletionDialog.current?.open) return;
    deletionDialog.current?.showModal();
    cancelDeletion.current?.focus();
  }, [pendingDeletion]);

  const recordsByAccount = useMemo(() => {
    const groups = new Map<string, HistoryRecord[]>();
    for (const rec of records) {
      const key = rec.ownerHandle ?? '';
      const group = groups.get(key);
      if (group) group.push(rec);
      else groups.set(key, [rec]);
    }
    return groups;
  }, [records]);
  const accountGroups = Array.from(recordsByAccount, ([key, group]) => ({
    key,
    label: key ? `@${key}` : t('ไม่ระบุชื่อบัญชี', 'Unknown account'),
    count: group.length,
  }));

  const effectiveAccountFilter =
    accountFilter !== null && recordsByAccount.has(accountFilter) ? accountFilter : null;

  const visibleRecords =
    effectiveAccountFilter === null
      ? records
      : (recordsByAccount.get(effectiveAccountFilter) ?? []);
  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / HISTORY_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageStart = safePageIndex * HISTORY_PAGE_SIZE;
  const pagedRecords = visibleRecords.slice(pageStart, pageStart + HISTORY_PAGE_SIZE);

  const changePage = (nextPage: number) => {
    setPageIndex(nextPage);
    if (typeof listHeadingRef.current?.scrollIntoView === 'function') {
      listHeadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const recordOrder = useMemo(() => {
    const order = new Map<string, { index: number; previousRecord?: HistoryRecord }>();
    for (const group of recordsByAccount.values()) {
      group.forEach((record, index) => {
        order.set(record.id, { index, previousRecord: group[index + 1] });
      });
    }
    return order;
  }, [recordsByAccount]);

  const runHistoryAction = async (
    action: () => Promise<void>,
    message?: keyof typeof feedbackMessages,
  ) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);
    setUpdateError(false);
    try {
      await action();
      setFeedback(message ?? null);
    } catch {
      setUpdateError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTier1 = () => {
    const enabled = !preferences.tier1SummaryOptIn;
    void runHistoryAction(
      () =>
        onUpdatePreferences({
          tier1SummaryOptIn: enabled,
          tier2HandlesOptIn: enabled && preferences.tier2HandlesOptIn,
        }),
      enabled ? 'summaryOn' : 'summaryOff',
    );
  };

  const handleToggleTier2 = () => {
    if (!preferences.tier1SummaryOptIn) return;
    const enabled = !preferences.tier2HandlesOptIn;
    void runHistoryAction(
      () => onUpdatePreferences({ tier1SummaryOptIn: true, tier2HandlesOptIn: enabled }),
      enabled ? 'accountsOn' : 'accountsOff',
    );
  };

  const confirmDeletion = () => {
    if (!pendingDeletion || !deletionDialog.current?.open || isUpdating) return;
    deletionDialog.current.close();
    if (pendingDeletion.kind === 'record') {
      const id = pendingDeletion.record.id;
      void runHistoryAction(() => onDeleteRecord(id));
    } else {
      void runHistoryAction(onClearAll, 'cleared');
    }
  };
  const recordToDelete = pendingDeletion?.kind === 'record' ? pendingDeletion.record : null;

  return (
    <div className="product-wrap pt-3 pb-9 lg:pt-4 lg:pb-14">
      <header className="border-b border-rule pb-7">
        <h1 className="page-heading">
          {t('ประวัติการวิเคราะห์บนเบราว์เซอร์เครื่องนี้', 'Analysis history on this device')}
        </h1>
        <p className="max-w-[66ch] text-base leading-relaxed text-ink-2">
          {t(
            'ระบบปิดการบันทึกประวัติเป็นค่าเริ่มต้นเพื่อขอความยินยอมจากคุณก่อนเสมอ เลือกเปิดสวิตช์ด้านล่างได้ตามต้องการ โดยข้อมูลทั้งหมดจะเก็บอยู่เฉพาะในเบราว์เซอร์เครื่องนี้เท่านั้น',
            'History is off by default so nothing is saved without your explicit consent. Turn on either option below if you want to keep summaries or lists — everything stays in this browser.',
          )}
        </p>
        {records.length > 0 && (
          <div className="mt-4 lg:hidden">
            <NormalButton
              variant="secondary"
              className="w-full"
              onClick={() => {
                const heading = listHeadingRef.current;
                heading?.focus({ preventScroll: true });
                heading?.scrollIntoView?.({ block: 'start' });
              }}
            >
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
              {t('ดูรายการประวัติ', 'See saved entries')}
            </NormalButton>
          </div>
        )}
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <section className="rounded-[10px] border border-rule bg-paper-2 p-6 lg:sticky lg:top-20 lg:col-span-6">
          <h2 className="text-lg text-ink">
            {t('ความยินยอมและตั้งค่าการบันทึกประวัติ', 'Consent and history storage')}
          </h2>

          <div className="mt-4 rounded-lg border border-rule bg-paper-3 px-4 py-3.5 text-xs leading-relaxed text-ink-2 sm:text-sm">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-ink sm:text-sm">
                  {t('ทำไมระบบถึงปิดการบันทึกประวัติเป็นค่าเริ่มต้น?', 'Why is history off by default?')}
                </h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-ink-2">
                  <li>
                    <strong className="font-medium text-ink">
                      {t('ขอความยินยอมก่อนเก็บข้อมูล:', 'Explicit consent first:')}
                    </strong>{' '}
                    {t(
                      'ข้อมูลผู้ติดตามเป็นข้อมูลส่วนตัว เว็บจึงไม่แอบบันทึกลงเบราว์เซอร์อัตโนมัติจนกว่าคุณจะกดอนุญาตเอง',
                      'Follower data is personal, so this site never saves anything to your browser automatically until you opt in.',
                    )}
                  </li>
                  <li>
                    <strong className="font-medium text-ink">
                      {t('ปลอดภัยเมื่อใช้เครื่องร่วมกับผู้อื่น:', 'Safer on shared devices:')}
                    </strong>{' '}
                    {t(
                      'หากเปิดเช็กบนเครื่องสาธารณะหรือเครื่องที่ไม่ใช่ของคุณ ปิดแท็บแล้วจะไม่มีประวัติหรือรายชื่อตกค้าง',
                      'If you check an export on a shared or public device, closing the tab leaves no saved history or usernames behind.',
                    )}
                  </li>
                  <li>
                    <strong className="font-medium text-ink">
                      {t('เลือกเก็บได้ 2 ระดับและลบได้ทุกเมื่อ:', 'Two-tier control, removable anytime:')}
                    </strong>{' '}
                    {t(
                      'เลือกเก็บเฉพาะตัวเลขสรุป หรือเปิดจำรายชื่อไว้เทียบ ZIP รอบถัดไป และกดปิดหรือล้างข้อมูลทั้งหมดได้ตลอดเวลา',
                      'Choose summary counts only or add account lists for future ZIP comparisons, and turn off or clear everything in one click.',
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-cool/35 bg-cool-soft px-4 py-3 text-xs leading-relaxed text-ink-2 sm:text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cool" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">
                {!preferences.tier2HandlesOptIn
                  ? t('ยังไม่ได้เปิดจำรายชื่อ', 'Account list storage is off')
                  : hasLatestSnapshot
                    ? t('พร้อมเทียบรอบถัดไป', 'Ready for the next comparison')
                    : t('รอไฟล์ ZIP รอบแรก', 'Waiting for your first ZIP')}
              </p>
              <p className="mt-1">
                {t(
                  'เมื่อเปิดทั้งสองสวิตช์ เบราว์เซอร์จะเก็บรายชื่อแต่ละรอบไว้ให้เลือกเทียบกับ ZIP ล่าสุดของบัญชีเดียวกัน',
                  'With both options on, this browser saves lists from each export so you can choose an earlier ZIP to compare with the latest one for the same account.',
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-rule border-y border-rule">
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {t('1. บันทึกสถิติสรุปและประวัติชื่อไฟล์ PDF', '1. Save summary counts and PDF history')}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {t(
                    'เก็บตัวเลขสรุป ชื่อและขนาดไฟล์ ZIP รวมถึงตำแหน่งที่บันทึก PDF',
                    'Keeps summary counts, the ZIP filename and size, and where you saved the PDF.',
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.tier1SummaryOptIn}
                aria-label={t(
                  'เปิดหรือปิดการบันทึกสถิติสรุปและประวัติรายงาน PDF',
                  'Save summary counts and PDF history',
                )}
                disabled={isUpdating}
                onClick={handleToggleTier1}
                className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                  preferences.tier1SummaryOptIn
                    ? 'border-ig-blue bg-ig-blue'
                    : 'border-rule-2 bg-paper-3'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full transition-transform ${
                    preferences.tier1SummaryOptIn
                      ? 'translate-x-6 bg-ig-blue-ink shadow-xs'
                      : 'translate-x-1 bg-ink'
                  }`}
                />
              </button>
            </div>

            <div
              className={`flex items-start justify-between gap-4 py-4 ${
                preferences.tier1SummaryOptIn ? '' : 'opacity-65'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {t(
                    '2. จำรายชื่อไว้เปิดดูและเทียบย้อนหลัง',
                    '2. Save account lists to reopen and compare',
                  )}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {t(
                    'เปิดดูรายชื่อเดิมจากประวัติ หรือเลือกไฟล์ย้อนหลังจากหน้าผลล่าสุดเพื่อดูว่าใครติดตามใหม่และใครหายจากรายชื่อ',
                    'Reopen a saved list from history, or choose an earlier ZIP from the latest results to see new and missing followers.',
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                disabled={isUpdating || !preferences.tier1SummaryOptIn}
                aria-checked={preferences.tier2HandlesOptIn}
                aria-label={t(
                  'เปิดหรือปิดการจำรายชื่อเพื่อเทียบย้อนหลัง',
                  'Save account lists for comparison',
                )}
                onClick={handleToggleTier2}
                className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                  preferences.tier1SummaryOptIn ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${
                  preferences.tier2HandlesOptIn
                    ? 'border-ig-blue bg-ig-blue'
                    : 'border-rule-2 bg-paper-3'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full transition-transform ${
                    preferences.tier2HandlesOptIn
                      ? 'translate-x-6 bg-ig-blue-ink shadow-xs'
                      : 'translate-x-1 bg-ink'
                  }`}
                />
              </button>
            </div>
          </div>

          {updateError && (
            <p
              role="alert"
              className="mt-4 rounded-[10px] border border-bad bg-bad-soft px-4 py-3 text-sm text-bad"
            >
              {t(
                'เปลี่ยนแปลงประวัติไม่ได้ ลองอีกครั้ง หากเปิดเว็บเวอร์ชันเก่าในแท็บอื่น ให้รีโหลดแท็บนั้นก่อน',
                'Could not update history. Try again. If an older version is open in another tab, reload that tab first.',
              )}
            </p>
          )}

          {feedback && (
            <div
              role="status"
              className={`mt-4 flex items-center gap-2 rounded-[10px] border px-4 py-3 text-sm font-medium ${
                feedback === 'summaryOn' || feedback === 'accountsOn'
                  ? 'border-ok bg-ok-soft text-ok'
                  : feedback === 'cleared'
                    ? 'border-bad bg-bad-soft text-bad'
                    : 'border-accent bg-accent-soft text-accent'
              }`}
            >
              {feedback === 'summaryOn' || feedback === 'accountsOn' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : feedback === 'cleared' ? (
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{feedbackMessages[feedback]}</span>
            </div>
          )}

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs leading-relaxed text-muted">
              <strong className="text-ink">{t('ข้อจำกัดตามจริง:', 'Storage details:')}</strong>
              {t(
                ' เก็บเฉพาะข้อความรายชื่อและตัวเลขจากไฟล์ .zip จริง (ไม่เก็บรูปหรือวิดีโอ ใช้พื้นที่น้อยมาก และไม่รวมข้อมูลทดสอบ) แยกประวัติตามชื่อบัญชีในชื่อไฟล์ ไม่ซิงก์ข้ามเครื่อง และจะหายไปหากล้างข้อมูลเบราว์เซอร์',
                ' Stores text-only counts and usernames from real ZIP exports (no photos or videos, minimal storage, sample data excluded). History is grouped by the account in the filename, stays on this device, and is removed when you clear browser data.',
              )}
            </p>
            <NormalButton
              variant="danger"
              disabled={isUpdating}
              onClick={() => setPendingDeletion({ kind: 'all' })}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('ล้างประวัติทั้งหมด', 'Clear all history')}
            </NormalButton>
          </div>
        </section>

        <section className="lg:col-span-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 ref={listHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg text-ink">
              {t('รายการประวัติที่บันทึกไว้บนเครื่องนี้ (', 'History on this device (')}
              {visibleRecords.length}
              {t('รายการ)', ')')}
            </h2>
            {visibleRecords.length > HISTORY_PAGE_SIZE && (
              <p className="measured text-xs text-cool">
                {t('แสดง ', 'Showing ')}
                {pageStart + 1}
                {t(' ถึง ', ' to ')}
                {Math.min(pageStart + HISTORY_PAGE_SIZE, visibleRecords.length)} {t('จาก ', 'of ')}
                {visibleRecords.length.toLocaleString(locale)}
              </p>
            )}
          </div>

          {records.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              {t(
                'เรียงตามเวลาวิเคราะห์ล่าสุด ป้ายรอบล่าสุดและก่อนหน้าแยกตามบัญชี',
                'Newest analyses first. Run labels are shown per account.',
              )}
            </p>
          )}

          {accountGroups.length > 1 && (
            <div
              role="group"
              aria-label={t('กรองประวัติตามชื่อบัญชี Instagram', 'Filter history by Instagram account')}
              className="mt-3 flex flex-wrap gap-1.5"
            >
              <button
                type="button"
                aria-pressed={effectiveAccountFilter === null}
                onClick={() => {
                  setAccountFilter(null);
                  setPageIndex(0);
                }}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                  effectiveAccountFilter === null
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule bg-paper-2 text-muted hover:border-rule-2 hover:text-ink'
                }`}
              >
                <span>{t('ทุกบัญชี', 'All accounts')}</span>
                <span className="measured opacity-80">({records.length})</span>
              </button>
              {accountGroups.map((group) => {
                const active = effectiveAccountFilter === group.key;
                return (
                  <button
                    key={group.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setAccountFilter(group.key);
                      setPageIndex(0);
                    }}
                    className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-cool bg-cool text-paper'
                        : 'border-rule bg-paper-2 text-muted hover:border-rule-2 hover:text-ink'
                    }`}
                  >
                    <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{group.label}</span>
                    <span className="measured opacity-80">({group.count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {visibleRecords.length > 0 && (
            <ul
              aria-label={t('ช่วงประวัติของแต่ละบัญชี', 'History range by account')}
              className="mt-4 divide-y divide-rule rounded-lg border border-rule bg-paper-2"
            >
              {accountGroups
                .filter(
                  ({ key }) => effectiveAccountFilter === null || key === effectiveAccountFilter,
                )
                .map(({ key, label, count }) => {
                  const group = recordsByAccount.get(key) ?? [];
                  const latest = group[0];
                  const first = group.at(-1);
                  return (
                    <li key={key} className="px-4 py-3">
                      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted">
                        <strong className="font-semibold break-all text-ink">{label}</strong>
                        <span>
                          {t(
                            `มีประวัติ ${count.toLocaleString(locale)} รอบ`,
                            `${count.toLocaleString(locale)} ${count === 1 ? 'saved run' : 'saved runs'}`,
                          )}
                        </span>
                      </p>
                      {key && count > 1 && first && latest && (
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 text-xs">
                          <div>
                            <dt className="text-muted">{t('รอบแรกที่บันทึกไว้', 'First saved run')}</dt>
                            <dd className="mt-1 font-medium text-ink">
                              <time dateTime={first.analyzedAtIso}>
                                {formatAnalyzedDateTime(first.analyzedAtIso, locale)}
                              </time>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">
                              {t('รอบล่าสุดที่วิเคราะห์', 'Latest analysis')}
                            </dt>
                            <dd className="mt-1 font-medium text-ink">
                              <time dateTime={latest.analyzedAtIso}>
                                {formatAnalyzedDateTime(latest.analyzedAtIso, locale)}
                              </time>
                            </dd>
                          </div>
                        </dl>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}

          {records.length === 0 ? (
            <div className="mt-4 rounded-[10px] border border-dashed border-rule-2 bg-paper-3 p-8 text-center text-sm leading-relaxed text-muted">
              {preferences.tier1SummaryOptIn
                ? t(
                    'ยังไม่มีประวัติจากไฟล์จริง เมื่อคุณอัปโหลดไฟล์ .zip จาก Instagram รอบถัดไป ระบบจะบันทึกสรุปพร้อมชื่อบัญชีไว้ที่นี่อัตโนมัติ (ข้อมูลตัวอย่างสมมติจะไม่ถูกบันทึกปนกัน)',
                    'No history from real exports yet. Your next Instagram ZIP analysis will be saved here. Sample data is excluded.',
                  )
                : t(
                    'ปิดการบันทึกประวัติอยู่ (ค่าเริ่มต้น) และไม่มีข้อมูลคงค้างในเบราว์เซอร์นี้',
                    'History is off. This browser has no saved analyses.',
                  )}
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {pagedRecords.map((rec) => {
                  const isExpanded = expandedId === rec.id;
                  const canOpenFull = Boolean(
                    rec.savedAnalysis || (rec.id === activeRecordId && hasActiveAnalysis),
                  );
                  const { index, previousRecord } = recordOrder.get(rec.id) ?? { index: 0 };
                  const runLabel =
                    index === 0
                      ? t('ล่าสุด', 'Latest')
                      : index === 1
                        ? t('ก่อนหน้า', 'Previous')
                        : t('เก่ากว่า', 'Older');
                  const followBack = getFollowBackSummary(rec.counts, t, locale);

                  const followerDelta = previousRecord
                    ? rec.counts.followers - previousRecord.counts.followers
                    : null;

                  return (
                    <article
                      key={rec.id}
                      className="overflow-hidden rounded-[10px] border border-rule bg-paper-2"
                    >
                      {/* Header Row: Owner Account, Date, File Chip & Subtle Delete */}
                      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${index === 0 ? 'border-ok/35 bg-ok-soft text-ok' : 'border-rule bg-paper-3 text-muted'}`}
                            >
                              {runLabel}
                            </span>
                            {rec.ownerHandle ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-cool/35 bg-cool-soft px-2 py-0.5 text-xs font-semibold text-cool">
                                <User className="h-3 w-3 shrink-0" aria-hidden="true" />@
                                {rec.ownerHandle}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper-3 px-2 py-0.5 text-xs text-muted">
                                <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                                {t(
                                  'ไม่ระบุชื่อบัญชีในชื่อไฟล์',
                                  'The filename doesn’t identify the account',
                                )}
                              </span>
                            )}
                            {rec.pdfSavedTo && rec.pdfSavedTo !== 'none' && (
                              <span className="rounded bg-ok-soft px-2 py-0.5 text-[11px] font-medium text-ok">
                                PDF:{' '}
                                {rec.pdfSavedTo === 'device'
                                  ? t('บันทึกลงเครื่อง', 'Saved to device')
                                  : 'Google Drive'}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-ink">
                            {t('ข้อมูล ณ ', 'As of ')}
                            {formatSnapshotDate(rec.snapshotDateLabel, locale)}
                          </h3>
                          <p className="measured mt-1.5 text-xs break-all text-ink-2">
                            {rec.sourceFileName}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                            <span>
                              {t('ขนาด ZIP', 'ZIP size')}{' '}
                              <strong className="measured font-medium text-ink-2">
                                {rec.sourceFileSize === undefined
                                  ? t('ไม่มีข้อมูลขนาด', 'Unavailable')
                                  : formatBytes(rec.sourceFileSize)}
                              </strong>
                            </span>
                            <span>
                              {t('วิเคราะห์เมื่อ', 'Analyzed')}{' '}
                              {formatAnalyzedDateTime(rec.analyzedAtIso, locale)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setPendingDeletion({ kind: 'record', record: rec })}
                          aria-label={t(
                            `ลบประวัติวันที่ ${formatSnapshotDate(rec.snapshotDateLabel, locale)}`,
                            `Delete the analysis from ${formatSnapshotDate(rec.snapshotDateLabel, locale)}`,
                          )}
                          title={t('ลบรายการนี้', 'Delete this record')}
                          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent text-muted transition-colors hover:border-bad/40 hover:bg-bad-soft hover:text-bad"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Middle Row: 4-Column Metric Strip */}
                      <div className="grid grid-cols-2 gap-2 px-5 pb-4 sm:grid-cols-4">
                        <div className="rounded-lg border border-rule bg-paper-3 px-3 py-2.5">
                          <p className="text-[11px] text-muted">{t('ผู้ติดตาม', 'Followers')}</p>
                          <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span className="measured text-base font-semibold text-ink">
                              {rec.counts.followers.toLocaleString(locale)}
                            </span>
                            {followerDelta !== null && followerDelta !== 0 && (
                              <span
                                className={`measured text-[11px] font-medium ${
                                  followerDelta > 0 ? 'text-ok' : 'text-bad'
                                }`}
                              >
                                {formatSignedDelta(followerDelta)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-rule bg-paper-3 px-3 py-2.5">
                          <p className="text-[11px] text-muted">{t('กำลังติดตาม', 'Following')}</p>
                          <p className="measured mt-0.5 text-base font-semibold text-cool">
                            {rec.counts.following.toLocaleString(locale)}
                          </p>
                        </div>

                        <div className="rounded-lg border border-rule bg-paper-3 px-3 py-2.5">
                          <p className="text-[11px] text-muted">
                            {t('ไม่ติดตามกลับ', 'Not following back')}
                          </p>
                          <p className="measured mt-0.5 text-base font-semibold text-accent">
                            {rec.counts.notFollowingBack.toLocaleString(locale)}
                          </p>
                        </div>

                        <div className="rounded-lg border border-rule bg-paper-3 px-3 py-2.5">
                          <p className="text-[11px] text-muted">
                            {t('ติดตามกันทั้งคู่', 'Mutual follows')}
                          </p>
                          <p className="measured mt-0.5 text-base font-semibold text-ok">
                            {rec.counts.mutual.toLocaleString(locale)}
                          </p>
                        </div>
                      </div>

                      {/* Footer Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-paper-3/60 px-5 py-2.5">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
                        >
                          <span>
                            {isExpanded
                              ? t('ซ่อนรายละเอียด', 'Hide details')
                              : t('รายละเอียดเพิ่มเติม', 'More details')}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>

                        {canOpenFull ? (
                          <div className="ml-auto flex flex-wrap justify-end gap-2">
                            <NormalButton
                              variant="primary"
                              onClick={() => onOpenRecord(rec)}
                              className="min-h-9 px-3.5 py-1.5 text-xs"
                            >
                              <span>{t('เปิดผลวิเคราะห์', 'Open results')}</span>
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </NormalButton>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">
                            {t('เก็บเฉพาะตัวเลขสรุป', 'Summary only')}
                          </span>
                        )}
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="space-y-2 border-t border-rule bg-paper-3 px-5 py-3.5 text-xs text-muted">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                            <span>
                              {t('คุณไม่ได้ติดตามกลับ:', 'You don’t follow back:')}{' '}
                              <strong className="measured text-ink">
                                {rec.counts.notFollowedBack.toLocaleString(locale)}
                                {t('บัญชี', ' accounts')}
                              </strong>
                            </span>
                            <span>
                              {followBack.label}{' '}
                              <strong className="measured text-ink">{followBack.value}</strong>
                            </span>
                          </div>

                          {previousRecord && (
                            <p>
                              {t('เทียบกับรอบก่อนหน้า (', 'Compared with the previous export (')}
                              {formatSnapshotDate(previousRecord.snapshotDateLabel, locale)}
                              {t('): ผู้ติดตาม', '): Followers')}{' '}
                              <strong className="measured text-ink">
                                {formatSignedDelta(
                                  rec.counts.followers - previousRecord.counts.followers,
                                )}
                              </strong>{' '}
                              {t('· ไม่ติดตามกลับ', ' · Not following back')}{' '}
                              <strong className="measured text-accent">
                                {formatSignedDelta(
                                  rec.counts.notFollowingBack -
                                    previousRecord.counts.notFollowingBack,
                                )}
                              </strong>
                            </p>
                          )}

                          {rec.pdfFileName && (
                            <p>
                              {t('ไฟล์ PDF ล่าสุด:', 'Latest PDF:')}{' '}
                              <span className="measured text-ink">{rec.pdfFileName}</span>
                            </p>
                          )}

                          {!canOpenFull && (
                            <p>
                              {t(
                                'รายการนี้เก็บเฉพาะตัวเลขสรุปไว้ (เปิดข้อ 2 ด้านซ้าย เพื่อให้รอบถัดไปเก็บรายชื่อไว้กดเปิดดูย้อนหลังได้)',
                                'This entry contains counts only. Turn on option 2 to save account lists from future analyses.',
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

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
                      onClick={() => changePage(Math.max(0, safePageIndex - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      {t('ก่อนหน้า', 'Previous')}
                    </NormalButton>
                    <NormalButton
                      variant="secondary"
                      disabled={safePageIndex >= totalPages - 1}
                      onClick={() => changePage(Math.min(totalPages - 1, safePageIndex + 1))}
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
      </div>

      <dialog
        ref={deletionDialog}
        onClose={() => setPendingDeletion(null)}
        role="alertdialog"
        aria-labelledby="history-deletion-title"
        aria-describedby="history-deletion-details"
        className="m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md rounded-xl border border-rule bg-paper-2 p-5 text-ink shadow-xl backdrop:bg-black/60 sm:p-6"
      >
        <h2 id="history-deletion-title" className="text-lg font-semibold">
          {recordToDelete
            ? t('ลบรายการประวัตินี้ไหม?', 'Delete this history entry?')
            : t('ล้างประวัติทั้งหมดไหม?', 'Clear all history?')}
        </h2>
        <div
          id="history-deletion-details"
          className="mt-2 space-y-2 text-sm leading-relaxed text-ink-2"
        >
          {recordToDelete ? (
            <div>
              <p className="wrap-anywhere font-medium text-ink">{recordToDelete.sourceFileName}</p>
              <p>
                {t('วิเคราะห์เมื่อ', 'Analyzed')}{' '}
                {formatAnalyzedDateTime(recordToDelete.analyzedAtIso, locale)}
              </p>
            </div>
          ) : (
            <p>
              {t(
                `จะลบประวัติ ${records.length.toLocaleString(locale)} รายการในเบราว์เซอร์นี้ และปิดการบันทึกประวัติทั้งสองระดับ`,
                `This will delete all ${records.length.toLocaleString(locale)} history entries in this browser and turn off both history settings.`,
              )}
            </p>
          )}
          <p>{t('ประวัติที่ลบแล้วกู้คืนไม่ได้', 'Deleted history can’t be recovered.')}</p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelDeletion}
            type="button"
            className="btn btn--secondary"
            onClick={() => deletionDialog.current?.close()}
          >
            {t('ยกเลิก', 'Cancel')}
          </button>
          <NormalButton variant="danger" onClick={confirmDeletion}>
            {recordToDelete ? t('ลบรายการ', 'Delete entry') : t('ล้างทั้งหมด', 'Clear all')}
          </NormalButton>
        </div>
      </dialog>
    </div>
  );
}
