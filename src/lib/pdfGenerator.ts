import pdfMakeUrl from 'pdfmake/build/pdfmake.min.js?url';
import type { Content, TDocumentDefinitions, TableCell } from 'pdfmake/interfaces';
import type {
  AnalysisResult,
  FollowCounts,
  HistoryDiff,
  PdfReportOptions,
} from '../types/analyzer';
import { formatDate, formatSnapshotDate } from './dates';
import { getLanguageFormat, type Language, type Translator } from './language';

export const PDF_TABLE_ROWS_PER_PAGE = 20;

export const PDF_REPORT_COLORS = {
  followers: { ink: '#155E75', fill: '#CFFAFE' },
  following: { ink: '#334155', fill: '#E2E8F0' },
  mutual: '#047857',
  notFollowingBack: { ink: '#9A3412', fill: '#FFEDD5' },
  notFollowedBack: { ink: '#1E40AF', fill: '#DBEAFE' },
};

export function getPdfReportLabels(t: Translator) {
  return {
    eyebrow: t(
      'IG Follow Analyzer • รายงานสรุปผลการวิเคราะห์',
      'IG Follow Analyzer • Analysis summary',
    ),
    title: t('รายงานสรุปความสัมพันธ์ผู้ติดตาม Instagram', 'Instagram follower report'),
    source: t('ไฟล์ต้นทาง:', 'Source file:'),
    demo: t('ข้อมูลตัวอย่างสมมติ', 'Sample data'),
    asOf: t('ข้อมูล ณ', 'As of'),
    followers: t('ผู้ติดตามของคุณ', 'Followers'),
    following: t('กำลังติดตาม', 'Following'),
    notFollowingBack: t('ไม่ติดตามคุณกลับ', 'Don’t follow you back'),
    notFollowedBack: t('คุณไม่ได้ติดตามกลับ', 'You don’t follow back'),
    mutual: t('ติดตามกันทั้งสองฝ่าย', 'Mutual follows'),
    chart: t('สัดส่วนความสัมพันธ์ทั้งหมด', 'Relationship breakdown'),
    mutualDetail: t('บัญชีที่ติดตามกันทั้งสองฝ่าย (Mutual)', 'Mutual followers'),
    followBackRate: t('อัตราที่คนที่คุณติดตามกดติดตามกลับ', 'Follow-back rate'),
    netDifference: t('ส่วนต่าง (กำลังติดตาม − ผู้ติดตาม)', 'Difference (following − followers)'),
    notFollowingBackList: t('รายชื่อคนที่ไม่ติดตามคุณกลับ', 'Accounts that don’t follow you back'),
    notFollowedBackList: t('รายชื่อคนที่คุณไม่ได้ติดตามกลับ', 'Accounts you don’t follow back'),
    followersList: t('รายชื่อผู้ติดตามของคุณทั้งหมด', 'All followers'),
    dateYouFollowed: t('คุณเริ่มติดตามเมื่อ', 'Date you followed'),
    dateTheyFollowed: t('เขาเริ่มติดตามเมื่อ', 'Date they followed'),
    empty: t('ไม่มีรายชื่อบัญชีในหมวดนี้', 'No accounts in this category'),
    rank: t('ลำดับ', 'No.'),
    username: t('ชื่อบัญชี (@username)', 'Username'),
    profileLink: t('ลิงก์โปรไฟล์', 'Profile link'),
    page: t('หน้า', 'Page'),
    accounts: t('บัญชี', 'accounts'),
    affiliation: t(
      'เครื่องมืออิสระ ไม่เกี่ยวข้องกับ Instagram หรือ Meta',
      'Independent tool. Unaffiliated with Instagram or Meta.',
    ),
    snapshotNotice: t('ข้อมูลจากไฟล์ส่งออกไม่ใช่แบบ Real-time', 'Data comes from an export snapshot.'),
  };
}

export function getPdfSummaryMetrics(
  counts: FollowCounts,
  copy: ReturnType<typeof getPdfReportLabels>,
) {
  return [
    { label: copy.followers, count: counts.followers, ...PDF_REPORT_COLORS.followers },
    { label: copy.following, count: counts.following, ...PDF_REPORT_COLORS.following },
    {
      label: copy.notFollowingBack,
      count: counts.notFollowingBack,
      ...PDF_REPORT_COLORS.notFollowingBack,
    },
    {
      label: copy.notFollowedBack,
      count: counts.notFollowedBack,
      ...PDF_REPORT_COLORS.notFollowedBack,
    },
  ];
}

export function getRelationshipTotal(counts: FollowCounts): number {
  return counts.mutual + counts.notFollowingBack + counts.notFollowedBack;
}

export function buildPdfDonutArcs(counts: FollowCounts): { color: string; d: string }[] {
  const total = getRelationshipTotal(counts);
  if (total <= 0) return [];
  const cx = 90;
  const cy = 90;
  const r = 64;
  const point = (fraction: number) => {
    const angle = fraction * 2 * Math.PI - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`;
  };
  const arcPath = (start: number, end: number) => {
    const mid = (start + end) / 2;
    return `M ${point(start)} A ${r} ${r} 0 0 1 ${point(mid)} A ${r} ${r} 0 0 1 ${point(end)}`;
  };
  const slices = [
    { value: counts.mutual, color: PDF_REPORT_COLORS.mutual },
    { value: counts.notFollowingBack, color: PDF_REPORT_COLORS.notFollowingBack.ink },
    { value: counts.notFollowedBack, color: PDF_REPORT_COLORS.notFollowedBack.ink },
  ];

  let cursor = 0;
  return slices
    .filter(({ value }) => value > 0)
    .map(({ value, color }) => {
      const start = cursor / total;
      cursor += value;
      return { color, d: arcPath(start, cursor / total) };
    });
}

function buildPdfDonutSvg(counts: FollowCounts): string {
  const paths = buildPdfDonutArcs(counts).map(
    ({ d, color }) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="22" />`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="144" height="144">
    <circle cx="90" cy="90" r="64" fill="none" stroke="#E5E7EB" stroke-width="22" />
    ${paths.join('')}
  </svg>`;
}

interface SarabunFontBundle {
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
}

let cachedFontsBase64: SarabunFontBundle | null = null;

type PdfMake = typeof import('pdfmake/build/pdfmake');
let pdfMakeLoad: Promise<PdfMake> | undefined;

function loadPdfMake(): Promise<PdfMake> {
  // pdfmake ships a standalone browser script that registers window.pdfMake.
  pdfMakeLoad ??= new Promise<PdfMake>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = pdfMakeUrl;
    script.onload = () => {
      script.remove();
      const { pdfMake } = window as Window & { pdfMake?: PdfMake };
      if (pdfMake) resolve(pdfMake);
      else reject(new Error('The PDF engine did not initialize.'));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('The PDF engine could not be loaded.'));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    pdfMakeLoad = undefined;
    throw error;
  });
  return pdfMakeLoad;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadSarabunFontsBase64(): Promise<SarabunFontBundle> {
  if (cachedFontsBase64) return cachedFontsBase64;
  const fontDirectory = `${import.meta.env.BASE_URL}fonts/`;
  const [regRes, boldRes, italicRes, boldItalicRes] = await Promise.all([
    fetch(`${fontDirectory}THSarabunNew-Regular.ttf`),
    fetch(`${fontDirectory}THSarabunNew-Bold.ttf`),
    fetch(`${fontDirectory}THSarabunNew-Italic.ttf`),
    fetch(`${fontDirectory}THSarabunNew-BoldItalic.ttf`),
  ]);
  if (!regRes.ok || !boldRes.ok || !italicRes.ok || !boldItalicRes.ok) {
    throw new Error('ไม่สามารถโหลดไฟล์ฟอนต์ TH Sarabun New สำหรับสร้าง PDF ได้');
  }
  const [regBuf, boldBuf, italicBuf, boldItalicBuf] = await Promise.all([
    regRes.arrayBuffer(),
    boldRes.arrayBuffer(),
    italicRes.arrayBuffer(),
    boldItalicRes.arrayBuffer(),
  ]);
  cachedFontsBase64 = {
    regular: arrayBufferToBase64(regBuf),
    bold: arrayBufferToBase64(boldBuf),
    italic: arrayBufferToBase64(italicBuf),
    boldItalic: arrayBufferToBase64(boldItalicBuf),
  };
  return cachedFontsBase64;
}

export function buildReportFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `IG-Follow-Report-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
}

export function estimatePdfPageCount(
  result: AnalysisResult,
  options: PdfReportOptions,
  diff: HistoryDiff | null,
): { pages: number; listedAccounts: number } {
  const rowsPerPage = PDF_TABLE_ROWS_PER_PAGE;
  let pages = 0;
  let listedAccounts = 0;

  if (options.includeSummary || (options.includeDiffSection && diff)) {
    pages += 1;
  }
  if (options.includeNotFollowingBack) {
    listedAccounts += result.counts.notFollowingBack;
    pages += Math.max(1, Math.ceil(result.counts.notFollowingBack / rowsPerPage));
  }
  if (options.includeNotFollowedBack) {
    listedAccounts += result.counts.notFollowedBack;
    pages += Math.max(1, Math.ceil(result.counts.notFollowedBack / rowsPerPage));
  }
  if (options.includeAllFollowers) {
    listedAccounts += result.counts.followers;
    pages += Math.max(1, Math.ceil(result.counts.followers / rowsPerPage));
  }

  return { pages, listedAccounts };
}

export async function generatePdfBlob(
  result: AnalysisResult,
  options: PdfReportOptions,
  diff: HistoryDiff | null,
  language: Language = 'th',
): Promise<{ blob: Blob; fileName: string }> {
  const { t, locale } = getLanguageFormat(language);
  const copy = getPdfReportLabels(t);
  const [pdfMake, fonts] = await Promise.all([loadPdfMake(), loadSarabunFontsBase64()]);
  const vfs = {
    'THSarabunNew-Regular.ttf': fonts.regular,
    'THSarabunNew-Bold.ttf': fonts.bold,
    'THSarabunNew-Italic.ttf': fonts.italic,
    'THSarabunNew-BoldItalic.ttf': fonts.boldItalic,
  };

  const fontConfig = {
    THSarabunNew: {
      normal: 'THSarabunNew-Regular.ttf',
      bold: 'THSarabunNew-Bold.ttf',
      italics: 'THSarabunNew-Italic.ttf',
      bolditalics: 'THSarabunNew-BoldItalic.ttf',
    },
  };

  const generatedDate = new Date();
  const generatedDateLabel = formatDate(generatedDate, locale);
  const generatedTimeLabel = generatedDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const generatedLabel = t(
    `${generatedDateLabel} เวลา ${generatedTimeLabel} น.`,
    `${generatedDateLabel} at ${generatedTimeLabel}`,
  );
  const snapshotDate = formatSnapshotDate(result.snapshotDateLabel, locale);

  const { counts } = result;
  const totalUnique = getRelationshipTotal(counts) || 1;
  const mutualPct = ((counts.mutual / totalUnique) * 100).toFixed(1);
  const notBackPct = ((counts.notFollowingBack / totalUnique) * 100).toFixed(1);
  const notFollowedPct = ((counts.notFollowedBack / totalUnique) * 100).toFixed(1);
  const followBackRate =
    counts.following > 0 ? ((counts.mutual / counts.following) * 100).toFixed(1) : '0.0';
  const netDiff = counts.following - counts.followers;

  const content: Content[] = [
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, r: 2, color: '#B45309' }],
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        {
          stack: [
            {
              text: copy.eyebrow,
              fontSize: 12,
              bold: true,
              color: '#B45309',
            },
            {
              text: copy.title,
              fontSize: 22,
              bold: true,
              color: '#111827',
              margin: [0, 1, 0, 2],
            },
            {
              text: `${result.ownerHandle ? `${t('บัญชีเจ้าของไฟล์:', 'Account:')} @${result.ownerHandle}  •  ` : ''}${t('สร้างรายงานเมื่อ', 'Generated on')} ${generatedLabel}  •  ${copy.source} ${result.sourceFileName}${result.isDemoData ? ` (${copy.demo})` : ''}`,
              fontSize: 12,
              color: '#4B5563',
            },
          ],
          width: '*',
        },
        {
          text: `${copy.asOf} ${snapshotDate}`,
          fontSize: 12,
          bold: true,
          color: '#111827',
          alignment: 'right',
          width: 125,
          margin: [0, 4, 0, 0],
        },
      ],
      margin: [0, 0, 0, 10],
    },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.75, lineColor: '#E5E7EB' },
      ],
      margin: [0, 0, 0, 14],
    },
  ];

  let hasFrontContent = false;

  if (options.includeSummary) {
    hasFrontContent = true;

    content.push({
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          getPdfSummaryMetrics(counts, copy).map(({ label, count, ink, fill }): TableCell => ({
            stack: [
              { text: label, fontSize: 14, bold: true },
              { text: count.toLocaleString(locale), fontSize: 30, bold: true },
            ],
            color: ink,
            alignment: 'center',
            fillColor: fill,
            margin: [4, 8, 4, 8],
          })),
        ],
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => '#E5E7EB',
        vLineColor: () => '#E5E7EB',
      },
      margin: [0, 0, 0, 14],
    });

    const legend = [
      {
        label: copy.mutual,
        count: counts.mutual,
        percent: mutualPct,
        color: PDF_REPORT_COLORS.mutual,
      },
      {
        label: copy.notFollowingBack,
        count: counts.notFollowingBack,
        percent: notBackPct,
        color: PDF_REPORT_COLORS.notFollowingBack.ink,
      },
      {
        label: copy.notFollowedBack,
        count: counts.notFollowedBack,
        percent: notFollowedPct,
        color: PDF_REPORT_COLORS.notFollowedBack.ink,
      },
    ];

    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  svg: buildPdfDonutSvg(counts),
                  width: 150,
                },
                {
                  stack: [
                    {
                      text: copy.chart,
                      fontSize: 17,
                      bold: true,
                      color: '#111827',
                      margin: [0, 2, 0, 6],
                    },
                    {
                      table: {
                        widths: [6, '*', 'auto'],
                        body: legend.map(({ label, count, percent, color }): TableCell[] => [
                          { canvas: [{ type: 'ellipse', x: 3, y: 9, r1: 3, r2: 3, color }] },
                          { text: label, fontSize: 14, bold: true, color: '#334155' },
                          {
                            text: `${count.toLocaleString(locale)} (${percent}%)`,
                            fontSize: 14,
                            bold: true,
                            color,
                            alignment: 'right',
                          },
                        ]),
                      },
                      layout: {
                        hLineWidth: (i, node) => (i > 0 && i < node.table.body.length ? 0.4 : 0),
                        vLineWidth: () => 0,
                        hLineColor: () => '#E5E7EB',
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                      },
                    },
                  ],
                  width: '*',
                  margin: [8, 4, 0, 0],
                },
              ],
              fillColor: '#F9FAFB',
              margin: [12, 10, 14, 10],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => '#E5E7EB',
        vLineColor: () => '#E5E7EB',
      },
      margin: [0, 0, 0, 14],
    });

    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: copy.mutualDetail, fontSize: 14, color: '#374151' },
            {
              text: `${counts.mutual.toLocaleString(locale)} ${copy.accounts} (${mutualPct}%)`,
              fontSize: 14,
              bold: true,
              color: PDF_REPORT_COLORS.mutual,
              alignment: 'right',
            },
          ],
          [
            { text: copy.followBackRate, fontSize: 14, color: '#374151' },
            {
              text: `${followBackRate}%`,
              fontSize: 14,
              bold: true,
              color: PDF_REPORT_COLORS.notFollowedBack.ink,
              alignment: 'right',
            },
          ],
          [
            { text: copy.netDifference, fontSize: 14, color: '#374151' },
            {
              text: `${netDiff >= 0 ? '+' : ''}${netDiff.toLocaleString(locale)} ${copy.accounts}`,
              fontSize: 14,
              bold: true,
              color: '#111827',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0.75 : 0.5),
        vLineWidth: () => 0,
        hLineColor: () => '#E5E7EB',
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 14],
    });
  }

  if (options.includeDiffSection && diff) {
    hasFrontContent = true;
    const unfollowerPreview =
      diff.recentUnfollowers.length > 0
        ? diff.recentUnfollowers
            .slice(0, 30)
            .map((h) => `@${h}`)
            .join(', ') +
          (diff.recentUnfollowers.length > 30
            ? t(
                ` และอีก ${diff.recentUnfollowers.length - 30} บัญชี`,
                ` and ${diff.recentUnfollowers.length - 30} more`,
              )
            : '')
        : t('ไม่พบบัญชีที่เลิกติดตามเพิ่มจากรอบก่อน', 'No accounts are missing from the latest list.');

    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                {
                  text: `${t('การเปลี่ยนแปลงเทียบกับรอบก่อน', 'Changes since the previous export')} (${formatSnapshotDate(diff.previousDateLabel, locale)})`,
                  fontSize: 14,
                  bold: true,
                  color: '#B45309',
                },
                {
                  text: `${t('ผู้ติดตามเปลี่ยนแปลง', 'Follower change:')} ${diff.followersDelta >= 0 ? '+' : ''}${diff.followersDelta}  •  ${t('หายจากรายชื่อผู้ติดตาม', 'Missing from the follower list:')} ${diff.recentUnfollowers.length} ${copy.accounts}: ${unfollowerPreview}`,
                  fontSize: 13,
                  color: '#374151',
                  margin: [0, 2, 0, 0],
                },
              ],
              fillColor: '#FFFBEB',
              margin: [10, 8, 10, 8],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => '#FDE68A',
        vLineColor: () => '#FDE68A',
      },
      margin: [0, 0, 0, 14],
    });
  }

  let tableSectionNumber = 0;

  const pushAccountTable = (
    title: string,
    dateColumnLabel: string,
    accentHex: string,
    entries: AnalysisResult['notFollowingBack'],
  ) => {
    tableSectionNumber += 1;
    const shouldBreak = hasFrontContent || tableSectionNumber > 1;

    content.push({
      text: `${tableSectionNumber}. ${title} (${entries.length.toLocaleString(locale)} ${copy.accounts})`,
      fontSize: 19,
      bold: true,
      color: accentHex,
      pageBreak: shouldBreak ? 'before' : undefined,
      margin: [0, shouldBreak ? 0 : 4, 0, 6],
    });

    if (entries.length === 0) {
      content.push({
        text: copy.empty,
        fontSize: 13,
        italics: true,
        color: '#6B7280',
        margin: [0, 0, 0, 12],
      });
      return;
    }

    const columnLabels = [copy.rank, copy.username];
    if (options.includeTimestamps) columnLabels.push(dateColumnLabel);
    columnLabels.push(copy.profileLink);
    const headerRow: TableCell[] = columnLabels.map((text) => ({
      text,
      bold: true,
      fontSize: 14,
      fillColor: accentHex,
      color: '#FFFFFF',
    }));

    const bodyRows: TableCell[][] = entries.map((acc, idx) => {
      const dateText = acc.timestamp ? formatDate(new Date(acc.timestamp * 1000), locale) : '—';
      const rowFill = idx % 2 === 1 ? '#F1F5F9' : undefined;
      const row: TableCell[] = [
        { text: String(idx + 1), fontSize: 13, color: '#6B7280', fillColor: rowFill },
        { text: `@${acc.handle}`, fontSize: 13, bold: true, color: '#111827', fillColor: rowFill },
      ];
      if (options.includeTimestamps) {
        row.push({ text: dateText, fontSize: 13, color: '#4B5563', fillColor: rowFill });
      }
      row.push({
        text: `instagram.com/${acc.handle}`,
        fontSize: 13,
        color: '#1D4ED8',
        fillColor: rowFill,
        link: acc.href,
      });
      return row;
    });

    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: options.includeTimestamps ? [38, '*', 95, 165] : [38, '*', 210],
        body: [headerRow, ...bodyRows],
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.75 : 0.4),
        vLineWidth: () => 0,
        hLineColor: (i) => (i === 1 ? '#D1D5DB' : '#E5E7EB'),
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      margin: [0, 0, 0, 12],
    });
  };

  if (options.includeNotFollowingBack) {
    pushAccountTable(
      copy.notFollowingBackList,
      copy.dateYouFollowed,
      PDF_REPORT_COLORS.notFollowingBack.ink,
      result.notFollowingBack,
    );
  }
  if (options.includeNotFollowedBack) {
    pushAccountTable(
      copy.notFollowedBackList,
      copy.dateTheyFollowed,
      PDF_REPORT_COLORS.notFollowedBack.ink,
      result.notFollowedBack,
    );
  }
  if (options.includeAllFollowers) {
    pushAccountTable(
      copy.followersList,
      copy.dateTheyFollowed,
      PDF_REPORT_COLORS.followers.ink,
      result.followers,
    );
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 36, 40, 46],
    defaultStyle: {
      font: 'THSarabunNew',
      fontSize: 14,
      lineHeight: 1.25,
      color: '#111827',
    },
    content,
    footer(currentPage: number, pageCount: number) {
      return {
        columns: [
          {
            text: `© 2026 IG Follow Analyzer  •  ${copy.affiliation}  •  ${copy.snapshotNotice}`,
            fontSize: 11,
            color: '#6B7280',
            width: '*',
          },
          {
            text: `${copy.page} ${currentPage} / ${pageCount}`,
            fontSize: 11,
            bold: true,
            color: '#111827',
            alignment: 'right',
            width: 60,
          },
        ],
        margin: [40, 10, 40, 0],
      };
    },
  };

  pdfMake.addVirtualFileSystem(vfs);
  pdfMake.addFonts(fontConfig);
  const pdfDoc = pdfMake.createPdf(docDefinition);
  const blob = await pdfDoc.getBlob();

  return {
    blob,
    fileName: buildReportFileName(generatedDate),
  };
}

export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
