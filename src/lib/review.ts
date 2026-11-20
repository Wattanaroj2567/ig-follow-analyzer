export function getReviewEndpoint(): string | undefined {
  const endpoint = import.meta.env.VITE_REVIEW_ENDPOINT?.trim();
  if (endpoint && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
    return endpoint;
  }
}

type PublicReview = { displayName: string; rating: number; comment: string };
type ReviewSummary = { scoreCount: number; average: number; reviews: PublicReview[] };

function isPublicReview(value: unknown): value is PublicReview {
  return (
    typeof value === 'object' &&
    value !== null &&
    'displayName' in value &&
    typeof value.displayName === 'string' &&
    value.displayName.length > 0 &&
    value.displayName.length <= 80 &&
    'rating' in value &&
    typeof value.rating === 'number' &&
    Number.isInteger(value.rating) &&
    value.rating >= 1 &&
    value.rating <= 5 &&
    'comment' in value &&
    typeof value.comment === 'string' &&
    value.comment.length > 0 &&
    value.comment.length <= 500
  );
}

export async function loadReviewSummary(
  endpoint: string,
  signal: AbortSignal,
): Promise<ReviewSummary | null> {
  const response = await fetch(endpoint, {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    signal,
  });
  const data: unknown = response.ok ? await response.json() : null;
  if (
    typeof data !== 'object' ||
    data === null ||
    !('scoreCount' in data) ||
    typeof data.scoreCount !== 'number' ||
    !Number.isSafeInteger(data.scoreCount) ||
    data.scoreCount <= 0 ||
    !('average' in data) ||
    typeof data.average !== 'number' ||
    !Number.isFinite(data.average) ||
    data.average < 1 ||
    data.average > 5 ||
    !('reviews' in data) ||
    !Array.isArray(data.reviews)
  )
    return null;
  return {
    scoreCount: data.scoreCount,
    average: data.average,
    reviews: data.reviews.filter(isPublicReview).slice(0, 6),
  };
}

export function getReviewBrowserId(endpoint: string): string {
  const key = 'ig-follow-review-id:' + endpoint;
  const newId = crypto.randomUUID();
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(existing)) return existing;
    localStorage.setItem(key, newId);
  } catch {
    // The form keeps the same ID in memory for retries if storage is unavailable.
  }
  return newId;
}

export function getReviewEditUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if (
      url.origin === 'https://docs.google.com' &&
      url.pathname.startsWith('/forms/') &&
      url.searchParams.has('edit2')
    ) {
      return url.href;
    }
  } catch {
    return;
  }
}
