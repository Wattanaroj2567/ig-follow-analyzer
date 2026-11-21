import { ArchiveParseError, parseInstagramZipBuffer } from '../lib/igParser';
import type { WorkerOutboundMessage } from '../types/analyzer';

async function archiveDigest(buffer: ArrayBuffer): Promise<string | undefined> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return;
    const digest = new Uint8Array(await subtle.digest('SHA-256', buffer));
    return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    // Relationship analysis is still available if this browser cannot hash the ZIP.
  }
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  const post = (msg: WorkerOutboundMessage) => {
    self.postMessage(msg);
  };

  try {
    const data = event.data;
    if (
      !data ||
      typeof data !== 'object' ||
      !('fileName' in data) ||
      typeof data.fileName !== 'string' ||
      !data.fileName ||
      !('buffer' in data) ||
      !(data.buffer instanceof ArrayBuffer)
    ) {
      post({ type: 'error', code: 'UNKNOWN_ERROR' });
      return;
    }
    const { fileName, buffer } = data;
    const result = parseInstagramZipBuffer(new Uint8Array(buffer), fileName, (stage, percent) => {
      post({ type: 'progress', stage, percent });
    });
    // Hashing a large archive takes a moment, so keep the progress bar moving until the digest is ready.
    post({ type: 'progress', stage: 'comparing', percent: 95 });
    const archiveSha256 = await archiveDigest(buffer);
    post({ type: 'success', result: { ...result, archiveSha256 } });
  } catch (err) {
    post({ type: 'error', code: err instanceof ArchiveParseError ? err.code : 'UNKNOWN_ERROR' });
  }
};
