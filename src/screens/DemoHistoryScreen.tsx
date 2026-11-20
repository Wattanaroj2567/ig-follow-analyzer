import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  FileText,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { NormalButton } from '../components/NormalButton';
import { formatSnapshotDate } from '../lib/dates';
import { useLanguage } from '../lib/language';
import { demoHref } from '../lib/routes';
import type { AnalysisResult } from '../types/analyzer';

const RECENT_COUNT = 2;
const ARCHIVE_PAGE_SIZE = 4;

interface DemoHistoryScreenProps {
  samples: AnalysisResult[];
  onOpenResults: (record?: string) => void;
  onOpenComparisonPdf: (record: string) => void;
}

export function DemoHistoryScreen({
  samples,
  onOpenResults,
  onOpenComparisonPdf,
}: DemoHistoryScreenProps) {
  const { t, locale } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(0);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const start = showAll ? page * ARCHIVE_PAGE_SIZE : 0;
  const visible = samples.slice(start, start + (showAll ? ARCHIVE_PAGE_SIZE : RECENT_COUNT));
  const pageCount = Math.ceil(samples.length / ARCHIVE_PAGE_SIZE);

  const focusList = () => {
    listHeading.current?.focus({ preventScroll: true });
    listHeading.current?.scrollIntoView?.({ block: 'nearest' });
  };

  return (
    <div className="product-wrap py-9 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-rule pb-6">
          <a
            href={demoHref('results')}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpenResults();
            }}
            className="mb-3 inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-ink-2 no-underline hover:text-ink"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            {t('กลับไปแดชบอร์ดตัวอย่าง', 'Back to sample dashboard')}
          </a>
          <h1 className="text-3xl text-ink sm:text-4xl">
            {t('ประวัติการวิเคราะห์ตัวอย่าง', 'Sample analysis history')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            {t(
              'ลองเปิดผลจากไฟล์ ZIP สมมติแต่ละรอบ ข้อมูลตัวอย่างแยกจากประวัติจริงของคุณ',
              'Open the results for each sample ZIP. Sample data is separate from your local history.',
            )}
          </p>
        </header>

        <section className="mt-6" aria-labelledby="sample-history-list">
          <h2
            id="sample-history-list"
            ref={listHeading}
            tabIndex={-1}
            className="scroll-mt-24 text-lg text-ink"
          >
            {showAll
              ? t('ไฟล์ตัวอย่างทั้งหมด', 'All sample files')
              : t('ไฟล์ที่วิเคราะห์ล่าสุด', 'Latest analyzed files')}
          </h2>
          <ol className="mt-3 space-y-3">
            {visible.map((sample) => (
              <li
                key={sample.sourceFileName}
                className="rounded-[10px] border border-rule bg-paper-2 px-4 py-3.5 sm:px-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">
                      {t('ข้อมูล ณ ', 'Data as of ')}
                      {formatSnapshotDate(sample.snapshotDateLabel, locale)}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <FileArchive className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="wrap-anywhere">{sample.sourceFileName}</span>
                    </p>
                  </div>
                  <div className="ml-auto flex flex-wrap justify-end gap-2">
                    {sample !== samples[0] && (
                      <NormalButton
                        variant="secondary"
                        onClick={() => onOpenComparisonPdf(sample.sourceFileName)}
                      >
                        <FileText className="size-4 shrink-0" aria-hidden="true" />
                        {t('สร้าง PDF เทียบกับไฟล์ล่าสุด', 'Compare with latest in PDF')}
                      </NormalButton>
                    )}
                    <NormalButton
                      variant="secondary"
                      onClick={() => onOpenResults(sample.sourceFileName)}
                    >
                      {t('เปิดผลวิเคราะห์', 'Open results')}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </NormalButton>
                  </div>
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3 text-xs">
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-muted">{t('ผู้ติดตาม', 'Followers')}</dt>
                    <dd className="measured font-semibold text-ink">
                      {sample.counts.followers.toLocaleString(locale)}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-muted">{t('ไม่ติดตามกลับ', 'Not following back')}</dt>
                    <dd className="measured font-semibold text-accent">
                      {sample.counts.notFollowingBack.toLocaleString(locale)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>

          {showAll ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <NormalButton
                variant="ghost"
                onClick={() => {
                  setShowAll(false);
                  setPage(0);
                  focusList();
                }}
              >
                {t('ดูเฉพาะไฟล์ล่าสุด', 'Show recent files')}
              </NormalButton>
              <div className="flex flex-wrap items-center gap-2">
                <span role="status" className="mr-1 text-xs text-muted">
                  {t(`หน้า ${page + 1} / ${pageCount}`, `Page ${page + 1} of ${pageCount}`)}
                </span>
                <NormalButton
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => {
                    setPage(page - 1);
                    focusList();
                  }}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  {t('ก่อนหน้า', 'Previous')}
                </NormalButton>
                <NormalButton
                  variant="secondary"
                  disabled={page + 1 >= pageCount}
                  onClick={() => {
                    setPage(page + 1);
                    focusList();
                  }}
                >
                  {t('ถัดไป', 'Next')}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </NormalButton>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex justify-end">
              <NormalButton
                onClick={() => {
                  setShowAll(true);
                  focusList();
                }}
              >
                {t(
                  `ดูประวัติตัวอย่างทั้งหมด (${samples.length} รายการ)`,
                  `View all sample history (${samples.length} entries)`,
                )}
                <ArrowRight className="size-4" aria-hidden="true" />
              </NormalButton>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
