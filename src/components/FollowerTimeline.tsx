import { useLanguage } from '../lib/language';

interface FollowerTimelineProps {
  previousDate: string;
  currentDate: string;
  followDate?: string;
  missing: boolean;
  previousWasSelected?: boolean;
  isLatestExport?: boolean;
}

export function FollowerTimeline({
  previousDate,
  currentDate,
  followDate,
  missing,
  previousWasSelected = false,
  isLatestExport = true,
}: FollowerTimelineProps) {
  const { t } = useLanguage();
  const followLabel = t('เริ่มติดตามตามวันที่ในไฟล์', 'Follow date recorded in the file');
  const previousList = previousWasSelected
    ? t('รายชื่อไฟล์ที่เลือกเทียบ', 'the selected export’s follower list')
    : t('รายชื่อรอบก่อน', 'the previous follower list');
  const currentList = isLatestExport
    ? t('รายชื่อรอบล่าสุด', 'the latest follower list')
    : t('รายชื่อไฟล์ที่เปิดอยู่', 'the current follower list');
  const steps = [
    ...(missing && followDate
      ? [{ date: followDate, label: followLabel, color: 'bg-accent' }]
      : []),
    {
      date: previousDate,
      label: missing
        ? t(`พบใน${previousList}`, `In ${previousList}`)
        : t(`ไม่พบใน${previousList}`, `Absent from ${previousList}`),
      color: 'bg-muted',
    },
    {
      date: currentDate,
      label: missing
        ? t(`ไม่พบใน${currentList}`, `Absent from ${currentList}`)
        : t(`พบใน${currentList}`, `In ${currentList}`),
      color: missing ? 'bg-bad' : 'bg-ok',
    },
  ];

  return (
    <div className="text-xs leading-relaxed">
      <ol role="list" className="ml-1 border-l border-rule-2">
        {steps.map(({ date, label, color }) => (
          <li key={label} className="relative pb-2 pl-3.5 last:pb-0">
            <span
              className={`absolute top-1.5 -left-1 size-1.5 rounded-full ${color}`}
              aria-hidden="true"
            />
            <span className="font-semibold text-ink">{date}</span>
            <span className="ml-1.5 text-ink-2">{label}</span>
          </li>
        ))}
      </ol>
      {!missing && followDate && (
        <p className="mt-2 text-muted">
          {followLabel} · {followDate}
        </p>
      )}
    </div>
  );
}
