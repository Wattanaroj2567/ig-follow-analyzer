import pdfMakeUrl from 'pdfmake/build/pdfmake.min.js?url';
import type { Content, TDocumentDefinitions, TableCell } from 'pdfmake/interfaces';
import {
  formatRelationshipPercentage,
  getFollowBackSummary,
  getRelationshipTotal,
} from '../data/relationshipMetrics';
import type {
  AnalysisResult,
  FollowCounts,
  HistoryDiff,
  PdfReportOptions,
} from '../types/analyzer';
import { getFollowerComparisonRisk } from './comparison';
import { formatDate, formatSnapshotDate } from './dates';
import { buildSafeProfileHref } from './igParser';
import { getLanguageFormat, type Language, type Translator } from './language';

export const PDF_TABLE_ROWS_PER_PAGE = 30;

function getPdfReportPalette(color = (token: string) => `var(--color-${token})`) {
  return {
    paper: color('paper-2'),
    surface: color('paper-3'),
    ink: color('ink'),
    inkSecondary: color('ink-2'),
    muted: color('muted'),
    rule: color('rule'),
    ruleStrong: color('rule-2'),
    accent: color('accent'),
    accentSoft: color('accent-soft'),
    cool: color('cool'),
    coolSoft: color('cool-soft'),
    ok: color('ok'),
  };
}

export const PDF_PREVIEW_PALETTE = getPdfReportPalette();

function readPdfReportPalette() {
  const styles = getComputedStyle(document.documentElement);
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
  if (!context) throw new Error('The PDF color palette could not be resolved.');

  return getPdfReportPalette((token) => {
    // CSS uses OKLCH. pdfmake and its SVG renderer expect sRGB colors.
    context.fillStyle = styles.getPropertyValue(`--color-${token}`).trim();
    context.fillRect(0, 0, 1, 1);
    const rgb = context.getImageData(0, 0, 1, 1).data.subarray(0, 3);
    return `#${Array.from(rgb, (channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  });
}

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
    account: t('บัญชี', 'account'),
    accounts: t('บัญชี', 'accounts'),
    affiliation: t(
      'เครื่องมืออิสระ ไม่เกี่ยวข้องกับ Instagram หรือ Meta',
      'Independent tool. Unaffiliated with Instagram or Meta.',
    ),
    snapshotNotice: t('ข้อมูล ณ วันที่ส่งออกไฟล์', 'Data as of the export date.'),
    comparisonTitle: t('ความเปลี่ยนแปลงระหว่างสองไฟล์', 'Changes between exports'),
    comparedWith: t('เทียบกับ', 'Compared with'),
    newFollowers: t('ติดตามใหม่', 'New followers'),
    missingFollowers: t('หายจากรายชื่อผู้ติดตาม', 'Missing from the follower list'),
    comparisonCaution: t(
      'รายชื่อเปลี่ยนผิดสังเกต ตรวจว่า ZIP ทั้งสองใช้ช่วงตลอดเวลาก่อนสรุปผล',
      'Unusually large list change. Check that both ZIPs used the All time date range before interpreting the results.',
    ),
    comparisonDateRange: t(
      'ตรวจว่า ZIP ทั้งสองใช้ช่วงตลอดเวลา ช่วงวันที่จำกัดอาจทำให้บางบัญชีไม่อยู่ในไฟล์',
      'Check that both ZIPs used All time. A limited date range may leave accounts out.',
    ),
  };
}

export function getPdfComparisonSummary(
  result: Pick<AnalysisResult, 'counts' | 'isDemoData'>,
  diff: HistoryDiff,
  copy: ReturnType<typeof getPdfReportLabels>,
  locale: string,
) {
  const file = [diff.previousSourceFileName, formatSnapshotDate(diff.previousDateLabel, locale)]
    .filter(Boolean)
    .join(' · ');
  const formatHandles = (handles: string[]) => {
    const preview = handles
      .slice(0, 30)
      .map((handle) => `@${handle}`)
      .join(', ');
    const extraCount = handles.length - 30;
    return extraCount > 0
      ? `${preview} · +${extraCount.toLocaleString(locale)} ${copy.accounts}`
      : preview;
  };
  const formatCount = (count: number) =>
    `${count.toLocaleString(locale)} ${count === 1 ? copy.account : copy.accounts}`;
  return {
    reference: `${copy.comparedWith} ${file}`,
    counts: `${copy.newFollowers} ${formatCount(diff.newFollowers.length)} · ${copy.missingFollowers} ${formatCount(diff.recentUnfollowers.length)}`,
    caution: result.isDemoData
      ? null
      : getFollowerComparisonRisk(result.counts.followers, diff)
        ? copy.comparisonCaution
        : copy.comparisonDateRange,
    newFollowersPreview: formatHandles(diff.newFollowers),
    missingFollowersPreview: formatHandles(diff.recentUnfollowers),
  };
}

export function getPdfSummaryMetrics(
  counts: FollowCounts,
  copy: ReturnType<typeof getPdfReportLabels>,
  palette = PDF_PREVIEW_PALETTE,
) {
  return [
    { label: copy.followers, count: counts.followers, ink: palette.ink, fill: palette.surface },
    { label: copy.following, count: counts.following, ink: palette.ink, fill: palette.surface },
    {
      label: copy.notFollowingBack,
      count: counts.notFollowingBack,
      ink: palette.accent,
      fill: palette.accentSoft,
    },
    {
      label: copy.notFollowedBack,
      count: counts.notFollowedBack,
      ink: palette.cool,
      fill: palette.coolSoft,
    },
  ];
}

export function buildPdfDonutArcs(
  counts: FollowCounts,
  palette = PDF_PREVIEW_PALETTE,
): { color: string; d: string }[] {
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
    { value: counts.mutual, color: palette.ok },
    { value: counts.notFollowingBack, color: palette.accent },
    { value: counts.notFollowedBack, color: palette.cool },
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

function buildPdfDonutSvg(counts: FollowCounts, palette: typeof PDF_PREVIEW_PALETTE): string {
  const paths = buildPdfDonutArcs(counts, palette).map(
    ({ d, color }) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="22" />`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="144" height="144">
    <circle cx="90" cy="90" r="64" fill="none" stroke="${palette.rule}" stroke-width="22" />
    ${paths.join('')}
  </svg>`;
}

const reportFonts = {
  PlusJakartaSans: { normal: 'PlusJakartaSans-Regular.ttf', bold: 'PlusJakartaSans-Bold.ttf' },
  IBMPlexSansThai: { normal: 'IBMPlexSansThai-Regular.ttf', bold: 'IBMPlexSansThai-Bold.ttf' },
};

let reportFontLoad: Promise<Record<string, string>> | undefined;

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

function loadReportFonts() {
  const files = Object.values(reportFonts).flatMap(({ normal, bold }) => [normal, bold]);
  reportFontLoad ??= Promise.all(
    files.map(async (file) => {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`);
      if (!response.ok) throw new Error(`The PDF font ${file} could not be loaded.`);
      return [file, arrayBufferToBase64(await response.arrayBuffer())] as const;
    }),
  )
    .then((entries) => Object.fromEntries(entries))
    .catch((error: unknown) => {
      reportFontLoad = undefined;
      throw error;
    });
  return reportFontLoad;
}

export function loadPdfAssets() {
  return Promise.all([loadPdfMake(), loadReportFonts()]);
}

function reportText(value: string) {
  if (!/[\u0E00-\u0E7F]/u.test(value)) return value;

  // Keep Thai punctuation and combining marks with their surrounding text.
  return value
    .split(/([\u0E00-\u0E7F]+(?: +[\u0E00-\u0E7F]+)*)/u)
    .filter(Boolean)
    .map((text) => ({
      text,
      font: /^[\u0E00-\u0E7F]/u.test(text) ? 'IBMPlexSansThai' : 'PlusJakartaSans',
    }));
}

export function buildReportFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `IG-Follow-Report-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
}

export async function generatePdfBlob(
  result: AnalysisResult,
  options: PdfReportOptions,
  diff: HistoryDiff | null,
  language: Language = 'th',
): Promise<{ blob: Blob; fileName: string }> {
  const { t, locale } = getLanguageFormat(language);
  const copy = getPdfReportLabels(t);
  const palette = readPdfReportPalette();
  const [pdfMake, vfs] = await loadPdfAssets();

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
  const totalUnique = getRelationshipTotal(counts);
  const mutualPct = formatRelationshipPercentage(counts.mutual, totalUnique);
  const notBackPct = formatRelationshipPercentage(counts.notFollowingBack, totalUnique);
  const notFollowedPct = formatRelationshipPercentage(counts.notFollowedBack, totalUnique);
  const followBack = getFollowBackSummary(counts, t, locale);

  const content: Content[] = [
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, r: 2, color: palette.accent }],
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        {
          stack: [
            {
              text: reportText(copy.eyebrow),
              fontSize: 10,
              bold: true,
              color: palette.accent,
            },
            {
              text: reportText(copy.title),
              fontSize: 18,
              bold: true,
              color: palette.ink,
              margin: [0, 1, 0, 2],
            },
            {
              text: reportText(
                `${result.ownerHandle ? `${t('บัญชีเจ้าของไฟล์:', 'Account:')} @${result.ownerHandle}  •  ` : ''}${t('สร้างรายงานเมื่อ', 'Generated on')} ${generatedLabel}  •  ${copy.source} ${result.sourceFileName}${result.isDemoData ? ` (${copy.demo})` : ''}`,
              ),
              fontSize: 10,
              color: palette.inkSecondary,
            },
          ],
          width: '*',
        },
        {
          text: reportText(`${copy.asOf} ${snapshotDate}`),
          fontSize: 10,
          bold: true,
          color: palette.ink,
          alignment: 'right',
          width: 125,
          margin: [0, 4, 0, 0],
        },
      ],
      margin: [0, 0, 0, 10],
    },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.75, lineColor: palette.rule },
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
          getPdfSummaryMetrics(counts, copy, palette).map(
            ({ label, count, ink, fill }): TableCell => ({
              stack: [
                { text: reportText(label), fontSize: 11, bold: true },
                { text: count.toLocaleString(locale), fontSize: 23, bold: true },
              ],
              color: ink,
              alignment: 'center',
              fillColor: fill,
              margin: [4, 8, 4, 8],
            }),
          ),
        ],
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => palette.rule,
        vLineColor: () => palette.rule,
      },
      margin: [0, 0, 0, 14],
    });

    const legend = [
      {
        label: copy.mutual,
        count: counts.mutual,
        percent: mutualPct,
        color: palette.ok,
      },
      {
        label: copy.notFollowingBack,
        count: counts.notFollowingBack,
        percent: notBackPct,
        color: palette.accent,
      },
      {
        label: copy.notFollowedBack,
        count: counts.notFollowedBack,
        percent: notFollowedPct,
        color: palette.cool,
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
                  svg: buildPdfDonutSvg(counts, palette),
                  width: 150,
                },
                {
                  stack: [
                    {
                      text: reportText(copy.chart),
                      fontSize: 14,
                      bold: true,
                      color: palette.ink,
                      margin: [0, 2, 0, 6],
                    },
                    {
                      table: {
                        widths: [6, '*', 'auto'],
                        body: legend.map(({ label, count, percent, color }): TableCell[] => [
                          { canvas: [{ type: 'ellipse', x: 3, y: 9, r1: 3, r2: 3, color }] },
                          {
                            text: reportText(label),
                            fontSize: 11,
                            bold: true,
                            color: palette.inkSecondary,
                          },
                          {
                            text: reportText(`${count.toLocaleString(locale)} (${percent}%)`),
                            fontSize: 11,
                            bold: true,
                            color,
                            alignment: 'right',
                          },
                        ]),
                      },
                      layout: {
                        hLineWidth: (i, node) => (i > 0 && i < node.table.body.length ? 0.4 : 0),
                        vLineWidth: () => 0,
                        hLineColor: () => palette.rule,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                      },
                    },
                  ],
                  width: '*',
                  margin: [8, 4, 0, 0],
                },
              ],
              fillColor: palette.surface,
              margin: [12, 10, 14, 10],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => palette.rule,
        vLineColor: () => palette.rule,
      },
      margin: [0, 0, 0, 14],
    });

    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: reportText(copy.mutualDetail), fontSize: 11, color: palette.inkSecondary },
            {
              text: reportText(
                `${counts.mutual.toLocaleString(locale)} ${copy.accounts} (${mutualPct}%)`,
              ),
              fontSize: 11,
              bold: true,
              color: palette.ok,
              alignment: 'right',
            },
          ],
          [
            { text: reportText(followBack.label), fontSize: 11, color: palette.inkSecondary },
            {
              text: reportText(followBack.value),
              fontSize: 11,
              bold: true,
              color: palette.cool,
              alignment: 'right',
            },
          ],
        ],
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0.75 : 0.5),
        vLineWidth: () => 0,
        hLineColor: () => palette.rule,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 14],
    });
  }

  if (options.includeDiffSection && diff) {
    hasFrontContent = true;
    const summary = getPdfComparisonSummary(result, diff, copy, locale);
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                {
                  text: reportText(copy.comparisonTitle),
                  fontSize: 11,
                  bold: true,
                  color: palette.accent,
                },
                {
                  text: reportText(summary.reference),
                  fontSize: 10,
                  color: palette.inkSecondary,
                },
                {
                  text: reportText(summary.counts),
                  fontSize: 10.5,
                  color: palette.inkSecondary,
                  margin: [0, 2, 0, 0],
                },
                ...(summary.caution
                  ? [
                      {
                        text: reportText(summary.caution),
                        fontSize: 9,
                        bold: true,
                        color: palette.ink,
                        margin: [0, 4, 0, 0] as [number, number, number, number],
                      },
                    ]
                  : []),
              ],
              fillColor: palette.accentSoft,
              margin: [10, 8, 10, 8],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => palette.rule,
        vLineColor: () => palette.rule,
      },
      margin: [0, 0, 0, 14],
    });
  }

  let tableSectionNumber = 0;

  const pushAccountTable = (
    title: string,
    dateColumnLabel: string,
    accentHex: string,
    headerFill: string,
    entries: AnalysisResult['notFollowingBack'],
  ) => {
    tableSectionNumber += 1;
    const pushTitle = (start: number) => {
      const shouldBreak = hasFrontContent || tableSectionNumber > 1 || start > 0;
      const continued = start > 0 ? t(' — ต่อ', ' — continued') : '';
      content.push({
        text: reportText(
          `${tableSectionNumber}. ${title} (${entries.length.toLocaleString(locale)} ${entries.length === 1 ? copy.account : copy.accounts})${continued}`,
        ),
        fontSize: 15,
        bold: true,
        color: accentHex,
        pageBreak: shouldBreak ? 'before' : undefined,
        margin: [0, shouldBreak ? 0 : 4, 0, 6],
      });
    };

    if (entries.length === 0) {
      pushTitle(0);
      content.push({
        text: reportText(copy.empty),
        fontSize: 10.5,
        color: palette.muted,
        margin: [0, 0, 0, 12],
      });
      return;
    }

    const columnLabels = [copy.rank, copy.username];
    if (options.includeTimestamps) columnLabels.push(dateColumnLabel);
    columnLabels.push(copy.profileLink);
    const makeHeader = (): TableCell[] =>
      columnLabels.map((text, colIndex) => ({
        text: reportText(text),
        bold: true,
        fontSize: 11,
        fillColor: headerFill,
        color: accentHex,
        ...(colIndex === 0 ? { alignment: 'center' as const, noWrap: true } : {}),
      }));

    const makeRow = (acc: AnalysisResult['followers'][number], index: number): TableCell[] => {
      const dateText = acc.timestamp ? formatDate(new Date(acc.timestamp * 1000), locale) : '—';
      const rowFill = index % 2 === 1 ? palette.surface : undefined;
      const row: TableCell[] = [
        {
          text: String(index + 1),
          fontSize: 9.5,
          color: palette.muted,
          fillColor: rowFill,
          alignment: 'center',
          noWrap: true,
        },
        {
          text: `@${acc.handle}`,
          fontSize: 9.5,
          bold: true,
          color: palette.ink,
          fillColor: rowFill,
        },
      ];
      if (options.includeTimestamps) {
        row.push({
          text: reportText(dateText),
          fontSize: 9.5,
          color: palette.inkSecondary,
          fillColor: rowFill,
        });
      }
      row.push({
        text: `instagram.com/${acc.handle}`,
        fontSize: 9.5,
        color: palette.cool,
        fillColor: rowFill,
        link: acc.href,
        decoration: 'underline',
      });
      return row;
    };

    for (let start = 0; start < entries.length; start += PDF_TABLE_ROWS_PER_PAGE) {
      pushTitle(start);
      const rows = entries.slice(start, start + PDF_TABLE_ROWS_PER_PAGE);
      content.push({
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: options.includeTimestamps ? [40, '*', 85, 195] : [40, '*', 220],
          body: [makeHeader(), ...rows.map((account, index) => makeRow(account, start + index))],
        },
        layout: {
          hLineWidth: (i, node) =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.75 : 0.4,
          vLineWidth: () => 0.75,
          vLineColor: () => palette.ruleStrong,
          hLineColor: (i, node) =>
            i === 0 || i === 1 || i === node.table.body.length ? palette.ruleStrong : palette.rule,
          paddingTop: () => 4.2,
          paddingBottom: () => 4.2,
        },
        margin: [0, 0, 0, 12],
      });
    }
  };

  if (options.includeDiffSection && diff) {
    const newFollowerHandles = new Set(diff.newFollowers);
    const newFollowerEntries = result.followers.filter((entry) =>
      newFollowerHandles.has(entry.handle),
    );
    const missingFollowerEntries = diff.recentUnfollowers.map((handle) => ({
      handle,
      href: buildSafeProfileHref(handle),
      timestamp: diff.unfollowerTimestamps.get(handle),
    }));
    pushAccountTable(
      copy.newFollowers,
      copy.dateTheyFollowed,
      palette.ok,
      palette.surface,
      newFollowerEntries,
    );
    pushAccountTable(
      copy.missingFollowers,
      copy.dateTheyFollowed,
      palette.accent,
      palette.accentSoft,
      missingFollowerEntries,
    );
  }

  if (options.includeNotFollowingBack) {
    pushAccountTable(
      copy.notFollowingBackList,
      copy.dateYouFollowed,
      palette.accent,
      palette.accentSoft,
      result.notFollowingBack,
    );
  }
  if (options.includeNotFollowedBack) {
    pushAccountTable(
      copy.notFollowedBackList,
      copy.dateTheyFollowed,
      palette.cool,
      palette.coolSoft,
      result.notFollowedBack,
    );
  }
  if (options.includeAllFollowers) {
    pushAccountTable(
      copy.followersList,
      copy.dateTheyFollowed,
      palette.ink,
      palette.surface,
      result.followers,
    );
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 36, 40, 46],
    background: (_page, size) => ({
      canvas: [{ type: 'rect', x: 0, y: 0, w: size.width, h: size.height, color: palette.paper }],
    }),
    defaultStyle: {
      font: 'PlusJakartaSans',
      fontSize: 11,
      lineHeight: 1.15,
      color: palette.ink,
    },
    content,
    footer(currentPage: number, pageCount: number) {
      return {
        columns: [
          {
            text: reportText(
              `© 2026 IG Follow Analyzer  •  ${copy.affiliation}  •  ${copy.snapshotNotice}`,
            ),
            fontSize: 9,
            color: palette.muted,
            width: '*',
          },
          {
            text: reportText(`${copy.page} ${currentPage} / ${pageCount}`),
            fontSize: 9,
            bold: true,
            color: palette.ink,
            alignment: 'right',
            width: 60,
          },
        ],
        margin: [40, 10, 40, 0],
      };
    },
  };

  pdfMake.addVirtualFileSystem(vfs);
  pdfMake.addFonts(reportFonts);
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
