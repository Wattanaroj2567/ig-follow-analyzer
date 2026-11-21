import {
  ArrowDown,
  ArrowRight,
  FileArchive,
  FileUp,
  HardDrive,
  Lightbulb,
  UserRoundMinus,
} from 'lucide-react';
import type { MouseEventHandler } from 'react';
import { FollowerTimeline } from '../components/FollowerTimeline';
import {
  DEMO_CURRENT_EXPORT,
  DEMO_FOLLOW_TIMESTAMP,
  DEMO_MISSING_FOLLOWER,
  DEMO_PREVIOUS_EXPORT,
} from '../data/demoAnalysis';
import { formatDate, formatSnapshotDate } from '../lib/dates';
import { useLanguage } from '../lib/language';
import { demoHref, pageHref } from '../lib/routes';

interface LocalHistoryPreviewProps {
  onOpenDemo: () => void;
  onOpenHistory: MouseEventHandler<HTMLAnchorElement>;
}

export function LocalHistoryPreview({ onOpenDemo, onOpenHistory }: LocalHistoryPreviewProps) {
  const { t, locale } = useLanguage();
  const uploads = [
    {
      icon: FileArchive,
      stage: t('รอบแรก', 'First export'),
      title: t('เปิดประวัติ แล้วอัปโหลด ZIP 1 ไฟล์', 'Turn on history and upload one ZIP'),
      detail: t(
        'เปิดทั้งบันทึกสรุปและจำรายชื่อ เพื่อเก็บรายชื่อรอบแรกไว้เทียบ',
        'Enable summary and account list storage to save the first list for comparison.',
      ),
    },
    {
      icon: FileUp,
      stage: t('รอบถัดไป', 'Next export'),
      title: t('อัปโหลด ZIP ใหม่ 1 ไฟล์', 'Upload one new ZIP'),
      detail: t(
        'ใช้บัญชีและเบราว์เซอร์เดิม ระบบจะเทียบกับรอบก่อนให้ แล้วเลือกไฟล์ย้อนหลังได้ในหน้าผล',
        'Use the same account and browser. The app compares with the previous export, and you can choose an older file in your results.',
      ),
    },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-rule bg-paper-2">
      <ol role="list" className="grid md:grid-cols-3">
        {uploads.map(({ icon: Icon, stage, title, detail }) => (
          <li
            key={stage}
            className="relative flex gap-3 px-4 py-5 md:flex-col md:gap-4 md:p-6 md:pl-9 md:first:pl-6"
          >
            <Icon className="size-6 shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-accent">{stage}</p>
              <h3 className="mt-0.5 text-base leading-snug font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-snug text-muted">{detail}</p>
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex translate-y-1/2 items-center gap-3 text-accent md:top-0 md:left-auto md:translate-x-1/2 md:translate-y-0 md:flex-col"
            >
              <span className="h-px flex-1 bg-rule md:h-auto md:w-px" />
              <ArrowDown className="size-5 shrink-0 md:hidden" />
              <ArrowRight className="hidden size-7 shrink-0 md:block" />
              <span className="h-px flex-1 bg-rule md:h-auto md:w-px" />
            </span>
          </li>
        ))}
        <li className="flex gap-3 bg-bad-soft px-4 py-5 md:flex-col md:gap-4 md:p-6 md:pl-9">
          <UserRoundMinus className="size-6 shrink-0 text-bad" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-bad">
              {t('ตัวอย่างไทม์ไลน์', 'Example timeline')}
            </p>
            <h3 className="mt-0.5 text-base leading-snug font-semibold text-ink">
              {t('เพิ่งเลิกติดตาม', 'Recently unfollowed')}
            </h3>
            <p className="mt-1 text-sm leading-snug font-semibold text-bad">
              @{DEMO_MISSING_FOLLOWER}
            </p>
            <div className="mt-3">
              <FollowerTimeline
                previousDate={formatSnapshotDate(DEMO_PREVIOUS_EXPORT, locale)}
                currentDate={formatSnapshotDate(DEMO_CURRENT_EXPORT, locale)}
                followDate={formatDate(new Date(DEMO_FOLLOW_TIMESTAMP * 1000), locale)}
                missing
              />
            </div>
          </div>
        </li>
      </ol>
      <div
        role="note"
        className="flex items-start gap-2.5 border-t border-rule px-4 py-3 text-sm leading-relaxed text-ink-2 md:px-6"
      >
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0 max-w-3xl space-y-2">
          <p className="font-semibold text-ink">
            {t('ทิปสำหรับเทียบย้อนหลัง', 'Tip for comparing exports')}
          </p>
          <ul className="list-disc space-y-1.5 ps-5">
            <li>
              {t(
                'ลองจดยอดผู้ติดตามบนโปรไฟล์ Instagram ตอนเก็บ ZIP รอบแรก',
                'Note the follower count on your Instagram profile when you save your first ZIP.',
              )}
            </li>
            <li>
              {t(
                'ถ้าเห็นว่ายอดลดลง ให้ขอ ZIP ใหม่มาเทียบเพื่อดูว่าบัญชีไหนหายจากรายชื่อ',
                'If the count looks lower, compare a new ZIP with the earlier one to see which accounts are missing.',
              )}
            </li>
            <li>
              {t(
                'ถ้าจำยอดเดิมไม่ได้ ก็ใช้ ZIP รอบก่อนที่บันทึกไว้เทียบได้เลย',
                'If you don’t remember the earlier count, you can still compare with your saved ZIP.',
              )}
            </li>
          </ul>
          <p className="text-muted">
            {t(
              'ลองขอ ZIP ใหม่วันถัดไปหรือหลังจากนั้น เพราะไฟล์ที่ขอวันเดียวกันอาจมีรายชื่อเหมือนกัน',
              'Try requesting a fresh ZIP the next day or later. Same-day exports may contain the same list.',
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-rule bg-paper-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="flex items-center gap-2 text-sm text-muted">
          <HardDrive className="size-4 shrink-0" aria-hidden="true" />
          {t('ประวัติเก็บในเบราว์เซอร์นี้', 'History stays in this browser.')}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            className="btn btn--secondary"
            href={demoHref('results')}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpenDemo();
            }}
          >
            {t('ลองดูผลเทียบ 2 ไฟล์', 'Try comparing two sample ZIPs')}
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </a>
          <a className="btn btn--primary" href={pageHref('history')} onClick={onOpenHistory}>
            {t('ตั้งค่าประวัติบนเครื่อง', 'Set up local history')}
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
