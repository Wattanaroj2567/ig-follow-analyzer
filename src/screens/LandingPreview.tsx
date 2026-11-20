import { ExternalLink, FileArchive, GitCompareArrows, UserMinus, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RelationshipMetrics } from '../components/RelationshipOverview';
import { getRelationshipMetrics, type RelationshipKey } from '../data/relationshipMetrics';
import { formatDate, formatSnapshotDate } from '../lib/dates';
import { buildHandleSnapshot } from '../lib/historyStore';
import { compareFollowerSnapshots } from '../lib/igParser';
import type { AnalysisResult } from '../types/analyzer';
import { useLanguage } from '../lib/language';
import './landing-preview.css';

const PREVIEW_SIZE = 4;

interface LandingPreviewProps {
  demo: AnalysisResult;
  previousDemo: AnalysisResult;
}

export function LandingPreview({ demo, previousDemo }: LandingPreviewProps) {
  const { t, locale } = useLanguage();
  const formatAccountDate = (timestamp?: number) =>
    timestamp ? formatDate(new Date(timestamp * 1000), locale) : t('ไม่มีวันที่', 'No date');
  const [comparing, setComparing] = useState(false);
  const [selected, setSelected] = useState<RelationshipKey>('notFollowingBack');
  const [selectedChange, setSelectedChange] = useState<'newFollowers' | 'recentUnfollowers'>(
    'newFollowers',
  );
  const comparisonLists = useMemo(() => {
    const diff = compareFollowerSnapshots(buildHandleSnapshot(previousDemo), demo);
    const newHandles = new Set(diff.newFollowers);
    const missingHandles = new Set(diff.recentUnfollowers);
    return {
      newFollowers: demo.followers.filter(({ handle }) => newHandles.has(handle)),
      recentUnfollowers: previousDemo.followers.filter(({ handle }) => missingHandles.has(handle)),
    };
  }, [demo, previousDemo]);
  const changeLabels = {
    newFollowers: t('เริ่มติดตามคุณ', 'New followers'),
    recentUnfollowers: t('หายจากรายชื่อ', 'Missing from the list'),
  };
  const comparisonCategories = [
    { key: 'newFollowers', icon: UserPlus },
    { key: 'recentUnfollowers', icon: UserMinus },
  ] as const;
  const entries = comparing ? comparisonLists[selectedChange] : demo[selected];
  const rows = entries.slice(0, PREVIEW_SIZE);
  const total = entries.length.toLocaleString(locale);
  const isMutual = !comparing && selected === 'mutual';
  const isFollowing = !comparing && (selected === 'following' || selected === 'notFollowingBack');
  const isMissing = comparing && selectedChange === 'recentUnfollowers';
  const previousDate = formatSnapshotDate(previousDemo.snapshotDateLabel, locale);
  const currentDate = formatSnapshotDate(demo.snapshotDateLabel, locale);
  const categoryLabel = comparing
    ? changeLabels[selectedChange]
    : getRelationshipMetrics(t)[selected].label;

  return (
    <section className="landing-preview" aria-labelledby="landing-preview-title">
      <header className="landing-preview__header">
        <h2 id="landing-preview-title">{t('ตัวอย่างแดชบอร์ด', 'Dashboard preview')}</h2>
        <span>{t('ข้อมูลสมมติ', 'Sample data')}</span>
      </header>

      <div
        className="landing-preview__mode"
        role="group"
        aria-label={t('เลือกแบบตัวอย่าง', 'Choose a preview mode')}
      >
        <button type="button" aria-pressed={!comparing} onClick={() => setComparing(false)}>
          <FileArchive aria-hidden="true" />
          {t('ไฟล์เดียว', 'One ZIP')}
        </button>
        <button type="button" aria-pressed={comparing} onClick={() => setComparing(true)}>
          <GitCompareArrows aria-hidden="true" />
          {t('เทียบ 2 ไฟล์', 'Compare two ZIPs')}
        </button>
      </div>
      <p className="landing-preview__context" role="status">
        {comparing
          ? t(
              `เทียบไฟล์ ${previousDate} กับ ${currentDate}`,
              `Comparing ${previousDate} and ${currentDate}`,
            )
          : t(`ภาพรวมจากไฟล์ ${currentDate}`, `Overview from the ${currentDate} export`)}
      </p>

      {comparing ? (
        <div
          className="landing-preview__changes"
          role="group"
          aria-label={t('เลือกความเปลี่ยนแปลง', 'Choose a follower change')}
        >
          {comparisonCategories.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className="relationship-metric"
              data-change={key}
              aria-pressed={selectedChange === key}
              onClick={() => setSelectedChange(key)}
            >
              <span>
                <Icon aria-hidden="true" />
                {changeLabels[key]}
              </span>
              <strong>{comparisonLists[key].length.toLocaleString(locale)}</strong>
            </button>
          ))}
        </div>
      ) : (
        <RelationshipMetrics
          counts={demo.counts}
          selected={selected}
          onSelect={setSelected}
          showDescriptions={false}
        />
      )}

      <h3 id="landing-preview-category" className="landing-preview__category" aria-live="polite">
        {categoryLabel}
        {isMissing && (
          <small>
            {t(
              'มีชื่อในไฟล์ก่อน แต่ไม่พบในไฟล์ล่าสุด',
              'Present in the earlier ZIP, absent from the latest ZIP',
            )}
          </small>
        )}
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
              {isMissing
                ? t('พบในไฟล์รอบก่อน', 'Found in earlier export')
                : isFollowing
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
                {isMissing
                  ? previousDate
                  : formatAccountDate(isFollowing ? account.followedByUsAt : account.followedUsAt)}
              </td>
              {isMutual && (
                <td className="measured">{formatAccountDate(account.followedByUsAt)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="landing-preview__footer">
        <span>{t(`${rows.length} จาก ${total} บัญชี`, `${rows.length} of ${total} accounts`)}</span>
      </footer>
    </section>
  );
}
