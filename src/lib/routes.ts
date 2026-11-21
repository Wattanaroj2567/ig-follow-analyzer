import type { PageId } from '../components/AppShell';
import type { RelationshipKey } from '../data/relationshipMetrics';

export const PRIVACY_TOPICS = ['feedback-data', 'review-data'] as const;
export type PrivacyTopic = (typeof PRIVACY_TOPICS)[number];

export function pageHref(id: PageId): string {
  return id === 'landing' ? '#/' : `#/${id}`;
}

export function privacyHref(topic: PrivacyTopic): string {
  return `${pageHref('terms')}?section=${topic}`;
}

export const exportDateRangeHref = `${pageHref('how-it-works')}?section=date-range`;

export function demoHref(
  id: 'results' | 'pdf' | 'history',
  category?: RelationshipKey,
  record?: string,
): string {
  const categoryQuery = category ? `&category=${category}` : '';
  const recordQuery = record ? `&record=${encodeURIComponent(record)}` : '';
  return `${pageHref(id)}?demo${categoryQuery}${recordQuery}`;
}
