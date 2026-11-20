import type { PageId } from '../components/AppShell';
import type { RelationshipKey } from '../data/relationshipMetrics';

export function pageHref(id: PageId): string {
  return id === 'landing' ? '#/' : `#/${id}`;
}

export function demoHref(id: 'results' | 'pdf', category?: RelationshipKey): string {
  return `${pageHref(id)}?demo${category ? `&category=${category}` : ''}`;
}
