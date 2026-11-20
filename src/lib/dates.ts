const thaiShortMonth = new Intl.DateTimeFormat('th-TH', { month: 'short' });
const thaiMonths = Array.from({ length: 12 }, (_, month) =>
  thaiShortMonth.format(new Date(2000, month, 1)),
);

export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatSnapshotDate(savedThaiDate: string, locale: string): string {
  if (locale === 'th-TH') return savedThaiDate;

  // Existing histories store Thai date labels, including the Buddhist Era year.
  const [day, month, year] = savedThaiDate.trim().split(/\s+/);
  const monthIndex = thaiMonths.indexOf(month);
  if (monthIndex < 0 || !/^\d{1,2}$/.test(day) || !/^\d{4}$/.test(year)) return savedThaiDate;
  return formatDate(new Date(Number(year) - 543, monthIndex, Number(day)), locale);
}
