import { type Translator } from '../lib/language';
import type { FollowCounts } from '../types/analyzer';

export type RelationshipKey = keyof FollowCounts;

export const RELATIONSHIP_SEGMENTS = ['mutual', 'notFollowingBack', 'notFollowedBack'] as const;

export function getRelationshipTotal(counts: FollowCounts): number {
  return counts.mutual + counts.notFollowingBack + counts.notFollowedBack;
}

export function formatRelationshipPercentage(count: number, total: number): string {
  return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
}

export function getFollowBackSummary(counts: FollowCounts, t: Translator, locale: string) {
  const mutual = counts.mutual.toLocaleString(locale);
  const following = counts.following.toLocaleString(locale);
  const percentage = formatRelationshipPercentage(counts.mutual, counts.following);

  return {
    label: t('คนที่คุณติดตามและติดตามคุณกลับ', 'People you follow who follow you back'),
    value: t(
      `${mutual} จาก ${following} บัญชี (${percentage}%)`,
      `${mutual} of ${following} (${percentage}%)`,
    ),
  };
}

export const getRelationshipMetrics = (t: Translator) =>
  ({
    followers: {
      label: t('ผู้ติดตามของคุณ', 'Followers'),
      description: t('บัญชีที่ติดตามคุณ', 'Accounts that follow you'),
    },
    following: {
      label: t('คุณกำลังติดตาม', 'Following'),
      description: t('บัญชีที่คุณติดตาม', 'Accounts you follow'),
    },
    notFollowingBack: {
      label: t('ไม่ติดตามคุณกลับ', 'Not following you back'),
      description: t('คุณติดตามเขาฝ่ายเดียว', 'Only you follow them'),
    },
    notFollowedBack: {
      label: t('คุณยังไม่ได้ติดตามกลับ', 'You don’t follow back'),
      description: t('เขาติดตามคุณฝ่ายเดียว', 'Only they follow you'),
    },
    mutual: {
      label: t('ติดตามกันทั้งสองฝ่าย', 'Mutual follows'),
      description: t('ติดตามกันและกัน', 'You follow each other'),
    },
  }) satisfies Record<RelationshipKey, { label: string; description: string }>;

export const RELATIONSHIP_ORDER: RelationshipKey[] = [
  'followers',
  'following',
  'notFollowingBack',
  'notFollowedBack',
  'mutual',
];
