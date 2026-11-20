import {
  AlertTriangle,
  ArrowRight,
  FileArchive,
  PlayCircle,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { PageId } from '../components/AppShell';
import { NormalButton } from '../components/NormalButton';
import { UploadFileGuide } from '../components/UploadFileGuide';
import { formatBytes } from '../lib/fileSize';
import { useLanguage } from '../lib/language';
import { type UploadErrorCode, uploadErrors, uploadProgress } from '../lib/uploadFeedback';
import { MAX_ZIP_SIZE_BYTES } from '../lib/igParser';
import type { AnalysisResult, ParseStage, WorkerOutboundMessage } from '../types/analyzer';

interface UploadScreenProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onNavigate: (id: PageId) => void;
}

export function UploadScreen({ onAnalysisComplete, onNavigate }: UploadScreenProps) {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [stage, setStage] = useState<ParseStage | 'preparing' | 'idle'>('idle');
  const [percent, setPercent] = useState(0);
  const [errorCode, setErrorCode] = useState<UploadErrorCode | null>(null);
  const error = errorCode ? uploadErrors[errorCode] : null;

  const terminateWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  const handleCancel = () => {
    terminateWorker();
    setStage('idle');
    setPercent(0);
    setSelectedFile(null);
    setErrorCode('CANCELLED');
  };

  const processZipFile = async (file: File) => {
    terminateWorker();
    setErrorCode(null);
    setSelectedFile({ name: file.name, size: file.size });

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setStage('idle');
      setErrorCode('INVALID_EXTENSION');
      return;
    }

    if (file.size > MAX_ZIP_SIZE_BYTES) {
      setStage('idle');
      setErrorCode('ARCHIVE_TOO_LARGE');
      return;
    }

    setStage('preparing');
    setPercent(8);

    try {
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL('../workers/zipParser.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          setStage(msg.stage);
          setPercent(msg.percent);
        } else if (msg.type === 'success') {
          terminateWorker();
          onAnalysisComplete(msg.result);
        } else if (msg.type === 'error') {
          terminateWorker();
          setStage('idle');
          setPercent(0);
          setErrorCode(msg.code);
        }
      };

      worker.onerror = () => {
        terminateWorker();
        setStage('idle');
        setPercent(0);
        setErrorCode('WORKER_ERROR');
      };

      worker.postMessage({ fileName: file.name, buffer }, [buffer]);
    } catch {
      terminateWorker();
      setStage('idle');
      setErrorCode('READ_FAILED');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processZipFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processZipFile(file);
    }
  };

  const isBusy = stage !== 'idle';

  return (
    <div className="product-wrap py-9 lg:py-14">
      <header className="border-b border-rule pb-7">
        <h1 className="text-3xl text-ink sm:text-4xl">
          {isBusy
            ? t('กำลังวิเคราะห์ไฟล์ของคุณ…', 'Analyzing your file…')
            : t('อัปโหลดไฟล์ ZIP จาก Instagram', 'Analyze your Instagram ZIP')}
        </h1>
        <p className="mt-2 max-w-[60ch] text-base text-ink-2">
          {t('เลือกไฟล์', 'Choose the')}{' '}
          <code className="measured rounded bg-paper-3 px-1.5 py-0.5 text-sm text-cool">.zip</code>
          {t(' ที่ได้จากศูนย์บัญชี Instagram โดยตรง', ' from Instagram Accounts Center.')}
        </p>

        {/* Lightweight 3-step orientation bar */}
        <ol
          aria-label={t('ลำดับการใช้งาน 3 ขั้นตอน', 'Three steps to analyze your export')}
          className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <li>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-rule bg-paper-2 px-3.5 py-2.5 text-left transition-colors hover:border-accent"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-ink-2 sm:text-sm">
                <span className="measured inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-3 text-xs font-semibold text-muted">
                  1
                </span>
                <span>{t('ขอไฟล์จาก IG', 'Request an export')}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent">
                <span>{t('ดูคู่มือ', 'View guide')}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          </li>

          <li
            aria-current="step"
            className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-ink sm:text-sm">
              <span className="measured inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">
                2
              </span>
              <span>{t('อัปโหลดไฟล์ .zip', 'Select your ZIP')}</span>
            </span>
            <span className="shrink-0 rounded bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-accent">
              {t('อยู่ขั้นนี้', 'Current step')}
            </span>
          </li>

          <li className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg border border-rule bg-paper-3 px-3.5 py-2.5 text-muted">
            <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
              <span className="measured inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rule bg-paper-2 text-xs font-semibold text-muted">
                3
              </span>
              <span>{t('ดูรายชื่อ & โหลด PDF', 'View results & save PDF')}</span>
            </span>
          </li>
        </ol>
      </header>

      <div className="mt-8 grid gap-4">
        <section className="min-w-0 rounded-[10px] border border-rule bg-paper-2 p-4 sm:p-8">
          {isBusy ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-[10px] border border-rule bg-paper-3 p-6"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2.5 font-medium text-ink">
                  <FileArchive className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="truncate">{selectedFile?.name}</span>
                </div>
                <span className="measured shrink-0 font-medium text-accent">{percent}%</span>
              </div>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full bg-accent transition-transform duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-muted">{uploadProgress[stage][language]}</p>

              <div className="mt-6">
                <NormalButton variant="danger" onClick={handleCancel}>
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  {t('ยกเลิกการวิเคราะห์', 'Cancel analysis')}
                </NormalButton>
              </div>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed px-3 py-12 text-center transition-colors sm:px-6 ${
                  isDragging
                    ? 'border-accent bg-accent-soft'
                    : 'border-rule-2 bg-paper-3 hover:border-accent'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label={t('เลือกไฟล์ ZIP จาก Instagram', 'Choose an Instagram ZIP file')}
                />

                <FileArchive className="h-9 w-9 text-accent" aria-hidden="true" />
                <p className="mt-4 text-lg font-medium text-ink">
                  {t('ลากไฟล์ ', 'Drop your ')}
                  <code className="measured text-cool">.zip</code>
                  {t(' มาวางตรงนี้', ' file here')}
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  {t(
                    'ไฟล์ขนาดไม่เกิน 200 MB และไม่ต้องแตกไฟล์ก่อน',
                    'Up to 200 MB. Keep the file zipped.',
                  )}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <NormalButton variant="primary" onClick={() => inputRef.current?.click()}>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {t('เลือกไฟล์ .ZIP จากเครื่อง', 'Choose a ZIP from your device')}
                  </NormalButton>
                  <NormalButton variant="secondary" onClick={() => onNavigate('how-it-works')}>
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    {t('ดูวิธีขอไฟล์จาก Instagram', 'How to get your Instagram export')}
                  </NormalButton>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {t(
                    'ขอไฟล์แบบ JSON และเลือกช่วงวันที่ ตลอดเวลา เพื่อให้รายชื่อครบและมีวันที่ติดตาม',
                    'Choose JSON and All time when requesting your export to include the full list and follow dates.',
                  )}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-rule bg-ok-soft px-4 py-3 text-sm text-ok">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t(
                      'อ่านและคำนวณในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ขอรหัสผ่านและไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์',
                      'Your browser reads and analyzes the file on this device without a password or a server upload.',
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="min-h-[44px] cursor-pointer px-1 font-medium underline"
                >
                  {t('อ่านเงื่อนไข (1 นาที)', 'Read terms (1 minute)')}
                </button>
              </div>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-[10px] border border-bad bg-bad-soft p-5 text-left"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-bad" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-bad">{error.message[language]}</p>
                  {selectedFile && (
                    <p className="mt-1 text-xs text-bad">
                      {t('ไฟล์ที่เลือก: ', 'Selected file: ')}
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">
                    <strong>{t('วิธีแก้ไข:', 'How to fix it:')}</strong> {error.hint[language]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
        <UploadFileGuide />
      </div>
    </div>
  );
}
