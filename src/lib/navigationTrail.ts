import type { PageId } from '../components/AppShell';
import type { Translator } from './language';
import { demoHref, pageHref } from './routes';

export interface TrailEntry {
  page: PageId;
  href: string;
  demo: boolean;
}

export type NavigationMode = 'contextual' | 'top-nav' | 'history-record';

export const PAGE_IDS: PageId[] = [
  'landing',
  'how-it-works',
  'export-comparison',
  'upload',
  'results',
  'pdf',
  'history',
  'terms',
  'about',
];

export const LANDING_ENTRY: TrailEntry = {
  page: 'landing',
  href: pageHref('landing'),
  demo: false,
};

function isPageId(value: unknown): value is PageId {
  return typeof value === 'string' && PAGE_IDS.includes(value as PageId);
}

export function isValidTrail(value: unknown): value is TrailEntry[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      isPageId((item as Record<string, unknown>).page) &&
      typeof (item as Record<string, unknown>).href === 'string' &&
      typeof (item as Record<string, unknown>).demo === 'boolean',
  );
}

export function canonicalTrailForPage(
  page: PageId,
  href: string,
  demo: boolean,
  resultsHref?: string,
): TrailEntry[] {
  if (page === 'landing') return [LANDING_ENTRY];

  const current: TrailEntry = { page, href, demo };
  if (page === 'pdf') {
    const parentHref = resultsHref ?? (demo ? demoHref('results') : pageHref('results'));
    return [LANDING_ENTRY, { page: 'results', href: parentHref, demo }, current];
  }
  if (page === 'history' && demo) {
    return [LANDING_ENTRY, { page: 'results', href: demoHref('results'), demo: true }, current];
  }
  return [LANDING_ENTRY, current];
}

export function advanceTrail(
  current: TrailEntry[],
  next: TrailEntry,
  mode: NavigationMode = 'contextual',
): TrailEntry[] {
  if (next.page === 'landing') return [LANDING_ENTRY];

  if (mode === 'top-nav') {
    return [LANDING_ENTRY, next];
  }

  const base = current.length > 0 && current[0].page === 'landing' ? current : [LANDING_ENTRY];
  const last = base.at(-1);

  if (last && last.href === next.href && last.page === next.page && last.demo === next.demo) {
    return base;
  }

  if (last && last.page === next.page) {
    return [...base.slice(0, -1), next];
  }

  if (mode === 'history-record') {
    const historyIndex = base.findIndex((entry) => entry.page === 'history');
    if (historyIndex !== -1) {
      const hasEarlierResults = base
        .slice(0, historyIndex)
        .some((entry) => entry.page === 'results');
      if (hasEarlierResults) {
        return [LANDING_ENTRY, base[historyIndex], next];
      }
      return [...base.slice(0, historyIndex + 1), next];
    }
    return [LANDING_ENTRY, { page: 'history', href: pageHref('history'), demo: next.demo }, next];
  }

  const deduped = base.filter((entry) => entry.page !== next.page);
  return [...deduped, next];
}

export function sliceTrailToIndex(current: TrailEntry[], index: number): TrailEntry[] {
  if (index <= 0 || current.length === 0) return [LANDING_ENTRY];
  return current.slice(0, Math.min(index + 1, current.length));
}

export function getCrumbLabel(entry: TrailEntry, t: Translator): string {
  switch (entry.page) {
    case 'landing':
      return t('หน้าแรก', 'Home');
    case 'how-it-works':
      return t('วิธีขอไฟล์', 'Export guide');
    case 'export-comparison':
      return t('ทำไมต้องใช้ไฟล์ ZIP', 'Why use a ZIP');
    case 'upload':
      return t('วิเคราะห์ไฟล์', 'Analyze ZIP');
    case 'results':
      return entry.demo ? t('ผลวิเคราะห์ตัวอย่าง', 'Sample results') : t('ผลวิเคราะห์', 'Results');
    case 'pdf':
      return entry.demo
        ? t('รายงาน PDF ตัวอย่าง', 'Sample PDF report')
        : t('รายงาน PDF', 'PDF report');
    case 'history':
      return entry.demo ? t('ประวัติตัวอย่าง', 'Sample history') : t('ประวัติบนเครื่อง', 'History');
    case 'terms':
      return t('เงื่อนไขและความเป็นส่วนตัว', 'Terms and privacy');
    case 'about':
      return t('เกี่ยวกับเรา', 'About');
  }
}

export function getBackLabel(entry: TrailEntry, t: Translator): string {
  switch (entry.page) {
    case 'landing':
      return t('กลับหน้าแรก', 'Back to home');
    case 'how-it-works':
      return t('กลับไปหน้าวิธีขอไฟล์', 'Back to export guide');
    case 'export-comparison':
      return t('กลับไปหน้าทำไมต้องใช้ไฟล์ ZIP', 'Back to why use a ZIP');
    case 'upload':
      return t('กลับไปหน้าวิเคราะห์ไฟล์', 'Back to Analyze ZIP');
    case 'results':
      return entry.demo
        ? t('กลับไปหน้าผลตัวอย่าง', 'Back to sample results')
        : t('กลับไปหน้าผลวิเคราะห์', 'Back to results');
    case 'pdf':
      return entry.demo
        ? t('กลับไปหน้ารายงาน PDF ตัวอย่าง', 'Back to sample PDF report')
        : t('กลับไปหน้ารายงาน PDF', 'Back to PDF report');
    case 'history':
      return entry.demo
        ? t('กลับไปหน้าประวัติตัวอย่าง', 'Back to sample history')
        : t('กลับไปหน้าประวัติบนเครื่อง', 'Back to history');
    case 'terms':
      return t('กลับไปหน้าเงื่อนไขและความเป็นส่วนตัว', 'Back to Terms and privacy');
    case 'about':
      return t('กลับไปหน้าเกี่ยวกับเรา', 'Back to About');
  }
}
