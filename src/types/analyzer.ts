export interface AccountEntry {
  handle: string;
  href: string;
  timestamp?: number; // Primary Unix epoch seconds when present in Instagram JSON export
  followedUsAt?: number; // When this account started following you (from followers_*.json)
  followedByUsAt?: number; // When you started following this account (from following.json)
}

export interface FollowCounts {
  followers: number;
  following: number;
  notFollowingBack: number;
  notFollowedBack: number;
  mutual: number;
}

interface DetectedArchiveFiles {
  format: 'json' | 'html' | 'mixed';
  followerFiles: string[];
  followingFiles: string[];
  totalEntriesScanned: number;
  skippedNonTargetEntries: number;
}

export interface AnalysisResult {
  sourceFileName: string;
  sourceFileSize: number;
  archiveSha256?: string;
  ownerHandle?: string; // Extracted from official Instagram ZIP filename when intact
  analyzedAtIso: string;
  snapshotDateLabel: string;
  isDemoData: boolean;
  detectedFiles: DetectedArchiveFiles;
  counts: FollowCounts;
  followers: AccountEntry[];
  following: AccountEntry[];
  notFollowingBack: AccountEntry[];
  notFollowedBack: AccountEntry[];
  mutual: AccountEntry[];
}

export interface HistoryPreferences {
  revision?: number;
  tier1SummaryOptIn: boolean;
  tier2HandlesOptIn: boolean;
}

export interface HistoryRecord {
  id: string;
  ownerHandle?: string;
  analyzedAtIso: string;
  snapshotDateLabel: string;
  sourceFileName: string;
  sourceFileSize?: number;
  counts: FollowCounts;
  pdfSavedTo?: 'device' | 'google_drive' | 'none';
  pdfFileName?: string;
  savedAnalysis?: AnalysisResult;
}

export interface LatestHandleSnapshot {
  id: string;
  ownerHandle?: string;
  analyzedAtIso: string;
  snapshotDateLabel: string;
  sourceFileName?: string;
  counts: FollowCounts;
  followerHandles: string[];
  followerTimestamps?: Record<string, number>;
}

export interface HistoryDiff {
  previousDateLabel: string;
  previousSourceFileName?: string;
  followersDelta: number;
  followingDelta: number;
  notFollowingBackDelta: number;
  recentUnfollowers: string[];
  unfollowerTimestamps: ReadonlyMap<string, number>;
  newFollowers: string[];
}

export interface PdfReportOptions {
  includeSummary: boolean;
  includeNotFollowingBack: boolean;
  includeNotFollowedBack: boolean;
  includeAllFollowers: boolean;
  includeDiffSection: boolean;
  includeTimestamps: boolean;
}

export type ParseStage = 'validating' | 'unpacking' | 'parsing' | 'comparing';

export type ArchiveErrorCode =
  | 'INVALID_FOLLOWERS_JSON'
  | 'INVALID_FOLLOWING_JSON'
  | 'INVALID_FOLLOWERS_HTML'
  | 'INVALID_FOLLOWING_HTML'
  | 'INCOMPLETE_ARCHIVE_LIST'
  | 'UNEXPECTED_FOLLOWERS_SCHEMA'
  | 'UNEXPECTED_FOLLOWING_SCHEMA'
  | 'EMPTY_FILE'
  | 'ARCHIVE_TOO_LARGE'
  | 'NOT_A_ZIP'
  | 'TOO_MANY_ENTRIES'
  | 'UNSAFE_PATH'
  | 'DECOMPRESSED_TOO_LARGE'
  | 'CORRUPT_ZIP'
  | 'MISSING_BOTH_SECTIONS'
  | 'MISSING_FOLLOWERS'
  | 'MISSING_FOLLOWING';

export interface WorkerInboundMessage {
  fileName: string;
  buffer: ArrayBuffer;
}

export type WorkerOutboundMessage =
  | { type: 'progress'; stage: ParseStage; percent: number }
  | { type: 'success'; result: AnalysisResult }
  | { type: 'error'; code: ArchiveErrorCode | 'UNKNOWN_ERROR' };
