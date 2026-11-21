import { unzipSync } from 'fflate';
import { calendarDate, formatDate } from './dates';
import type {
  AccountEntry,
  ArchiveErrorCode,
  AnalysisResult,
  FollowCounts,
  HistoryDiff,
  LatestHandleSnapshot,
  ParseStage,
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
  if (!/^[a-z0-9._]{1,30}$/.test(cleaned) || /^\.+$/.test(cleaned)) return null;
  return cleaned;
}

function extractHandleFromHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.hostname !== 'instagram.com' && !url.hostname.endsWith('.instagram.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 1 && parts[0] !== '_u') return normalizeHandle(parts[0]);
    if (parts.length === 2 && parts[0] === '_u') return normalizeHandle(parts[1]);
    return null;
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

type RelationshipList = 'followers' | 'following';
type ListFormat = 'json' | 'html';

const listSchema = {
  followers: {
    key: 'relationships_followers',
    invalidJson: 'INVALID_FOLLOWERS_JSON',
    invalidHtml: 'INVALID_FOLLOWERS_HTML',
    schema: 'UNEXPECTED_FOLLOWERS_SCHEMA',
  },
  following: {
    key: 'relationships_following',
    invalidJson: 'INVALID_FOLLOWING_JSON',
    invalidHtml: 'INVALID_FOLLOWING_HTML',
    schema: 'UNEXPECTED_FOLLOWING_SCHEMA',
  },
} as const;

function parseEntryList(
  items: unknown[],
  schemaError: (typeof listSchema)[RelationshipList]['schema'],
): AccountEntry[] {
  const map = new Map<string, AccountEntry>();

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') throw new ArchiveParseError(schemaError);
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

    if (!handle) throw new ArchiveParseError(schemaError);

    const timestamp =
      typeof first.timestamp === 'number' && first.timestamp >= 1 && first.timestamp <= 8.64e12
        ? Math.floor(first.timestamp)
        : undefined;

    const existing = map.get(handle);
    if (!existing || (timestamp ?? 0) > (existing.timestamp ?? 0)) {
      map.set(handle, {
        handle,
        href: buildSafeProfileHref(handle),
        timestamp,
      });
    }
  }

  return Array.from(map.values());
}

function parseRelationshipJson(text: string, kind: RelationshipList): AccountEntry[] {
  const { key, invalidJson, schema } = listSchema[kind];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ArchiveParseError(invalidJson);
  }

  if (Array.isArray(parsed)) return parseEntryList(parsed, schema);
  if (parsed && typeof parsed === 'object' && key in parsed) {
    const rows = (parsed as Record<string, unknown>)[key];
    if (Array.isArray(rows)) return parseEntryList(rows, schema);
  }
  throw new ArchiveParseError(schema);
}

/**
 * Safe HTML fallback parser — works in both Web Worker (no DOM needed) and browser
 * without ever injecting HTML into the live DOM or executing scripts.
 */
function parseInstagramHtml(htmlText: string, kind: RelationshipList): AccountEntry[] {
  if (!/<html(?:\s[^>]*)?>/i.test(htmlText) || !/<\/html\s*>/i.test(htmlText)) {
    throw new ArchiveParseError(listSchema[kind].invalidHtml);
  }

  const map = new Map<string, AccountEntry>();
  const anchors = htmlText.matchAll(/<a\b(?=\s|>)(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi);
  for (const [tag] of anchors) {
    const href = tag.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const handle = extractHandleFromHref(href?.[1] ?? href?.[2]);
    if (handle && !map.has(handle)) map.set(handle, { handle, href: buildSafeProfileHref(handle) });
  }

  return Array.from(map.values());
}

interface ArchiveListFile {
  path: string;
  normalizedPath: string;
  kind: RelationshipList;
  format: ListFormat;
  part: number;
  size: number;
}

function classifyTargetEntry(path: string) {
  const segments = path
    .replace(/\\/g, '/')
    .toLowerCase()
    .split('/')
    .filter((part) => part && part !== '.');
  const base = segments.at(-1) ?? '';
  if (segments.length > 1 && !segments.slice(0, -1).includes('followers_and_following'))
    return null;

  const match = /^(followers|following)(?:_(\d+))?\.(json|html?)$/.exec(base);
  if (!match) return null;
  const kind: RelationshipList = match[1] === 'followers' ? 'followers' : 'following';
  const format: ListFormat = match[3] === 'json' ? 'json' : 'html';
  return {
    path,
    normalizedPath: segments.join('/'),
    kind,
    format,
    part: match[2] === undefined ? 1 : Number(match[2]),
  };
}

function verifyListParts(files: ArchiveListFile[]) {
  const parts: Record<ListFormat, Set<number>> = { json: new Set(), html: new Set() };
  for (const { format, part } of files) {
    const seen = parts[format];
    if (!Number.isSafeInteger(part) || part < 1 || seen.has(part)) {
      throw new ArchiveParseError('INCOMPLETE_ARCHIVE_LIST');
    }
    seen.add(part);
  }
  for (const seen of Object.values(parts)) {
    for (let part = 1; part <= seen.size; part++) {
      if (!seen.has(part)) throw new ArchiveParseError('INCOMPLETE_ARCHIVE_LIST');
    }
  }
}

function unpackRelationshipFiles(buffer: Uint8Array) {
  const files: Record<RelationshipList, ArchiveListFile[]> = { followers: [], following: [] };
  const paths = new Set<string>();
  let totalEntriesScanned = 0;
  let skippedNonTargetEntries = 0;
  let targetBytes = 0;
  let extracted: ReturnType<typeof unzipSync>;
  try {
    extracted = unzipSync(buffer, {
      filter(file) {
        if (++totalEntriesScanned > MAX_ARCHIVE_ENTRIES) {
          throw new ArchiveParseError('TOO_MANY_ENTRIES');
        }
        if (isUnsafeArchivePath(file.name)) throw new ArchiveParseError('UNSAFE_PATH');
        const classified = classifyTargetEntry(file.name);
        if (!classified) {
          skippedNonTargetEntries++;
          return false;
        }
        if (paths.has(classified.normalizedPath)) {
          throw new ArchiveParseError('INCOMPLETE_ARCHIVE_LIST');
        }
        if (file.compression === 0 && file.size !== file.originalSize) {
          throw new ArchiveParseError('CORRUPT_ZIP');
        }
        targetBytes += file.originalSize;
        if (targetBytes > MAX_TARGET_UNCOMPRESSED_BYTES) {
          throw new ArchiveParseError('DECOMPRESSED_TOO_LARGE');
        }
        paths.add(classified.normalizedPath);
        files[classified.kind].push({ ...classified, size: file.originalSize });
        return true;
      },
    });
  } catch (error) {
    if (error instanceof ArchiveParseError) throw error;
    throw new ArchiveParseError('CORRUPT_ZIP');
  }
  return { files, extracted, totalEntriesScanned, skippedNonTargetEntries };
}

function parseRelationshipFiles(files: ArchiveListFile[], extracted: Record<string, Uint8Array>) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries: AccountEntry[] = [];
  for (const { path, size, kind, format } of files) {
    const bytes = extracted[path];
    if (!bytes || bytes.byteLength !== size) throw new ArchiveParseError('CORRUPT_ZIP');

    let text: string;
    try {
      text = decoder.decode(bytes);
    } catch {
      const { invalidJson, invalidHtml } = listSchema[kind];
      throw new ArchiveParseError(format === 'json' ? invalidJson : invalidHtml);
    }
    const list =
      format === 'json' ? parseRelationshipJson(text, kind) : parseInstagramHtml(text, kind);
    for (const entry of list) entries.push(entry);
  }
  return entries;
}

function indexAccounts(entries: AccountEntry[]) {
  const byHandle = new Map<string, AccountEntry>();
  for (const entry of entries) {
    const existing = byHandle.get(entry.handle);
    if (!existing || (entry.timestamp ?? 0) > (existing.timestamp ?? 0)) {
      byHandle.set(entry.handle, entry);
    }
  }
  return byHandle;
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
  const followerMap = indexAccounts(followersInput);
  const followingMap = indexAccounts(followingInput);

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

const officialExportName =
  /^instagram-([a-z0-9._]{1,30})-(20\d{2})[-_](\d{2})[-_](\d{2})(?=[._ -]|$)/i;

function exportFileInfo(fileName: string): { ownerHandle?: string; date?: Date } {
  const baseName = fileName.split(/[\\/]/).pop() ?? fileName;
  const official = baseName.match(officialExportName);
  const dateParts =
    official?.slice(2) ?? baseName.match(/(20\d{2})[-_](\d{2})[-_](\d{2})/)?.slice(1);
  if (!dateParts) return {};
  const [year, month, day] = dateParts.map(Number);
  const date = calendarDate(year, month - 1, day);
  const ownerHandle = date && official ? (normalizeHandle(official[1]) ?? undefined) : undefined;
  return { ownerHandle, date };
}

export function extractOwnerHandleFromFileName(fileName: string): string | undefined {
  return exportFileInfo(fileName).ownerHandle;
}

export function parseInstagramZipBuffer(
  buffer: Uint8Array,
  fileName: string,
  onProgress?: (stage: ParseStage, percent: number) => void,
): AnalysisResult {
  onProgress?.('validating', 15);
  if (buffer.byteLength === 0) throw new ArchiveParseError('EMPTY_FILE');
  if (buffer.byteLength > MAX_ZIP_SIZE_BYTES) throw new ArchiveParseError('ARCHIVE_TOO_LARGE');

  const signature =
    buffer.length >= 4 ? new DataView(buffer.buffer, buffer.byteOffset, 4).getUint32(0, true) : 0;
  if (signature !== 0x04034b50 && signature !== 0x06054b50 && signature !== 0x08074b50) {
    throw new ArchiveParseError('NOT_A_ZIP');
  }
  if (buffer.byteLength < 22) throw new ArchiveParseError('CORRUPT_ZIP');

  onProgress?.('unpacking', 40);
  const { files, extracted, totalEntriesScanned, skippedNonTargetEntries } =
    unpackRelationshipFiles(buffer);
  const { followers, following } = files;
  if (!followers.length && !following.length) throw new ArchiveParseError('MISSING_BOTH_SECTIONS');
  if (!followers.length) throw new ArchiveParseError('MISSING_FOLLOWERS');
  if (!following.length) throw new ArchiveParseError('MISSING_FOLLOWING');
  verifyListParts(followers);
  verifyListParts(following);

  onProgress?.('parsing', 70);
  const rawFollowers = parseRelationshipFiles(followers, extracted);
  const rawFollowing = parseRelationshipFiles(following, extracted);

  onProgress?.('comparing', 90);

  const sets = computeFollowRelationshipSets(rawFollowers, rawFollowing);
  const now = new Date();
  const { ownerHandle, date } = exportFileInfo(fileName);
  const formatsSeen = new Set([...followers, ...following].map((file) => file.format));
  const format = formatsSeen.size === 2 ? 'mixed' : formatsSeen.has('json') ? 'json' : 'html';

  return {
    sourceFileName: fileName,
    sourceFileSize: buffer.byteLength,
    ownerHandle,
    analyzedAtIso: now.toISOString(),
    snapshotDateLabel: formatThaiDate(date ?? now),
    isDemoData: false,
    detectedFiles: {
      format,
      followerFiles: followers.map((file) => file.path).sort(),
      followingFiles: following.map((file) => file.path).sort(),
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

  const previousOwner =
    previous.ownerHandle ??
    (previous.sourceFileName && extractOwnerHandleFromFileName(previous.sourceFileName));
  const currentOwner =
    current.ownerHandle ?? extractOwnerHandleFromFileName(current.sourceFileName);
  if (!previousOwner || !currentOwner || previousOwner !== currentOwner) return null;
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
    previousSourceFileName: previous.sourceFileName,
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
