import { ChevronRight } from 'lucide-react';
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
import type { FollowCounts } from '../types/analyzer';
import { PercentageCalculationDetails } from './PercentageCalculationDetails';

type Segment = (typeof RELATIONSHIP_SEGMENTS)[number];

interface OverviewProps {
  counts: FollowCounts;
  selected: RelationshipKey | null;
  onSelect: (key: RelationshipKey) => void;
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
