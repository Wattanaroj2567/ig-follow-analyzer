import type { PageId } from '../components/AppShell';
import type { RelationshipKey } from '../data/relationshipMetrics';

export function pageHref(id: PageId): string {
  return id === 'landing' ? '#/' : `#/${id}`;
}

export function demoHref(
  id: 'results' | 'pdf' | 'history',
  category?: RelationshipKey,
  record?: string,
): string {
  const categoryQuery = category ? `&category=${category}` : '';
  const recordQuery = record ? `&record=${encodeURIComponent(record)}` : '';
  return `${pageHref(id)}?demo${categoryQuery}${recordQuery}`;
}
