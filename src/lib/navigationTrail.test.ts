import { describe, expect, it } from 'vitest';
import {
  advanceTrail,
  canonicalTrailForPage,
  isValidTrail,
  LANDING_ENTRY,
  sliceTrailToIndex,
  type TrailEntry,
} from './navigationTrail';

const entry = (page: TrailEntry['page'], href: string, demo = false): TrailEntry => ({
  page,
  href,
  demo,
});

describe('navigationTrail', () => {
  it('builds canonical trails for direct URL entries', () => {
    expect(canonicalTrailForPage('landing', '#/', false)).toEqual([LANDING_ENTRY]);
    expect(canonicalTrailForPage('history', '#/history', false)).toEqual([
      LANDING_ENTRY,
      entry('history', '#/history'),
    ]);
    expect(canonicalTrailForPage('pdf', '#/pdf?demo', true, '#/results?demo')).toEqual([
      LANDING_ENTRY,
      entry('results', '#/results?demo', true),
      entry('pdf', '#/pdf?demo', true),
    ]);
    expect(canonicalTrailForPage('history', '#/history?demo', true)).toEqual([
      LANDING_ENTRY,
      entry('results', '#/results?demo', true),
      entry('history', '#/history?demo', true),
    ]);
  });

  it('tracks Upload -> Results -> History -> Back without creating loops', () => {
    const t1 = advanceTrail([LANDING_ENTRY], entry('upload', '#/upload'));
    const t2 = advanceTrail(t1, entry('results', '#/results'));
    const t3 = advanceTrail(t2, entry('history', '#/history'));
    expect(t3.map((item) => item.page)).toEqual(['landing', 'upload', 'results', 'history']);

    const backToResults = sliceTrailToIndex(t3, 2);
    expect(backToResults.map((item) => item.page)).toEqual(['landing', 'upload', 'results']);

    const backToUpload = sliceTrailToIndex(backToResults, 1);
    expect(backToUpload.map((item) => item.page)).toEqual(['landing', 'upload']);

    const backToHome = sliceTrailToIndex(backToUpload, 0);
    expect(backToHome.map((item) => item.page)).toEqual(['landing']);
  });

  it('moves Results -> Upload cleanly so Back returns to Results without looping', () => {
    const onResults = [LANDING_ENTRY, entry('upload', '#/upload'), entry('results', '#/results')];
    const toUpload = advanceTrail(onResults, entry('upload', '#/upload'));
    expect(toUpload.map((item) => item.page)).toEqual(['landing', 'results', 'upload']);

    const backToResults = sliceTrailToIndex(toUpload, 1);
    expect(backToResults.map((item) => item.page)).toEqual(['landing', 'results']);
  });

  it('keeps History as the direct parent when opening a saved record from History', () => {
    const cameFromResults = [
      LANDING_ENTRY,
      entry('upload', '#/upload'),
      entry('results', '#/results'),
      entry('history', '#/history'),
    ];
    const openedFromHistory = advanceTrail(
      cameFromResults,
      entry('results', '#/results'),
      'history-record',
    );
    expect(openedFromHistory.map((item) => item.page)).toEqual(['landing', 'history', 'results']);

    const cameFromAbout = [LANDING_ENTRY, entry('about', '#/about'), entry('history', '#/history')];
    const openedAfterAbout = advanceTrail(
      cameFromAbout,
      entry('results', '#/results'),
      'history-record',
    );
    expect(openedAfterAbout.map((item) => item.page)).toEqual([
      'landing',
      'about',
      'history',
      'results',
    ]);
  });

  it('resets the trail cleanly on top-nav switches and Home navigation', () => {
    const deep = [
      LANDING_ENTRY,
      entry('upload', '#/upload'),
      entry('results', '#/results'),
      entry('history', '#/history'),
    ];
    expect(advanceTrail(deep, entry('about', '#/about'), 'top-nav').map((i) => i.page)).toEqual([
      'landing',
      'about',
    ]);
    expect(advanceTrail(deep, LANDING_ENTRY, 'contextual').map((i) => i.page)).toEqual(['landing']);
  });

  it('replaces query variants of the same page instead of duplicating it', () => {
    const onTerms = [LANDING_ENTRY, entry('about', '#/about'), entry('terms', '#/terms')];
    const toTopic = advanceTrail(onTerms, entry('terms', '#/terms?section=feedback-data'));
    expect(toTopic).toEqual([
      LANDING_ENTRY,
      entry('about', '#/about'),
      entry('terms', '#/terms?section=feedback-data'),
    ]);
  });

  it('validates serialized history state safely', () => {
    expect(isValidTrail([LANDING_ENTRY])).toBe(true);
    expect(isValidTrail([])).toBe(false);
    expect(isValidTrail(null)).toBe(false);
    expect(isValidTrail([{ page: 'invalid', href: '#/', demo: false }])).toBe(false);
  });
});
