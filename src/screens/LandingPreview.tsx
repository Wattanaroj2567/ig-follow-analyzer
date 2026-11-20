import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { RelationshipMetrics } from '../components/RelationshipOverview';
import { getRelationshipMetrics, type RelationshipKey } from '../data/relationshipMetrics';
import { formatDate } from '../lib/dates';
import { demoHref } from '../lib/routes';
import type { AnalysisResult } from '../types/analyzer';
import { useLanguage } from '../lib/language';
import './landing-preview.css';

const PREVIEW_SIZE = 4;

interface LandingPreviewProps {
  demo: AnalysisResult;
  onOpen: () => void;
}

export function LandingPreview({ demo, onOpen }: LandingPreviewProps) {
  const { t, locale } = useLanguage();
  const formatAccountDate = (timestamp?: number) =>
    timestamp ? formatDate(new Date(timestamp * 1000), locale) : t('ไม่มีวันที่', 'No date');
  const [selected, setSelected] = useState<RelationshipKey>('notFollowingBack');
  const rows = demo[selected].slice(0, PREVIEW_SIZE);
  const isMutual = selected === 'mutual';
  const isFollowing = selected === 'following' || selected === 'notFollowingBack';

  return (
    <section className="landing-preview" aria-labelledby="landing-preview-title">
      <header className="landing-preview__header">
        <h2 id="landing-preview-title">{t('ตัวอย่างแดชบอร์ด', 'Dashboard preview')}</h2>
        <span>{t('ข้อมูลสมมติ', 'Sample data')}</span>
      </header>

      <RelationshipMetrics
        counts={demo.counts}
        selected={selected}
        onSelect={setSelected}
        showDescriptions={false}
      />

      <h3 id="landing-preview-category" className="landing-preview__category" aria-live="polite">
        {getRelationshipMetrics(t)[selected].label}
      </h3>

      <table className="landing-preview__table" aria-labelledby="landing-preview-category">
        <colgroup>
          <col className="landing-preview__rank" />
          <col className="landing-preview__account" />
          <col />
          {isMutual && <col />}
        </colgroup>
        <thead>
          <tr>
            <th className="landing-preview__rank" scope="col">
              <span aria-hidden="true">#</span>
              <span className="sr-only">{t('ลำดับ', 'Row number')}</span>
            </th>
            <th scope="col">{t('ชื่อบัญชี Instagram', 'Instagram username')}</th>
            <th scope="col">
              {isFollowing
                ? t('คุณติดตามเขาเมื่อ', 'You followed them on')
                : t('เขาติดตามคุณเมื่อ', 'They followed you on')}
            </th>
            {isMutual && <th scope="col">{t('คุณติดตามเขาเมื่อ', 'You followed them on')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((account, index) => (
            <tr key={account.handle}>
              <td className="landing-preview__rank measured">{index + 1}</td>
              <th scope="row">
                <a
                  className="landing-preview__profile"
                  href={account.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>@{account.handle}</span>
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only">
                    {t(
                      ' (เปิดโปรไฟล์ Instagram ในแท็บใหม่)',
                      ' (opens Instagram profile in a new tab)',
                    )}
                  </span>
                </a>
              </th>
              <td className="measured">
                {formatAccountDate(isFollowing ? account.followedByUsAt : account.followedUsAt)}
              </td>
              {isMutual && (
                <td className="measured">{formatAccountDate(account.followedByUsAt)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="landing-preview__footer">
        <span>
          {t(
            `${rows.length} จาก ${demo.counts[selected].toLocaleString(locale)} บัญชี`,
            `${rows.length} of ${demo.counts[selected].toLocaleString(locale)} accounts`,
          )}
        </span>
        <a
          href={demoHref('results')}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpen();
          }}
          className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md px-2 font-semibold text-cool underline underline-offset-3 hover:text-ink"
        >
          {t('เปิดตัวอย่างเต็ม', 'Open full example')}
        </a>
      </footer>
    </section>
  );
}
