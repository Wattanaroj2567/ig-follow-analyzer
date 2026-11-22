const thaiShortMonth = new Intl.DateTimeFormat('th-TH', { month: 'short' });
const thaiMonths = Array.from({ length: 12 }, (_, month) =>
  thaiShortMonth.format(new Date(2000, month, 1)),
);

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatDate(date: Date, locale: string): string {
  let formatter = dateFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    dateFormatterCache.set(locale, formatter);
  }
  return formatter.format(date);
}

export function formatAnalysisTime(iso: string, locale: string, showMilliseconds = false): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: showMilliseconds ? 3 : undefined,
    hour12: false,
  });
}

export function calendarDate(year: number, month: number, day: number): Date | undefined {
  const date = new Date(year, month, day);
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day)
    return date;
}

export function parseSnapshotDate(savedThaiDate: string): Date | undefined {
  // Existing histories store Thai date labels, including the Buddhist Era year.
  const [day, month, year] = savedThaiDate.trim().split(/\s+/);
  const monthIndex = thaiMonths.indexOf(month);
  if (monthIndex < 0 || !/^\d{1,2}$/.test(day) || !/^\d{4}$/.test(year)) return;
  return calendarDate(Number(year) - 543, monthIndex, Number(day));
}

export function formatSnapshotDate(savedThaiDate: string, locale: string): string {
  if (locale === 'th-TH') return savedThaiDate;
  const date = parseSnapshotDate(savedThaiDate);
  return date ? formatDate(date, locale) : savedThaiDate;
}
