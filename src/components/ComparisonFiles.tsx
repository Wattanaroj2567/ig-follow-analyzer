import { ArrowLeftRight, ChevronDown, LockKeyhole } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { ComparisonExport } from '../lib/comparison';
import { formatAnalysisTime, formatSnapshotDate } from '../lib/dates';
import { useLanguage } from '../lib/language';
import type { AnalysisResult } from '../types/analyzer';

const roundTagClass =
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium';
const neutralRoundTagClass = `${roundTagClass} border-rule-2 bg-paper-2 text-ink-2`;

export interface ComparisonFilesState {
  isLatest: boolean;
  earlier: ComparisonExport[];
  previous: ComparisonExport;
  automatic: boolean;
}

export function ComparisonFiles({
  current,
  comparison,
  onSelect,
}: {
  current: AnalysisResult;
  comparison: ComparisonFilesState;
  onSelect: (id: string | null) => void;
}) {
  const { t, locale } = useLanguage();
  const { previous, earlier, isLatest, automatic } = comparison;
  const previousRound = t('รอบก่อนหน้า', 'Previous export');
  const olderRound = t('รอบเก่ากว่า', 'Older export');
  const canChange = isLatest && earlier.length > 1;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerId = useId();
  const pickerButton = useRef<HTMLButtonElement>(null);
  const seenSeconds = new Set<string>();
  const sharedSeconds = new Set<string>();
  for (const file of [current, ...earlier.map(({ analysis }) => analysis)]) {
    const second = file.analyzedAtIso.slice(0, 19);
    if (seenSeconds.has(second)) sharedSeconds.add(second);
    seenSeconds.add(second);
  }
  const fileDetails = (file: AnalysisResult) => (
    <>
      <span className="block font-semibold wrap-anywhere text-ink">{file.sourceFileName}</span>
      <span className="mt-0.5 block text-xs leading-relaxed text-muted">
        {formatSnapshotDate(file.snapshotDateLabel, locale)} · {t('วิเคราะห์เวลา', 'Analyzed at')}{' '}
        <time dateTime={file.analyzedAtIso}>
          {formatAnalysisTime(
            file.analyzedAtIso,
            locale,
            sharedSeconds.has(file.analyzedAtIso.slice(0, 19)),
          )}
        </time>
      </span>
    </>
  );

  return (
    <div className="mt-3 rounded-md border border-rule bg-paper-3">
      <dl className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="min-w-0 px-3.5 py-3">
          <dt>
            {isLatest ? (
              <span className={`${roundTagClass} border-cool/35 bg-cool-soft text-cool`}>
                <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
                {t('ไฟล์ล่าสุด', 'Latest export')}
              </span>
            ) : (
              <span className={neutralRoundTagClass}>{t('ไฟล์ที่เปิดอยู่', 'Current export')}</span>
            )}
          </dt>
          <dd className="mt-1 text-sm">{fileDetails(current)}</dd>
        </div>
        <div className="relative grid min-w-0 grid-cols-1 content-start px-3.5 pt-5 pb-3 sm:pt-3 sm:pl-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-3">
          <dt
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted lg:col-start-1 lg:row-start-1"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-px left-1/2 grid size-7 -translate-1/2 place-items-center bg-paper-3 text-accent sm:top-11 sm:-left-px"
            >
              <ArrowLeftRight className="size-5 rotate-90 sm:rotate-0" />
            </span>
            <span className={neutralRoundTagClass}>{automatic ? previousRound : olderRound}</span>
            <span>
              {automatic
                ? t('เทียบกับ · อัตโนมัติ', 'Compared with · Automatic')
                : t('เทียบกับ · เลือกเอง', 'Compared with · Manual')}
            </span>
          </dt>
          <dd
            className="mt-1 min-w-0 text-sm lg:col-start-1 lg:row-start-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {fileDetails(previous.analysis)}
          </dd>
          {canChange && (
            <dd className="mt-2 flex min-w-0 items-center justify-end lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
              <button
                ref={pickerButton}
                type="button"
                aria-expanded={pickerOpen}
                aria-controls={pickerId}
                onClick={() => setPickerOpen((open) => !open)}
                className="btn btn--secondary max-w-full px-3! text-left text-sm! whitespace-normal!"
              >
                <span className="min-w-0 wrap-anywhere">
                  {t('เปลี่ยนไฟล์ย้อนหลัง', 'Change previous export')}
                </span>
                <ChevronDown
                  className={`size-3.5 shrink-0 ${pickerOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </dd>
          )}
          {canChange && (
            <dd
              id={pickerId}
              hidden={!pickerOpen}
              className="mt-3 border-t border-rule pt-2 lg:col-span-2"
            >
              <fieldset className="min-w-0">
                <legend className="sr-only">
                  {t('ไฟล์ย้อนหลังที่ใช้เทียบ', 'Previous export to compare')}
                </legend>
                <div className="comparison-export-list max-h-64 space-y-2 overflow-y-auto p-1">
                  {earlier.map(({ id, analysis }, index) => (
                    <label
                      key={id}
                      className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-md border border-rule px-3 py-2 text-sm hover:border-rule-2 has-checked:border-accent/60 has-checked:bg-accent-soft"
                    >
                      <input
                        type="radio"
                        name="comparison-export"
                        checked={previous.id === id}
                        onChange={() => onSelect(index === 0 ? null : id)}
                        className="mt-1 size-4 shrink-0 accent-accent"
                      />
                      <span className="flex min-w-0 flex-1 flex-wrap items-start gap-x-2 gap-y-1">
                        <span className="min-w-0">{fileDetails(analysis)}</span>
                        <span className={`${neutralRoundTagClass} ml-auto`}>
                          {index === 0 ? previousRound : olderRound}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </dd>
          )}
          {canChange && !automatic && (
            <dd className="mt-2 flex border-t border-rule pt-1 lg:col-span-2">
              <button
                type="button"
                onClick={() => {
                  pickerButton.current?.focus();
                  onSelect(null);
                }}
                className="min-h-8 cursor-pointer rounded-sm text-left text-xs font-medium text-cool hover:text-ink hover:underline"
              >
                {t('กลับไปเทียบรอบก่อนหน้า', 'Reset to previous export')}
              </button>
            </dd>
          )}
        </div>
      </dl>
    </div>
  );
}
