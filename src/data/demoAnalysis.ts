import {
  buildSafeProfileHref,
  compareFollowerSnapshots,
  computeFollowRelationshipSets,
} from '../lib/igParser';
import type { AccountEntry, AnalysisResult } from '../types/analyzer';

export const DEMO_MISSING_FOLLOWER = 'demo_account_014';
export const DEMO_PREVIOUS_EXPORT = '19 ต.ค. 2569';
export const DEMO_CURRENT_EXPORT = '19 พ.ย. 2569';
export const DEMO_FOLLOW_TIMESTAMP = Date.UTC(2026, 8, 12, 12) / 1000;

export function buildDemoHistoryDiff(current: AnalysisResult) {
  const previousAt = '2026-10-19T12:00:00Z';
  const removedFollower = {
    handle: DEMO_MISSING_FOLLOWER,
    href: buildSafeProfileHref(DEMO_MISSING_FOLLOWER),
    timestamp: DEMO_FOLLOW_TIMESTAMP,
  };
  const previousFollowers = current.followers.filter(
    (entry) => (entry.timestamp ?? 0) * 1000 <= Date.parse(previousAt),
  );
  previousFollowers.push(removedFollower);
  const { counts } = computeFollowRelationshipSets(previousFollowers, current.following);
  return compareFollowerSnapshots(
    {
      id: 'demo',
      analyzedAtIso: previousAt,
      snapshotDateLabel: DEMO_PREVIOUS_EXPORT,
      counts,
      followerHandles: previousFollowers.map((entry) => entry.handle),
      followerTimestamps: { [DEMO_MISSING_FOLLOWER]: DEMO_FOLLOW_TIMESTAMP },
    },
    current,
  );
}

const NAMED_NOT_FOLLOWING_BACK = [
  'bkk.cafe.hopper',
  'nattapol.photo',
  'studio.minima.th',
  'ploy.dailyvlog',
  'matcha.club.bkk',
  'filmroll_chiangmai',
  'khao.soi.journal',
  'tonkla.designlab',
  'weekend.camping.th',
  'minimal.desk.setup',
  'craft.roastery.bkk',
  'sunday.vinyl.bkk',
];

const NAMED_NOT_FOLLOWED_BACK = [
  'pimchanok.sketch',
  'arisa.bakehouse',
  'siam.vinyl.club',
  'beam.runner.th',
  'fern.ceramic.studio',
  'pat.streetphoto',
];

/**
 * Generates a realistic, mathematically consistent fictitious AnalysisResult
 * using the exact same set-math engine as real Instagram ZIP parsing:
 * Followers = 1,248 | Following = 1,362 | Not following back = 150 | Not followed back = 36 | Mutual = 1,212
 */
export function buildDemoAnalysisResult(): AnalysisResult {
  const baseTs = Math.floor(new Date('2026-11-18T10:00:00Z').getTime() / 1000);

  const makeEntry = (handle: string, idx: number): AccountEntry => ({
    handle,
    href: buildSafeProfileHref(handle),
    timestamp: baseTs - idx * 86400,
  });

  const mutualFollowerEntries: AccountEntry[] = [];
  const mutualFollowingEntries: AccountEntry[] = [];
  for (let i = 1; i <= 1212; i += 1) {
    const handle = `mutual_friend_${String(i).padStart(4, '0')}`;
    const href = buildSafeProfileHref(handle);
    const offsetDays = (i % 5) + 1;
    // Alternate realistic follow order: some followed you first, some you followed first
    const followedUsTs = baseTs - (i + (i % 2 === 0 ? offsetDays : 0)) * 86400;
    const followedByUsTs = baseTs - (i + (i % 2 === 1 ? offsetDays : 0)) * 86400;
    mutualFollowerEntries.push({ handle, href, timestamp: followedUsTs });
    mutualFollowingEntries.push({ handle, href, timestamp: followedByUsTs });
  }

  const notFollowingBackEntries: AccountEntry[] = [];
  for (let i = 0; i < 150; i += 1) {
    const handle =
      i < NAMED_NOT_FOLLOWING_BACK.length
        ? NAMED_NOT_FOLLOWING_BACK[i]
        : `creator_account_${String(i + 1).padStart(3, '0')}`;
    notFollowingBackEntries.push(makeEntry(handle, i + 2));
  }

  const notFollowedBackEntries: AccountEntry[] = [];
  for (let i = 0; i < 36; i += 1) {
    const handle =
      i < NAMED_NOT_FOLLOWED_BACK.length
        ? NAMED_NOT_FOLLOWED_BACK[i]
        : `follower_fan_${String(i + 1).padStart(3, '0')}`;
    notFollowedBackEntries.push(makeEntry(handle, i + 1));
  }

  const sets = computeFollowRelationshipSets(
    [...mutualFollowerEntries, ...notFollowedBackEntries],
    [...mutualFollowingEntries, ...notFollowingBackEntries],
  );

  return {
    sourceFileName: 'instagram-demo-2026-11-19.zip',
    sourceFileSize: 145_408,
    ownerHandle: 'somchai.demo',
    analyzedAtIso: new Date().toISOString(),
    snapshotDateLabel: DEMO_CURRENT_EXPORT,
    isDemoData: true,
    detectedFiles: {
      format: 'json',
      followerFiles: ['connections/followers_and_following/followers_1.json'],
      followingFiles: ['connections/followers_and_following/following.json'],
      totalEntriesScanned: 14,
      skippedNonTargetEntries: 12,
    },
    ...sets,
  };
}
