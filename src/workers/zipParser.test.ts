import { strToU8, zipSync } from 'fflate';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerOutboundMessage } from '../types/analyzer';

describe('ZIP worker protocol', () => {
  const worker = {
    onmessage: vi.fn<(event: { data: unknown }) => Promise<void>>(),
    postMessage: vi.fn<(message: WorkerOutboundMessage) => void>(),
  };
  const messages = () => worker.postMessage.mock.calls.map(([message]) => message);

  beforeAll(async () => {
    vi.stubGlobal('self', worker);
    await import('./zipParser.worker');
  });
  beforeEach(() => worker.postMessage.mockClear());
  afterAll(() => vi.unstubAllGlobals());

  it('reports ordered progress and includes the archive digest in its terminal success', async () => {
    const digest = vi.fn().mockResolvedValue(new Uint8Array(32).fill(171).buffer);
    vi.stubGlobal('crypto', { subtle: { digest } });
    const archive = zipSync({
      'followers_1.json': strToU8('[]'),
      'following.json': strToU8('[]'),
    });
    await worker.onmessage({
      data: { fileName: 'instagram-fictitious-2026-11-21.zip', buffer: archive.buffer },
    });
    expect(messages()).toEqual([
      { type: 'progress', stage: 'validating', percent: 15 },
      { type: 'progress', stage: 'unpacking', percent: 40 },
      { type: 'progress', stage: 'parsing', percent: 70 },
      { type: 'progress', stage: 'comparing', percent: 90 },
      { type: 'progress', stage: 'comparing', percent: 95 },
      {
        type: 'success',
        result: expect.objectContaining({
          ownerHandle: 'fictitious',
          archiveSha256: 'ab'.repeat(32),
        }),
      },
    ]);
    expect(digest).toHaveBeenCalledExactlyOnceWith('SHA-256', archive.buffer);
  });

  it('reports a terminal archive error without reaching parsing', () => {
    const archive = zipSync({ 'followers_1.json': strToU8('[]') });
    worker.onmessage({ data: { fileName: 'archive.zip', buffer: archive.buffer } });
    expect(messages()).toEqual([
      { type: 'progress', stage: 'validating', percent: 15 },
      { type: 'progress', stage: 'unpacking', percent: 40 },
      { type: 'error', code: 'MISSING_FOLLOWING' },
    ]);
  });

  it('handles an invalid request before processing archive bytes', () => {
    worker.onmessage({ data: null });
    expect(messages()).toEqual([{ type: 'error', code: 'UNKNOWN_ERROR' }]);
  });
});
