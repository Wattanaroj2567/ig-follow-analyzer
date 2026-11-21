import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDemoAnalysisResult } from '../data/demoAnalysis';
import type {
  AnalysisResult,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from '../types/analyzer';
import { useZipAnalysis } from './useZipAnalysis';

class FakeFileReader {
  static instances: FakeFileReader[] = [];
  result: ArrayBuffer | null = null;
  error: DOMException | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  aborted = false;

  constructor() {
    FakeFileReader.instances.push(this);
  }

  readAsArrayBuffer() {}

  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerOutboundMessage>) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  posted: WorkerInboundMessage[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: WorkerInboundMessage) {
    this.posted.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  emit(data: WorkerOutboundMessage) {
    this.onmessage?.({ data } as MessageEvent<WorkerOutboundMessage>);
  }
}

const analysis: AnalysisResult = buildDemoAnalysisResult();
const zipFile = new File(['zip'], 'instagram-fictitious-2026-11-21.zip');
const invalidFile = new File(['zip'], 'instagram-fictitious-2026-11-21.txt');

function fileList(files: File[]): FileList {
  const list = Object.assign([...files], {
    item: (index: number) => files[index] ?? null,
  });
  return list as unknown as FileList;
}

function renderAnalysis() {
  const onComplete = vi.fn<(result: AnalysisResult) => void>();
  const hook = renderHook(() => useZipAnalysis(onComplete));
  return { ...hook, onComplete };
}

// Resolves the stubbed FileReader so the hook can hand the buffer to its Worker.
async function startReading(
  current: () => ReturnType<typeof useZipAnalysis>,
  files: FileList,
): Promise<void> {
  let pending: Promise<void>;
  act(() => {
    pending = current().start(files);
  });
  const reader = FakeFileReader.instances.at(-1);
  if (reader) {
    reader.result = new ArrayBuffer(8);
    reader.onload?.();
  }
  await act(async () => {
    await pending!;
  });
}

describe('ZIP analysis hook', () => {
  beforeEach(() => {
    FakeFileReader.instances.length = 0;
    FakeWorker.instances.length = 0;
    vi.stubGlobal('FileReader', FakeFileReader);
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('rejects a multi-file drop before reading anything', async () => {
    const { result } = renderAnalysis();
    await act(async () => {
      await result.current.start(fileList([zipFile, zipFile]));
    });
    expect(result.current.state).toEqual({ status: 'error', code: 'MULTIPLE_FILES' });
    expect(FakeFileReader.instances).toHaveLength(0);
  });

  it('reports an invalid extension without starting a Worker', async () => {
    const { result } = renderAnalysis();
    await act(async () => {
      await result.current.start(fileList([invalidFile]));
    });
    expect(result.current.state).toMatchObject({
      status: 'error',
      code: 'INVALID_EXTENSION',
      file: { name: invalidFile.name },
    });
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it('aborts the read on cancel and ignores the aborted read', async () => {
    const { result } = renderAnalysis();
    let pending: Promise<void>;
    act(() => {
      pending = result.current.start(fileList([zipFile]));
    });
    expect(result.current.state).toMatchObject({ status: 'running', stage: 'preparing' });

    act(() => result.current.cancel());
    expect(result.current.state).toEqual({ status: 'error', code: 'CANCELLED' });
    expect(FakeFileReader.instances[0].aborted).toBe(true);

    await act(async () => {
      await pending!;
    });
    expect(result.current.state).toEqual({ status: 'error', code: 'CANCELLED' });
  });

  it('fails a Worker that stops responding', async () => {
    vi.useFakeTimers();
    const { result } = renderAnalysis();
    await startReading(() => result.current, fileList([zipFile]));
    expect(result.current.state).toMatchObject({ status: 'running', stage: 'preparing' });

    const worker = FakeWorker.instances[0];
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.state).toMatchObject({ status: 'error', code: 'WORKER_ERROR' });
    expect(worker.terminated).toBe(true);
  });

  it('delivers only the newest run and ignores a superseded Worker result', async () => {
    const { result, onComplete } = renderAnalysis();
    await startReading(() => result.current, fileList([zipFile]));
    await startReading(() => result.current, fileList([zipFile]));
    const [first, second] = FakeWorker.instances;
    expect(first.terminated).toBe(true);

    act(() => first.emit({ type: 'success', result: analysis }));
    expect(onComplete).not.toHaveBeenCalled();

    act(() => second.emit({ type: 'success', result: analysis }));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(analysis);
    expect(result.current.state).toEqual({ status: 'idle' });
  });
});
