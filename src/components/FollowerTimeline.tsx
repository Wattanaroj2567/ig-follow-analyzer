import { useLanguage } from '../lib/language';

interface FollowerTimelineProps {
  previousDate: string;
  currentDate: string;
  followDate?: string;
  missing: boolean;
}

export function FollowerTimeline({
  previousDate,
  currentDate,
  followDate,
  missing,
}: FollowerTimelineProps) {
  const { t } = useLanguage();
  const followLabel = t('เริ่มติดตามตามวันที่ในไฟล์', 'Follow date recorded in the file');
  const steps = [
    ...(missing && followDate
      ? [{ date: followDate, label: followLabel, color: 'bg-accent' }]
      : []),
    {
      date: previousDate,
      label: missing
        ? t('พบในรายชื่อรอบก่อน', 'In the previous follower list')
        : t('ไม่พบในรายชื่อรอบก่อน', 'Absent from the previous follower list'),
      color: 'bg-muted',
    },
    {
      date: currentDate,
      label: missing
        ? t('ไม่พบในรายชื่อรอบล่าสุด', 'Absent from the latest follower list')
        : t('พบในรายชื่อรอบล่าสุด', 'In the latest follower list'),
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
