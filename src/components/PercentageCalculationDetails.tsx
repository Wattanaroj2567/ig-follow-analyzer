import { ChevronDown } from 'lucide-react';
import {
  formatRelationshipPercentage,
  getRelationshipMetrics,
  getRelationshipTotal,
  RELATIONSHIP_SEGMENTS,
} from '../data/relationshipMetrics';
import { useLanguage } from '../lib/language';
import type { FollowCounts } from '../types/analyzer';

export function PercentageCalculationDetails({
  counts,
  includeFollowBackRate = false,
}: {
  counts: FollowCounts;
  includeFollowBackRate?: boolean;
}) {
  const { t, locale } = useLanguage();
  const metrics = getRelationshipMetrics(t);
  const total = getRelationshipTotal(counts);
  const chartCounts = RELATIONSHIP_SEGMENTS.map((key) => counts[key].toLocaleString(locale));
  const chartTotal = `${chartCounts.join(' + ')} = ${total.toLocaleString(locale)}`;
  const formula = (count: number, base: number) => {
    const percentage = formatRelationshipPercentage(count, base);
    return base > 0
      ? `${count.toLocaleString(locale)} ÷ ${base.toLocaleString(locale)} × 100 ≈ ${percentage}%`
      : t('แสดง 0.0% เมื่อไม่มีบัญชีในฐานที่ใช้หาร', 'Shows 0.0% when the total is zero.');
  };

  return (
    <details className="group/calculation mt-3 min-w-0 rounded-lg border border-rule bg-paper-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-3 [&::-webkit-details-marker]:hidden">
        {t('ดูวิธีคำนวณ', 'How percentages are calculated')}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted group-open/calculation:rotate-180"
        />
      </summary>
      <div className="space-y-3 border-t border-rule px-3 py-3 text-sm leading-relaxed text-ink-2">
        <div className="space-y-1 rounded-md bg-paper-3 px-3 py-2">
          <p className="font-semibold text-ink">
            {t('ยอดรวมที่ใช้หารในกราฟ', 'Total used to calculate chart percentages')}
          </p>
          <p>
            {t(
              'บวกยอดของ 3 หมวดด้านล่าง แต่ละบัญชีอยู่เพียงหมวดเดียว',
              'Add the counts from the three categories below. Each account belongs to just one of them.',
            )}
          </p>
          <p className="font-semibold text-ink tabular-nums">{chartTotal}</p>
          <p>
            {t(
              'ถ้าบวกยอด “ผู้ติดตามของคุณ” กับ “คุณกำลังติดตาม” บัญชีที่ติดตามกันจะถูกนับสองครั้ง',
              'Adding “Followers” and “Following” would count mutual follows twice.',
            )}
          </p>
        </div>
        <dl className="grid gap-2">
          {RELATIONSHIP_SEGMENTS.map((key) => (
            <div key={key}>
              <dt className="font-semibold text-ink">{metrics[key].label}</dt>
              <dd className="tabular-nums">{formula(counts[key], total)}</dd>
            </div>
          ))}
          {includeFollowBackRate && (
            <div className="border-t border-rule pt-2">
              <dt className="font-semibold text-ink">
                {t('คนที่คุณติดตามและติดตามคุณกลับ', 'People you follow who follow you back')}
              </dt>
              <dd className="tabular-nums">{formula(counts.mutual, counts.following)}</dd>
              <dd>
                {t(
                  `ฐานหารคือ ${counts.following.toLocaleString(locale)} บัญชีที่คุณกำลังติดตาม`,
                  `The total here is the ${counts.following.toLocaleString(locale)} accounts you follow.`,
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </details>
  );
}
