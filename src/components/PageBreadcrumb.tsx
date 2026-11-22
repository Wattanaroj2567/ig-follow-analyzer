import { ArrowLeft, ChevronRight } from 'lucide-react';
import { type MouseEvent } from 'react';
import { useLanguage } from '../lib/language';
import { getBackLabel, getCrumbLabel, type TrailEntry } from '../lib/navigationTrail';

interface PageBreadcrumbProps {
  trail: TrailEntry[];
  onNavigateToIndex: (index: number) => void;
}

type VisibleItem =
  { kind: 'entry'; entry: TrailEntry; index: number } | { kind: 'ellipsis'; key: string };

export function PageBreadcrumb({ trail, onNavigateToIndex }: PageBreadcrumbProps) {
  const { t } = useLanguage();

  if (trail.length <= 1) return null;

  const parentIndex = trail.length - 2;
  const currentIndex = trail.length - 1;

  const visibleItems: VisibleItem[] =
    trail.length > 4
      ? [
          { kind: 'entry', entry: trail[0], index: 0 },
          { kind: 'ellipsis', key: 'ellipsis' },
          { kind: 'entry', entry: trail[parentIndex], index: parentIndex },
          { kind: 'entry', entry: trail[currentIndex], index: currentIndex },
        ]
      : trail.map((entry, index) => ({ kind: 'entry', entry, index }));

  const handleLinkClick = (index: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigateToIndex(index);
  };

  return (
    <nav aria-label={t('เส้นทางหน้า', 'Breadcrumb')} className="product-wrap pt-3 lg:pt-6">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
        {visibleItems.map((item, visiblePos) => {
          if (item.kind === 'ellipsis') {
            return (
              <li
                key={item.key}
                aria-hidden="true"
                className="hidden items-center gap-1.5 text-muted sm:flex"
              >
                <ChevronRight className="size-3.5 shrink-0 text-muted" />
                <span>…</span>
              </li>
            );
          }

          const { entry, index } = item;
          const isCurrent = index === currentIndex;
          const isParent = index === parentIndex;
          const showSeparator = visiblePos > 0;

          if (isCurrent) {
            return (
              <li
                key={`${entry.page}-${index}`}
                aria-current="page"
                className="hidden items-center gap-1.5 font-semibold text-ink sm:flex"
              >
                <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span>{getCrumbLabel(entry, t)}</span>
              </li>
            );
          }

          return (
            <li
              key={`${entry.page}-${index}`}
              className={
                isParent ? 'flex items-center gap-1.5' : 'hidden items-center gap-1.5 sm:flex'
              }
            >
              {showSeparator && (
                <ChevronRight
                  className="hidden size-3.5 shrink-0 text-muted sm:inline-block"
                  aria-hidden="true"
                />
              )}
              <a
                href={entry.href}
                onClick={handleLinkClick(index)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-medium text-muted transition-colors hover:text-ink hover:underline lg:min-h-8"
              >
                {isParent && <ArrowLeft className="size-4 shrink-0 sm:hidden" aria-hidden="true" />}
                {isParent ? (
                  <>
                    <span className="sm:hidden">{getBackLabel(entry, t)}</span>
                    <span className="hidden sm:inline">{getCrumbLabel(entry, t)}</span>
                  </>
                ) : (
                  <span>{getCrumbLabel(entry, t)}</span>
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
