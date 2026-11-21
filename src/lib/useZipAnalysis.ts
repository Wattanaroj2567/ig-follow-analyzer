import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type {
  AnalysisResult,
  ParseStage,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from '../types/analyzer';
import { MAX_ZIP_SIZE_BYTES } from './igParser';
import type { UploadErrorCode } from './uploadFeedback';

type SelectedZip = Pick<File, 'name' | 'size'>;
type ZipAnalysisState =
  | { status: 'idle' }
  | { status: 'error'; code: UploadErrorCode; file?: SelectedZip }
  | { status: 'running'; file: SelectedZip; stage: ParseStage | 'preparing'; percent: number };

function validateFile(file: SelectedZip): UploadErrorCode | undefined {
  if (!file.name.toLowerCase().endsWith('.zip')) return 'INVALID_EXTENSION';
  if (file.size === 0) return 'EMPTY_FILE';
  if (file.size > MAX_ZIP_SIZE_BYTES) return 'ARCHIVE_TOO_LARGE';
}

const WORKER_RESPONSE_TIMEOUT_MS = 60_000;

function readFile(reader: FileReader, file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error('Expected an ArrayBuffer'));
    };
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new DOMException('ZIP read cancelled', 'AbortError'));
    reader.readAsArrayBuffer(file);
  });
}

export function useZipAnalysis(onComplete: (result: AnalysisResult) => void) {
  const [state, setState] = useState<ZipAnalysisState>({ status: 'idle' });
  const active = useRef<{
    id: number;
    reader?: FileReader;
    worker?: Worker;
    timeout?: number;
  }>({ id: 0 });

  const stop = useCallback(() => {
    const job = active.current;
    job.id++;
    window.clearTimeout(job.timeout);
    job.timeout = undefined;
    job.reader?.abort();
    job.reader = undefined;
    job.worker?.terminate();
    job.worker = undefined;
  }, []);

  useLayoutEffect(() => stop, [stop]);

  const cancel = () => {
    stop();
    setState({ status: 'error', code: 'CANCELLED' });
  };

  const start = async (files: FileList | null) => {
    if (!files?.length) return;
    stop();
    if (files.length !== 1) {
      setState({ status: 'error', code: 'MULTIPLE_FILES' });
      return;
    }
    const file = files[0];
    const job = active.current;
    const jobId = job.id;
    const selected = { name: file.name, size: file.size };
    const fail = (code: UploadErrorCode) => {
      if (jobId !== job.id) return;
      stop();
      setState({ status: 'error', code, file: selected });
    };
    // A Worker that never answers would otherwise leave the progress bar frozen forever.
    const armWatchdog = () => {
      window.clearTimeout(job.timeout);
      job.timeout = window.setTimeout(() => fail('WORKER_ERROR'), WORKER_RESPONSE_TIMEOUT_MS);
    };
    const invalid = validateFile(selected);
    if (invalid) {
      fail(invalid);
      return;
    }

    setState({ status: 'running', file: selected, stage: 'preparing', percent: 8 });
    let buffer: ArrayBuffer;
    try {
      const reader = new FileReader();
      job.reader = reader;
      buffer = await readFile(reader, file);
    } catch {
      fail('READ_FAILED');
      return;
    }

    if (jobId !== job.id) return;
    job.reader = undefined;
    try {
      const worker = new Worker(new URL('../workers/zipParser.worker.ts', import.meta.url), {
        type: 'module',
      });
      job.worker = worker;
      worker.onmessage = ({ data }: MessageEvent<WorkerOutboundMessage>) => {
        if (jobId !== job.id) return;
        switch (data?.type) {
          case 'progress':
            armWatchdog();
            setState({
              status: 'running',
              file: selected,
              stage: data.stage,
              percent: data.percent,
            });
            break;
          case 'error':
            fail(data.code);
            break;
          case 'success':
            stop();
            setState({ status: 'idle' });
            onComplete(data.result);
            break;
          default:
            fail('WORKER_ERROR');
        }
      };
      worker.onerror = () => fail('WORKER_ERROR');
      worker.onmessageerror = () => fail('WORKER_ERROR');
      const input: WorkerInboundMessage = { fileName: selected.name, buffer };
      worker.postMessage(input, [buffer]);
      armWatchdog();
    } catch {
      fail('WORKER_ERROR');
    }
  };

  return { state, start, cancel };
}
