import { ArchiveParseError, parseInstagramZipBuffer } from '../lib/igParser';
import type { WorkerOutboundMessage } from '../types/analyzer';

interface WorkerInboundMessage {
  fileName: string;
  buffer: ArrayBuffer;
}

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const { fileName, buffer } = event.data;

  const post = (msg: WorkerOutboundMessage) => {
    self.postMessage(msg);
  };

  try {
    const result = parseInstagramZipBuffer(new Uint8Array(buffer), fileName, (stage, percent) => {
      post({ type: 'progress', stage, percent });
    });
    post({ type: 'progress', stage: 'complete', percent: 100 });
    post({ type: 'success', result });
  } catch (err) {
    post({ type: 'error', code: err instanceof ArchiveParseError ? err.code : 'UNKNOWN_ERROR' });
  }
};
