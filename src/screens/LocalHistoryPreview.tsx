import {
  ArrowDown,
  ArrowRight,
  FileArchive,
  FileUp,
  HardDrive,
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
  onOpenHistory: MouseEventHandler<HTMLAnchorElement>;
}

export function LocalHistoryPreview({ onOpenHistory }: LocalHistoryPreviewProps) {
  const { t, locale } = useLanguage();
  const uploads = [
    {
      icon: FileArchive,
      stage: t('รอบแรก', 'First export'),
      title: t('เปิดประวัติ แล้วอัปโหลด ZIP', 'Turn on history and upload a ZIP'),
      detail: t('เปิดทั้งสวิตช์บันทึกสรุปและจำรายชื่อ', 'Enable both summary and account list storage.'),
    },
    {
      icon: FileUp,
      stage: t('รอบถัดไป', 'Next export'),
      title: t('อัปโหลด ZIP รอบใหม่', 'Upload a newer ZIP'),
      detail: t('ใช้บัญชีเดิมและเบราว์เซอร์เดิม', 'Use the same account and browser.'),
    },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-rule bg-paper-2">
      <ol
        role="list"
        className="grid divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        {uploads.map(({ icon: Icon, stage, title, detail }) => (
          <li key={stage} className="relative flex gap-3 px-4 py-5 md:flex-col md:gap-4 md:p-6">
            <Icon className="size-6 shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-accent">{stage}</p>
              <h3 className="mt-0.5 text-base leading-snug font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-snug text-muted">{detail}</p>
            </div>
            <ArrowDown
              className="absolute bottom-1 left-5 size-4 text-muted md:hidden"
              aria-hidden="true"
            />
            <ArrowRight
              className="absolute top-7 right-3 hidden size-4 text-muted md:block"
              aria-hidden="true"
            />
          </li>
        ))}
        <li className="flex gap-3 bg-bad-soft px-4 py-5 md:flex-col md:gap-4 md:p-6">
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
      <div className="flex flex-col gap-3 border-t border-rule bg-paper-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="flex items-center gap-2 text-sm text-muted">
          <HardDrive className="size-4 shrink-0" aria-hidden="true" />
          {t('ประวัติเก็บในเบราว์เซอร์นี้', 'History stays in this browser.')}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a className="btn btn--secondary" href={demoHref('results')}>
            {t('ลองดูผลเทียบตัวอย่าง', 'Try the sample comparison')}
          </a>
          <a className="btn btn--primary" href={pageHref('history')} onClick={onOpenHistory}>
            {t('ตั้งค่าประวัติบนเครื่อง', 'Set up local history')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
