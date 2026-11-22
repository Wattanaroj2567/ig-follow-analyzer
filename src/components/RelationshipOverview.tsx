import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import {
  formatRelationshipPercentage,
  getRelationshipMetrics,
  getRelationshipTotal,
  RELATIONSHIP_ORDER,
  RELATIONSHIP_SEGMENTS,
  type RelationshipKey,
} from '../data/relationshipMetrics';
import { useLanguage } from '../lib/language';
import { exportDateRangeHref } from '../lib/routes';
import type { FollowCounts } from '../types/analyzer';
import { PercentageCalculationDetails } from './PercentageCalculationDetails';

type Segment = (typeof RELATIONSHIP_SEGMENTS)[number];

interface OverviewProps {
  counts: FollowCounts;
  selected: RelationshipKey | null;
  onSelect: (key: RelationshipKey) => void;
}

function ProfileCountDifferenceDetails() {
  const { t } = useLanguage();
  return (
    <details className="group/profile-counts mt-3 min-w-0 rounded-lg border border-cool/35 bg-cool-soft/65">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-ink hover:bg-cool-soft [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <Info className="size-4 shrink-0 text-cool" aria-hidden="true" />
          <span>
            {t(
              'ทำไมยอดในไฟล์ ZIP อาจมากกว่าหรือต่างจากหน้าโปรไฟล์ Instagram?',
              'Why can counts in the ZIP differ from my Instagram profile?',
            )}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-cool transition-transform group-open/profile-counts:rotate-180"
        />
      </summary>
      <div className="space-y-3 border-t border-cool/25 bg-paper-2 px-3.5 py-3.5 text-sm leading-relaxed text-ink-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-rule bg-paper-3 p-3">
            <p className="font-semibold text-ink">
              {t('1. ยอดใน ZIP มากกว่าหน้าโปรไฟล์', '1. Count in the ZIP is higher')}
            </p>
            <p className="mt-1">
              {t(
                'ไฟล์ที่ส่งออกจาก Instagram ยังคงมีรายชื่อ “บัญชีที่ถูกปิดใช้งาน” (Deactivated) และบัญชีที่ถูกลบ (เช่น __deleted__*) รวมอยู่ด้วย ในขณะที่แอป Instagram หักบัญชีเหล่านี้ออกจากตัวเลขบนหน้าโปรไฟล์แล้ว แต่ไม่ได้ระบุสถานะแยกไว้ในไฟล์ ZIP',
                'Instagram exports still include deactivated accounts and deleted placeholders (such as __deleted__*). The Instagram app subtracts those from your profile total without marking their status in the ZIP.',
              )}
            </p>
          </div>
          <div className="rounded-md border border-rule bg-paper-3 p-3">
            <p className="font-semibold text-ink">
              {t(
                '2. ยอดใน ZIP น้อยกว่าหรือเปลี่ยนหลังขอไฟล์',
                '2. Count in the ZIP is lower or changed later',
              )}
            </p>
            <p className="mt-1">
              {t(
                'หากเลือกช่วงวันที่จำกัดตอนขอไฟล์ บางบัญชีจะไม่ถูกใส่มาใน ZIP หรืออาจมีคนกดติดตาม/เลิกติดตามหลังจากเวลาที่ Instagram สร้างไฟล์เสร็จ',
                'A limited export date range leaves older follows out of the ZIP, or accounts may have followed or unfollowed you after Instagram generated the file.',
              )}
            </p>
            <a
              href={exportDateRangeHref}
              className="mt-2 inline-block font-medium text-cool underline underline-offset-4 hover:text-ink"
            >
              {t('ดูวิธีเลือกช่วงเวลา “ตลอดเวลา (All time)”', 'See how to select “All time”')}
            </a>
          </div>
        </div>
      </div>
    </details>
  );
}

export function RelationshipMetrics({
  counts,
  selected,
  onSelect,
  showDescriptions = true,
}: OverviewProps & { showDescriptions?: boolean }) {
  const { t, locale } = useLanguage();
  const metrics = getRelationshipMetrics(t);
  return (
    <div
      className="relationship-metrics"
      role="group"
      aria-label={t('เลือกหมวดรายชื่อจากการ์ด', 'Choose a relationship category')}
    >
      {RELATIONSHIP_ORDER.map((key) => {
        const { label, description } = metrics[key];
        return (
          <button
            key={key}
            type="button"
            className="relationship-metric"
            data-relationship={key}
            aria-pressed={selected === key}
            onClick={() => onSelect(key)}
          >
            <div className="relationship-metric-head">
              <span>{label}</span>
              <ChevronRight className="relationship-arrow" aria-hidden="true" />
            </div>
            <strong>{counts[key].toLocaleString(locale)}</strong>
            {showDescriptions && <small>{description}</small>}
          </button>
        );
      })}
    </div>
  );
}

function ringPath(start: number, end: number) {
  const point = (fraction: number) => {
    const angle = fraction * 2 * Math.PI - Math.PI / 2;
    return `${100 + 76 * Math.cos(angle)} ${100 + 76 * Math.sin(angle)}`;
  };
  // Two arcs also render the case where one relationship fills the entire ring.
  return `M ${point(start)} A 76 76 0 0 1 ${point((start + end) / 2)} A 76 76 0 0 1 ${point(end)}`;
}

export function RelationshipOverview({ counts, selected, onSelect }: OverviewProps) {
  const { t, locale } = useLanguage();
  const metrics = getRelationshipMetrics(t);
  const [hovered, setHovered] = useState<Segment | null>(null);
  const [pinned, setPinned] = useState<Segment | null>(null);
  const total = getRelationshipTotal(counts);
  const share = (count: number) => (total ? count / total : 0);
  const current = hovered ?? pinned;
  const slices = RELATIONSHIP_SEGMENTS.map((key, index) => {
    const start = RELATIONSHIP_SEGMENTS.slice(0, index).reduce(
      (sum, earlierKey) => sum + counts[earlierKey],
      0,
    );
    return { key, path: ringPath(share(start), share(start + counts[key])) };
  });
  const togglePinned = (key: Segment) => setPinned((previous) => (previous === key ? null : key));

  return (
    <div className="relationship-overview">
      <RelationshipMetrics counts={counts} selected={selected} onSelect={onSelect} />
      <ProfileCountDifferenceDetails />
      <div className="relationship-chart">
        <div className="relationship-ring">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle className="relationship-track" cx="100" cy="100" r="76" />
            {slices.map(({ key, path }) =>
              counts[key] > 0 ? (
                <path
                  key={key}
                  d={path}
                  className="relationship-arc"
                  data-relationship={key}
                  data-highlight={current === key ? 'active' : current ? 'muted' : undefined}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setHovered(key);
                  }}
                  onPointerLeave={() => setHovered(null)}
                  onClick={() => togglePinned(key)}
                />
              ) : null,
            )}
          </svg>
          <div className="relationship-center" role="status">
            {current && (
              <>
                <strong>{counts[current].toLocaleString(locale)}</strong>
                <span>{metrics[current].label}</span>
              </>
            )}
          </div>
        </div>
        <div className="relationship-chart-info">
          <h3>{t('สัดส่วนความสัมพันธ์', 'Relationship breakdown')}</h3>
          <p>
            {t('ชี้หรือแตะหมวดเพื่อดูจำนวนบัญชี', 'Point to or tap a category to see its account count')}
          </p>
          <ul
            className="relationship-legend"
            aria-label={t('สัดส่วนในกราฟความสัมพันธ์', 'Relationship chart breakdown')}
          >
            {RELATIONSHIP_SEGMENTS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className="relationship-legend-item"
                  data-relationship={key}
                  data-highlight={current === key ? 'active' : undefined}
                  aria-pressed={pinned === key}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setHovered(key);
                  }}
                  onPointerLeave={() => setHovered(null)}
                  onClick={() => togglePinned(key)}
                >
                  <span className="relationship-swatch" aria-hidden="true" />
                  <span>{metrics[key].label}</span>
                  <span className="relationship-value">
                    <strong>{counts[key].toLocaleString(locale)}</strong>
                    <small>{formatRelationshipPercentage(counts[key], total)}%</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <PercentageCalculationDetails counts={counts} />
    </div>
  );
}
