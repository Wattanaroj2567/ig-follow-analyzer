import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import {
  ArchiveParseError,
  buildAccountsCsv,
  computeHistoryDiff,
  extractOwnerHandleFromFileName,
  parseInstagramZipBuffer,
} from './igParser';

describe('igParser — Real Instagram ZIP/JSON/HTML engine', () => {
  const emptyLists = {
    'followers_1.json': strToU8('[]'),
    'following.json': strToU8('{"relationships_following":[]}'),
  };

  it('accepts genuinely empty lists and rejects nonempty lists without any account records', () => {
    const empty = parseInstagramZipBuffer(zipSync(emptyLists), 'archive.zip');
    expect(empty.counts.followers).toBe(0);
    const wrongShape = zipSync({ ...emptyLists, 'followers_1.json': strToU8('[{}]') });
    expect(() => parseInstagramZipBuffer(wrongShape, 'archive.zip')).toThrow(
      expect.objectContaining({ code: 'UNEXPECTED_FOLLOWERS_SCHEMA' }),
    );
  });

  it.each([
    ['followers_1.json', 'MISSING_FOLLOWING'],
    ['following.json', 'MISSING_FOLLOWERS'],
    ['other.json', 'MISSING_BOTH_SECTIONS'],
  ])('provides a specific error when an archive only contains %s', (entry, code) => {
    const zip = zipSync({ [entry]: strToU8('[]') });
    expect(() => parseInstagramZipBuffer(zip, 'archive.zip')).toThrow(
      expect.objectContaining({ code }),
    );
  });

  it('keeps a readable account even when its timestamp is outside the date range', () => {
    const zip = zipSync({
      ...emptyLists,
      'followers_1.json': strToU8(
        JSON.stringify([{ string_list_data: [{ value: 'fictitious', timestamp: 9e12 }] }]),
      ),
    });
    const result = parseInstagramZipBuffer(zip, 'archive.zip');
    expect(result.followers[0].handle).toBe('fictitious');
    expect(result.followers[0].timestamp).toBeUndefined();
  });

  it('rejects a section with both readable and unreadable rows', () => {
    const zip = zipSync({
      ...emptyLists,
      'followers_1.json': strToU8(
        JSON.stringify([{ string_list_data: [{ value: 'fictitious' }] }, {}]),
      ),
    });
    expect(() => parseInstagramZipBuffer(zip, 'archive.zip')).toThrow(
      expect.objectContaining({ code: 'UNEXPECTED_FOLLOWERS_SCHEMA' }),
    );
  });

  it('rejects a numbered export with a missing followers part', () => {
    const zip = zipSync({ ...emptyLists, 'followers_3.json': strToU8('[]') });
    expect(() => parseInstagramZipBuffer(zip, 'archive.zip')).toThrow(
      expect.objectContaining({ code: 'INCOMPLETE_ARCHIVE_LIST' }),
    );
  });

  it('uses the newest valid date for duplicate accounts across numbered parts', () => {
    const includeAccounts = (date?: number) =>
      strToU8(JSON.stringify([{ string_list_data: [{ value: 'fictitious', timestamp: date }] }]));
    const zip = zipSync({
      'followers_1.json': includeAccounts(),
      'followers_2.json': includeAccounts(1710000100),
      'followers_3.json': includeAccounts(1710000200),
      'following.html': strToU8('<html><h1>Following</h1></html>'),
    });
    const result = parseInstagramZipBuffer(zip, 'archive.zip');
    expect(result.detectedFiles.format).toBe('mixed');
    expect(result.counts.followers).toBe(1);
    expect(result.followers[0].followedUsAt).toBe(1710000200);
  });

  it('rejects a truncated HTML list while keeping legitimate empty lists', () => {
    const zip = zipSync({
      'followers_1.html': strToU8('<html><h1>Followers</h1></html>'),
      'following.html': strToU8('<html><h1>Following'),
    });
    expect(() => parseInstagramZipBuffer(zip, 'archive.zip')).toThrow(
      expect.objectContaining({ code: 'INVALID_FOLLOWING_HTML' }),
    );
  });

  it('uses the date after the owner name and ignores impossible calendar dates', () => {
    const valid = 'instagram-user2025_01_01-2026-02-14_export.zip';
    const invalid = 'instagram-sample-2026-02-31.zip';
    const zip = zipSync(emptyLists);
    expect(parseInstagramZipBuffer(zip, valid).snapshotDateLabel).toBe('14 ก.พ. 2569');
    expect(extractOwnerHandleFromFileName(valid)).toBe('user2025_01_01');
    expect(extractOwnerHandleFromFileName(invalid)).toBeUndefined();
  });

  it('reads HTML profile links when text is wrapped in formatting markup', () => {
    const zip = zipSync({
      'followers_1.html': strToU8(
        '<html><a href = "https://www.instagram.com/_u/fictitious"><strong>Fictitious</strong></a></html>',
      ),
      'following.html': strToU8('<html><h1>Following</h1></html>'),
    });
    const result = parseInstagramZipBuffer(zip, 'archive.zip');
    expect(result.followers.map(({ handle }) => handle)).toEqual(['fictitious']);
    expect(result.counts.notFollowedBack).toBe(1);
  });

  it('parses a single list with more accounts than a function call can accept as arguments', () => {
    const size = 150_000;
    const rows = Array.from({ length: size }, (_, i) => ({
      string_list_data: [{ value: `fictitious_${i}`, timestamp: 1731000000 + i }],
    }));
    const zip = zipSync({
      'followers_1.json': strToU8(JSON.stringify(rows)),
      'following.json': strToU8('[]'),
    });
    const result = parseInstagramZipBuffer(zip, 'instagram-test_user-2026-11-21.zip');
    expect(result.counts.followers).toBe(size);
    expect(result.counts.notFollowedBack).toBe(size);
  });

  it('parses multi-part followers_*.json and Meta 2025-2026 following.json (title + _u href)', () => {
    const followers1 = JSON.stringify([
      {
        title: '',
        string_list_data: [
          { href: 'https://www.instagram.com/alice', value: 'Alice', timestamp: 1710000100 },
        ],
      },
      {
        title: '',
        string_list_data: [
          { href: 'https://www.instagram.com/bob', value: 'bob', timestamp: 1710000200 },
        ],
      },
    ]);

    const followers2 = JSON.stringify([
      {
        title: '',
        string_list_data: [
          { href: 'https://www.instagram.com/fan_only', value: 'fan_only', timestamp: 1710000300 },
        ],
      },
      // Duplicate handle should be deduplicated
      {
        title: '',
        string_list_data: [
          { href: 'https://www.instagram.com/alice', value: 'alice', timestamp: 1710000100 },
        ],
      },
    ]);

    // Newer Meta 2025-2026 schema: handle lives in `title` and `href` uses `/_u/` without `value`
    const following = JSON.stringify({
      relationships_following: [
        {
          title: 'alice',
          string_list_data: [{ href: 'https://www.instagram.com/_u/alice', timestamp: 1700000001 }],
        },
        {
          title: 'bob',
          string_list_data: [{ href: 'https://www.instagram.com/_u/bob', timestamp: 1700000002 }],
        },
        {
          title: 'ghost_user',
          string_list_data: [
            { href: 'https://www.instagram.com/_u/ghost_user', timestamp: 1700000003 },
          ],
        },
      ],
    });

    const zip = zipSync({
      'connections/followers_and_following/followers_1.json': strToU8(followers1),
      'connections/followers_and_following/followers_2.json': strToU8(followers2),
      'connections/followers_and_following/following.json': strToU8(following),
      'media/posts/big_photo.jpg': strToU8('fake-binary-ignored'),
    });

    const result = parseInstagramZipBuffer(zip, 'instagram-demo-2026-11-19.zip');

    expect(result.detectedFiles.format).toBe('json');
    expect(result.detectedFiles.followerFiles).toHaveLength(2);
    expect(result.detectedFiles.followingFiles).toHaveLength(1);
    expect(result.detectedFiles.skippedNonTargetEntries).toBe(1);

    expect(result.counts).toEqual({
      followers: 3,
      following: 3,
      notFollowingBack: 1,
      notFollowedBack: 1,
      mutual: 2,
    });
    expect(result.notFollowingBack.map((a) => a.handle)).toEqual(['ghost_user']);
    expect(result.notFollowingBack[0].followedByUsAt).toBe(1700000003);
    expect(result.notFollowingBack[0].followedUsAt).toBeUndefined();

    expect(result.notFollowedBack.map((a) => a.handle)).toEqual(['fan_only']);
    expect(result.notFollowedBack[0].followedUsAt).toBe(1710000300);
    expect(result.notFollowedBack[0].followedByUsAt).toBeUndefined();

    expect(result.mutual.map((a) => a.handle).sort()).toEqual(['alice', 'bob']);
    const aliceMutual = result.mutual.find((a) => a.handle === 'alice');
    expect(aliceMutual?.followedUsAt).toBe(1710000100);
    expect(aliceMutual?.followedByUsAt).toBe(1700000001);
  });

  it('supports HTML export fallback safely without DOM execution', () => {
    const followersHtml = `
      <html><body>
        <a href="https://www.instagram.com/user_a">user_a</a>
        <a href="https://www.instagram.com/user_b">user_b</a>
        <script>alert('xss')</script>
      </body></html>
    `;
    const followingHtml = `
      <html><body>
        <a href="https://www.instagram.com/_u/user_a">user_a</a>
        <a href="https://www.instagram.com/_u/user_c">user_c</a>
      </body></html>
    `;

    const zip = zipSync({
      'connections/followers_and_following/followers_1.html': strToU8(followersHtml),
      'connections/followers_and_following/following.html': strToU8(followingHtml),
    });

    const result = parseInstagramZipBuffer(zip, 'instagram-html-2026-11-19.zip');
    expect(result.detectedFiles.format).toBe('html');
    expect(result.counts).toEqual({
      followers: 2,
      following: 2,
      notFollowingBack: 1,
      notFollowedBack: 1,
      mutual: 1,
    });
    expect(result.notFollowingBack[0].handle).toBe('user_c');
    expect(result.notFollowedBack[0].handle).toBe('user_b');
    expect(result.mutual[0].followedUsAt).toBeUndefined();
    expect(result.mutual[0].followedByUsAt).toBeUndefined();
  });

  it('rejects path traversal archives and non-ZIP files', () => {
    const badZip = zipSync({
      '../evil.json': strToU8('[]'),
    });
    expect(() => parseInstagramZipBuffer(badZip, 'evil.zip')).toThrowError(ArchiveParseError);

    const notZip = strToU8('plain text file');
    expect(() => parseInstagramZipBuffer(notZip, 'fake.zip')).toThrowError(ArchiveParseError);
  });

  it('computes History Model B unfollower diff and UTF-8 BOM CSV', () => {
    const zip = zipSync({
      'connections/followers_and_following/followers_1.json': strToU8(
        JSON.stringify([
          { string_list_data: [{ value: 'alice', timestamp: 1710000100 }] },
          { string_list_data: [{ value: 'new_fan', timestamp: 1710000200 }] },
        ]),
      ),
      'connections/followers_and_following/following.json': strToU8(
        JSON.stringify({ relationships_following: [{ title: 'alice' }] }),
      ),
    });

    const current = parseInstagramZipBuffer(zip, 'instagram-fictitious-2026-11-19.zip');
    const diff = computeHistoryDiff(
      {
        id: 'latest',
        sourceFileName: 'instagram-fictitious-2026-11-12.zip',
        analyzedAtIso: '2026-11-12T00:00:00Z',
        snapshotDateLabel: '12 พ.ย. 2569',
        counts: { followers: 2, following: 1, notFollowingBack: 0, notFollowedBack: 1, mutual: 1 },
        followerHandles: ['alice', 'left_user'],
      },
      current,
    );

    expect(diff?.recentUnfollowers).toEqual(['left_user']);
    expect(diff?.newFollowers).toEqual(['new_fan']);
    expect(diff?.unfollowerTimestamps.size).toBe(0);

    const datedDiff = computeHistoryDiff(
      {
        id: 'latest',
        ownerHandle: 'fictitious',
        analyzedAtIso: '2026-11-12T00:00:00Z',
        snapshotDateLabel: '12 พ.ย. 2569',
        counts: current.counts,
        followerHandles: ['alice', 'left_user'],
        followerTimestamps: { alice: 1710000100, left_user: 1700000000 },
      },
      current,
    );
    expect(datedDiff?.unfollowerTimestamps).toEqual(new Map([['left_user', 1700000000]]));

    const csv = buildAccountsCsv([{ category: 'ไม่ติดตามกลับ', entry: current.followers[0] }]);
    expect(csv.startsWith('\uFEFFsource_category,username')).toBe(true);
  });

  it('extracts ownerHandle from official ZIP names and blocks cross-account or demo diffs', () => {
    expect(extractOwnerHandleFromFileName('instagram-somchai.demo-2026-11-19-aBc12345.zip')).toBe(
      'somchai.demo',
    );
    expect(extractOwnerHandleFromFileName('instagram-tawan_dev-2026-11-19 (1).zip')).toBe(
      'tawan_dev',
    );
    expect(extractOwnerHandleFromFileName('my-renamed-export.zip')).toBeUndefined();

    const zip = zipSync({
      'connections/followers_and_following/followers_1.json': strToU8(
        JSON.stringify([{ string_list_data: [{ value: 'alice', timestamp: 1710000100 }] }]),
      ),
      'connections/followers_and_following/following.json': strToU8(
        JSON.stringify({ relationships_following: [{ title: 'alice' }] }),
      ),
    });

    const parsed = parseInstagramZipBuffer(zip, 'instagram-account_b-2026-11-19-xyz98765.zip');
    expect(parsed.ownerHandle).toBe('account_b');

    const snapshotFromAccountA = {
      id: 'account:account_a',
      ownerHandle: 'account_a',
      analyzedAtIso: '2026-11-12T00:00:00Z',
      snapshotDateLabel: '12 พ.ย. 2569',
      counts: { followers: 1, following: 1, notFollowingBack: 0, notFollowedBack: 0, mutual: 1 },
      followerHandles: ['other_user'],
    };

    // Must never compare account_b against account_a
    expect(computeHistoryDiff(snapshotFromAccountA, parsed)).toBeNull();
    expect(
      computeHistoryDiff(snapshotFromAccountA, {
        ...parsed,
        ownerHandle: undefined,
        sourceFileName: 'renamed.zip',
      }),
    ).toBeNull();

    // Must never compute diff for demo mode
    expect(
      computeHistoryDiff(snapshotFromAccountA, {
        ...parsed,
        ownerHandle: 'account_a',
        isDemoData: true,
      }),
    ).toBeNull();
  });
});
