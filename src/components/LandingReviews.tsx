import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/language';
import { getReviewEndpoint, loadReviewSummary } from '../lib/review';
import { pageHref } from '../lib/routes';

function reviewInitial(name: string) {
  const initial = name.replace(/^[เแโใไ](?=[ก-ฮ])/u, '').match(/[\p{L}\p{N}]\p{M}*/u)?.[0];
  return Array.from(initial?.toUpperCase() ?? '?')[0];
}

export function LandingReviews() {
  const { t } = useLanguage();
  const endpoint = getReviewEndpoint();
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof loadReviewSummary>>>(null);
  useEffect(() => {
    if (!endpoint) return;
    const request = new AbortController();
    void loadReviewSummary(endpoint, AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]))
      .then((data) => {
        if (!request.signal.aborted) setSummary(data);
      })
      .catch(() => {
        // Reviews are optional content. A failed request leaves the landing page usable.
      });
    return () => request.abort();
  }, [endpoint]);

  if (!summary) return null;
  const { average, scoreCount, reviews } = summary;
  const locale = t('th-TH', 'en');
  const rating = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(average);
  const count = new Intl.NumberFormat(locale).format(scoreCount);
  return (
    <section className="py-6 sm:py-8" aria-labelledby="landing-review-heading">
      <div className="product-wrap space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="landing-review-heading" className="text-xl text-ink">
              {t('รีวิวจากผู้ใช้', 'User reviews')}
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-2">
              <Star className="size-4 fill-current text-accent" aria-hidden="true" />
              <strong className="text-ink">{rating} / 5</strong>
              {t(`จาก ${count} คะแนน`, `from ${count} ${scoreCount === 1 ? 'rating' : 'ratings'}`)}
            </p>
          </div>
          <a
            className="text-sm font-semibold text-cool underline underline-offset-4"
            href={pageHref('about')}
          >
            {t('เขียนรีวิว', 'Write a review')}
          </a>
        </div>
        {reviews.length > 0 && (
          <ul
            aria-label={t('ข้อความรีวิว เลื่อนเพื่อดูเพิ่มเติม', 'Review comments, scroll for more')}
            tabIndex={reviews.length > 1 ? 0 : undefined}
            className="flex snap-x gap-3 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-cool"
          >
            {reviews.map(({ displayName, rating: stars, comment }, index) => (
              <li
                key={index}
                className="flex w-[min(85%,23rem)] shrink-0 snap-start flex-col gap-3 rounded-lg border border-rule bg-paper-2 p-4 sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-1.5rem)/3)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent"
                  >
                    {reviewInitial(displayName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold wrap-break-word text-ink">{displayName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Star className="size-3 fill-current text-accent" aria-hidden="true" />{' '}
                      {stars} / 5
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-line text-ink-2">
                  {comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
