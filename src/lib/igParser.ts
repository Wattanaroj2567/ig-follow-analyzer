import { strFromU8, unzipSync } from 'fflate';
import { formatDate } from './dates';
import type {
  AccountEntry,
  ArchiveErrorCode,
  AnalysisResult,
  FollowCounts,
  HistoryDiff,
  LatestHandleSnapshot,
} from '../types/analyzer';

export const MAX_ZIP_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB compressed archive limit
const MAX_TARGET_UNCOMPRESSED_BYTES = 50 * 1024 * 1024; // 50 MB total across target files
const MAX_ARCHIVE_ENTRIES = 25000;

export class ArchiveParseError extends Error {
  constructor(readonly code: ArchiveErrorCode) {
    super(code);
    this.name = 'ArchiveParseError';
  }
}

function isUnsafeArchivePath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) return true;
  return normalized.split('/').some((seg) => seg === '..');
}

function normalizeHandle(raw: string): string | null {
  const cleaned = raw.trim().replace(/^@+/, '').toLowerCase();
  if (!cleaned) return null;
  // Instagram handles allow letters, numbers, periods, underscores (1-30 chars)
  if (!/^[a-z0-9._]{1,64}$/.test(cleaned)) return null;
  return cleaned;
}

function extractHandleFromHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (!url.hostname.toLowerCase().includes('instagram.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const candidate = parts[0] === '_u' ? parts[1] : parts[0];
    return candidate ? normalizeHandle(candidate) : null;
  } catch {
    return null;
  }
}

export function buildSafeProfileHref(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

interface RawStringListItem {
  href?: unknown;
  value?: unknown;
  timestamp?: unknown;
}

interface RawInstagramEntry {
  title?: unknown;
  string_list_data?: unknown;
}

function parseEntryList(items: unknown[]): AccountEntry[] {
  const map = new Map<string, AccountEntry>();

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as RawInstagramEntry;
    const listData = Array.isArray(entry.string_list_data) ? entry.string_list_data : [];
    const first = (
      listData[0] && typeof listData[0] === 'object' ? listData[0] : {}
    ) as RawStringListItem;

    const rawValue = typeof first.value === 'string' ? first.value : undefined;
    const rawTitle = typeof entry.title === 'string' ? entry.title : undefined;
    const rawHref = typeof first.href === 'string' ? first.href : undefined;

    // Supports both classic value field AND Meta 2025-2026 following.json where handle moved to title / _u href
    const handle =
      (rawValue ? normalizeHandle(rawValue) : null) ??
      (rawTitle ? normalizeHandle(rawTitle) : null) ??
      extractHandleFromHref(rawHref);

    if (!handle) continue;

    const timestamp =
      typeof first.timestamp === 'number' && Number.isFinite(first.timestamp) && first.timestamp > 0
        ? Math.floor(first.timestamp)
        : undefined;

    const existing = map.get(handle);
    if (!existing || (!existing.timestamp && timestamp)) {
      map.set(handle, {
        handle,
        href: buildSafeProfileHref(handle),
        timestamp,
      });
    }
  }

  return Array.from(map.values());
}

function parseFollowersJson(jsonText: string): AccountEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ArchiveParseError('INVALID_FOLLOWERS_JSON');
  }

  if (Array.isArray(parsed)) {
    return parseEntryList(parsed);
  }
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.relationships_followers)) {
      return parseEntryList(obj.relationships_followers);
    }
  }

  throw new ArchiveParseError('UNEXPECTED_FOLLOWERS_SCHEMA');
}

function parseFollowingJson(jsonText: string): AccountEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ArchiveParseError('INVALID_FOLLOWING_JSON');
  }

  if (Array.isArray(parsed)) {
    return parseEntryList(parsed);
  }
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.relationships_following)) {
      return parseEntryList(obj.relationships_following);
    }
  }

  throw new ArchiveParseError('UNEXPECTED_FOLLOWING_SCHEMA');
}

/**
 * Safe HTML fallback parser — works in both Web Worker (no DOM needed) and browser
 * without ever injecting HTML into the live DOM or executing scripts.
 */
function parseInstagramHtml(htmlText: string): AccountEntry[] {
  const map = new Map<string, AccountEntry>();
  const anchorRegex =
    /<a\b[^>]*href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(htmlText)) !== null) {
    const href = match[1];
    const innerText = match[2];
    const handle = extractHandleFromHref(href) ?? normalizeHandle(innerText);
    if (!handle) continue;
    if (!map.has(handle)) {
      map.set(handle, {
        handle,
        href: buildSafeProfileHref(handle),
      });
    }
  }

  return Array.from(map.values());
}

function classifyTargetEntry(path: string): {
  kind: 'followers' | 'following';
  format: 'json' | 'html';
} | null {
  const norm = path.replace(/\\/g, '/').toLowerCase();
  const base = norm.split('/').pop() ?? '';
  const inFollowFolder =
    norm.includes('followers_and_following/') ||
    norm.startsWith('followers') ||
    norm.startsWith('following');

  if (!inFollowFolder) return null;

  if (/^followers(_\d+)?\.json$/.test(base)) {
    return { kind: 'followers', format: 'json' };
  }
  if (/^following(_\d+)?\.json$/.test(base)) {
    return { kind: 'following', format: 'json' };
  }
  if (/^followers(_\d+)?\.html?$/.test(base)) {
    return { kind: 'followers', format: 'html' };
  }
  if (/^following(_\d+)?\.html?$/.test(base)) {
    return { kind: 'following', format: 'html' };
  }
  return null;
}

export function computeFollowRelationshipSets(
  followersInput: AccountEntry[],
  followingInput: AccountEntry[],
): {
  counts: FollowCounts;
  followers: AccountEntry[];
  following: AccountEntry[];
  notFollowingBack: AccountEntry[];
  notFollowedBack: AccountEntry[];
  mutual: AccountEntry[];
} {
  const followerMap = new Map<string, AccountEntry>();
  for (const item of followersInput) {
    if (!followerMap.has(item.handle)) followerMap.set(item.handle, item);
  }

  const followingMap = new Map<string, AccountEntry>();
  for (const item of followingInput) {
    if (!followingMap.has(item.handle)) followingMap.set(item.handle, item);
  }

  const notFollowingBack: AccountEntry[] = [];
  const mutual: AccountEntry[] = [];
  for (const [handle, followingEntry] of followingMap.entries()) {
    const followerEntry = followerMap.get(handle);
    if (followerEntry) {
      const latestTs = Math.max(followerEntry.timestamp ?? 0, followingEntry.timestamp ?? 0);
      mutual.push({
        handle,
        href: followingEntry.href,
        timestamp: latestTs > 0 ? latestTs : undefined,
        followedUsAt: followerEntry.timestamp,
        followedByUsAt: followingEntry.timestamp,
      });
    } else {
      notFollowingBack.push({
        ...followingEntry,
        followedByUsAt: followingEntry.timestamp,
      });
    }
  }

  const notFollowedBack: AccountEntry[] = [];
  for (const [handle, followerEntry] of followerMap.entries()) {
    if (!followingMap.has(handle)) {
      notFollowedBack.push({
        ...followerEntry,
        followedUsAt: followerEntry.timestamp,
      });
    }
  }

  const sortByNewestThenHandle = (a: AccountEntry, b: AccountEntry) => {
    if ((b.timestamp ?? 0) !== (a.timestamp ?? 0)) {
      return (b.timestamp ?? 0) - (a.timestamp ?? 0);
    }
    return a.handle.localeCompare(b.handle);
  };

  const followers = Array.from(followerMap.values())
    .map((followerEntry) => ({
      ...followerEntry,
      followedUsAt: followerEntry.timestamp,
      followedByUsAt: followingMap.get(followerEntry.handle)?.timestamp,
    }))
    .sort(sortByNewestThenHandle);

  const following = Array.from(followingMap.values())
    .map((followingEntry) => ({
      ...followingEntry,
      followedByUsAt: followingEntry.timestamp,
      followedUsAt: followerMap.get(followingEntry.handle)?.timestamp,
    }))
    .sort(sortByNewestThenHandle);

  notFollowingBack.sort(sortByNewestThenHandle);
  notFollowedBack.sort(sortByNewestThenHandle);
  mutual.sort(sortByNewestThenHandle);

  return {
    counts: {
      followers: followers.length,
      following: following.length,
      notFollowingBack: notFollowingBack.length,
      notFollowedBack: notFollowedBack.length,
      mutual: mutual.length,
    },
    followers,
    following,
    notFollowingBack,
    notFollowedBack,
    mutual,
  };
}

function formatThaiDate(date: Date): string {
  return formatDate(date, 'th-TH');
}

function extractSnapshotDateFromFileName(fileName: string, fallback: Date): string {
  const m = fileName.match(/(20\d{2})[-_](\d{2})[-_](\d{2})/);
  if (m) {
    const parsed = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!Number.isNaN(parsed.getTime())) {
      return formatThaiDate(parsed);
    }
  }
  return formatThaiDate(fallback);
}

/**
 * Extracts the Instagram owner's username from official export ZIP filenames such as:
 * `instagram-somchai.demo-2026-11-19-aBcDeF12.zip` or `instagram-tawan_dev-2026-11-19 (1).zip`.
 * Returns undefined if the user renamed the file and no handle can be reliably identified.
 */
export function extractOwnerHandleFromFileName(fileName: string): string | undefined {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const match = base.match(/^instagram-([a-z0-9._]{1,30})-20\d{2}[-_]\d{2}[-_]\d{2}\b/i);
  if (!match) return undefined;
  return normalizeHandle(match[1]) ?? undefined;
}

export function parseInstagramZipBuffer(
  buffer: Uint8Array,
  fileName: string,
  onProgress?: (
    stage: 'validating' | 'unpacking' | 'parsing' | 'comparing',
    percent: number,
  ) => void,
): AnalysisResult {
  onProgress?.('validating', 15);

  if (buffer.byteLength === 0) {
    throw new ArchiveParseError('EMPTY_FILE');
  }

  if (buffer.byteLength > MAX_ZIP_SIZE_BYTES) {
    throw new ArchiveParseError('ARCHIVE_TOO_LARGE');
  }

  // ZIP magic signature check ("PK\x03\x04" or empty/spanned PK header)
  if (buffer.byteLength < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new ArchiveParseError('NOT_A_ZIP');
  }

  onProgress?.('unpacking', 40);

  let totalEntriesScanned = 0;
  let skippedNonTargetEntries = 0;
  let targetUncompressedBytes = 0;
  const matchedMeta = new Map<
    string,
    { kind: 'followers' | 'following'; format: 'json' | 'html' }
  >();

  let extracted: Record<string, Uint8Array>;
  try {
    extracted = unzipSync(buffer, {
      filter(file) {
        totalEntriesScanned += 1;
        if (totalEntriesScanned > MAX_ARCHIVE_ENTRIES) {
          throw new ArchiveParseError('TOO_MANY_ENTRIES');
        }
        if (isUnsafeArchivePath(file.name)) {
          throw new ArchiveParseError('UNSAFE_PATH');
        }
        const classified = classifyTargetEntry(file.name);
        if (!classified) {
          skippedNonTargetEntries += 1;
          return false;
        }
        targetUncompressedBytes += file.originalSize;
        if (targetUncompressedBytes > MAX_TARGET_UNCOMPRESSED_BYTES) {
          throw new ArchiveParseError('DECOMPRESSED_TOO_LARGE');
        }
        matchedMeta.set(file.name, classified);
        return true;
      },
    });
  } catch (err) {
    if (err instanceof ArchiveParseError) throw err;
    throw new ArchiveParseError('CORRUPT_ZIP');
  }

  const followerFiles: string[] = [];
  const followingFiles: string[] = [];
  const formatsSeen = new Set<'json' | 'html'>();

  for (const [path, info] of matchedMeta.entries()) {
    if (!extracted[path]) continue;
    formatsSeen.add(info.format);
    if (info.kind === 'followers') followerFiles.push(path);
    else followingFiles.push(path);
  }

  if (followerFiles.length === 0 && followingFiles.length === 0) {
    throw new ArchiveParseError('MISSING_BOTH_SECTIONS');
  }

  if (followerFiles.length === 0) {
    throw new ArchiveParseError('MISSING_FOLLOWERS');
  }

  if (followingFiles.length === 0) {
    throw new ArchiveParseError('MISSING_FOLLOWING');
  }

  onProgress?.('parsing', 70);

  const rawFollowers: AccountEntry[] = [];
  const rawFollowing: AccountEntry[] = [];

  for (const path of followerFiles) {
    const meta = matchedMeta.get(path)!;
    const text = strFromU8(extracted[path]);
    const list = meta.format === 'json' ? parseFollowersJson(text) : parseInstagramHtml(text);
    rawFollowers.push(...list);
  }

  for (const path of followingFiles) {
    const meta = matchedMeta.get(path)!;
    const text = strFromU8(extracted[path]);
    const list = meta.format === 'json' ? parseFollowingJson(text) : parseInstagramHtml(text);
    rawFollowing.push(...list);
  }

  onProgress?.('comparing', 90);

  const sets = computeFollowRelationshipSets(rawFollowers, rawFollowing);
  const now = new Date();
  const format = formatsSeen.size === 2 ? 'mixed' : formatsSeen.has('json') ? 'json' : 'html';

  return {
    sourceFileName: fileName,
    sourceFileSize: buffer.byteLength,
    ownerHandle: extractOwnerHandleFromFileName(fileName),
    analyzedAtIso: now.toISOString(),
    snapshotDateLabel: extractSnapshotDateFromFileName(fileName, now),
    isDemoData: false,
    detectedFiles: {
      format,
      followerFiles: followerFiles.sort(),
      followingFiles: followingFiles.sort(),
      totalEntriesScanned,
      skippedNonTargetEntries,
    },
    ...sets,
  };
}

export function computeHistoryDiff(
  previous: LatestHandleSnapshot | null,
  current: AnalysisResult,
): HistoryDiff | null {
  if (!previous || current.isDemoData) return null;

  // Never compare two different Instagram accounts against each other
  if (previous.ownerHandle && current.ownerHandle && previous.ownerHandle !== current.ownerHandle) {
    return null;
  }

  return compareFollowerSnapshots(previous, current);
}

export function compareFollowerSnapshots(
  previous: LatestHandleSnapshot,
  current: Pick<AnalysisResult, 'followers' | 'counts'>,
): HistoryDiff {
  const prevSet = new Set(previous.followerHandles);
  const currSet = new Set(current.followers.map((f) => f.handle));

  const recentUnfollowers: string[] = [];
  const unfollowerTimestamps = new Map<string, number>();
  for (const h of prevSet) {
    if (!currSet.has(h)) {
      recentUnfollowers.push(h);
      const timestamp = previous.followerTimestamps?.[h];
      if (typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0) {
        unfollowerTimestamps.set(h, timestamp);
      }
    }
  }

  const newFollowers: string[] = [];
  for (const h of currSet) {
    if (!prevSet.has(h)) newFollowers.push(h);
  }

  recentUnfollowers.sort();
  newFollowers.sort();

  return {
    previousDateLabel: previous.snapshotDateLabel,
    followersDelta: current.counts.followers - previous.counts.followers,
    followingDelta: current.counts.following - previous.counts.following,
    notFollowingBackDelta: current.counts.notFollowingBack - previous.counts.notFollowingBack,
    recentUnfollowers,
    unfollowerTimestamps,
    newFollowers,
  };
}

export function buildAccountsCsv(rows: { category: string; entry: AccountEntry }[]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const lines = ['source_category,username,followed_at,profile_url'];
  for (const { category, entry } of rows) {
    const dateStr = entry.timestamp ? formatThaiDate(new Date(entry.timestamp * 1000)) : '';
    lines.push(
      [escape(category), escape(entry.handle), escape(dateStr), escape(entry.href)].join(','),
    );
  }
  // UTF-8 BOM for Thai Excel compatibility
  return `\uFEFF${lines.join('\r\n')}`;
}
