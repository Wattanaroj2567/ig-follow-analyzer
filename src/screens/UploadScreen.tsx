import {
  AlertTriangle,
  ArrowRight,
  FileArchive,
  GitCompareArrows,
  PlayCircle,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { PageId } from '../components/AppShell';
import { NormalButton } from '../components/NormalButton';
import { UploadFileGuide } from '../components/UploadFileGuide';
import { formatBytes } from '../lib/fileSize';
import { useLanguage } from '../lib/language';
import { uploadErrors, uploadProgress } from '../lib/uploadFeedback';
import { useZipAnalysis } from '../lib/useZipAnalysis';
import type { AnalysisResult } from '../types/analyzer';

export type UploadMode = 'compare' | 'single';

interface UploadScreenProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onNavigate: (id: PageId) => void;
  historyEnabled?: boolean;
  comparisonEnabled?: boolean;
  uploadMode?: UploadMode;
  onUploadModeChange?: (mode: UploadMode) => void;
}

export function UploadScreen({
  onAnalysisComplete,
  onNavigate,
  historyEnabled = false,
  comparisonEnabled = false,
  uploadMode = 'compare',
  onUploadModeChange,
}: UploadScreenProps) {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const { state, start, cancel } = useZipAnalysis(onAnalysisComplete);
  const [isDragging, setIsDragging] = useState(false);
  const errorCode = state.status === 'error' ? state.code : null;
  const selectedFile = state.status !== 'idle' ? state.file : undefined;
  const error = errorCode ? uploadErrors[errorCode] : null;
  const isBusy = state.status === 'running';
  const percent = isBusy ? state.percent : 0;
  useLayoutEffect(() => {
    if (errorCode) errorRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [errorCode, selectedFile]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void start(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    void start(e.dataTransfer.files);
  };

  return (
    <div className="product-wrap pt-3 pb-9 lg:pt-4 lg:pb-14">
      <header className="border-b border-rule pb-7">
        <h1 className="page-heading">
          {isBusy
            ? t('กำลังวิเคราะห์ไฟล์ของคุณ…', 'Analyzing your file…')
            : t('อัปโหลดไฟล์ ZIP จาก Instagram', 'Analyze your Instagram ZIP')}
        </h1>
        <p className="max-w-[60ch] text-base text-ink-2">
          {t('เลือกไฟล์', 'Choose the')}{' '}
          <code className="measured rounded bg-paper-3 px-1.5 py-0.5 text-sm text-cool">.zip</code>
          {t(' ที่ได้จากศูนย์บัญชี Instagram โดยตรง', ' from Instagram Accounts Center.')}
        </p>

        {/* Lightweight 3-step orientation bar */}
        <ol
          aria-label={t('ลำดับการใช้งาน 3 ขั้นตอน', 'Three steps to analyze your export')}
          className="mt-5 grid gap-2"
        >
          <li className="overflow-hidden rounded-[10px] border border-rule bg-paper-2">
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-paper-3"
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
            className="overflow-hidden rounded-[10px] border border-accent bg-paper-3"
          >
            <div className="flex min-h-14 items-center justify-between gap-2 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-ink sm:text-sm">
                <span className="measured inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">
                  2
                </span>
                <span>{t('อัปโหลดไฟล์ .zip', 'Select your ZIP')}</span>
              </span>
              <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium text-accent">
                {t('อยู่ขั้นนี้', 'Current step')}
              </span>
            </div>
          </li>

          <li className="overflow-hidden rounded-[10px] border border-rule bg-paper-2">
            <div className="flex min-h-14 items-center justify-between gap-2 px-3.5 py-2.5 text-muted">
              <span className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                <span className="measured inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rule bg-paper-2 text-xs font-semibold text-muted">
                  3
                </span>
                <span>{t('ดูรายชื่อ & โหลด PDF', 'View results & save PDF')}</span>
              </span>
            </div>
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

              <p className="mt-3 text-sm text-muted">{uploadProgress[state.stage][language]}</p>

              <div className="mt-6">
                <NormalButton variant="danger" onClick={cancel}>
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  {t('ยกเลิกการวิเคราะห์', 'Cancel analysis')}
                </NormalButton>
              </div>
            </div>
          ) : (
            <>
              {historyEnabled && (
                <div
                  role="group"
                  aria-label={t('เลือกรูปแบบการวิเคราะห์ไฟล์', 'Choose analysis mode')}
                  className="mb-5 grid gap-3 sm:grid-cols-2"
                >
                  <button
                    type="button"
                    aria-pressed={uploadMode === 'compare'}
                    onClick={() => onUploadModeChange?.('compare')}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 text-left transition-colors ${
                      uploadMode === 'compare'
                        ? 'border-cool bg-cool-soft text-ink'
                        : 'border-rule bg-paper-3 text-ink-2 hover:border-rule-2 hover:text-ink'
                    }`}
                  >
                    <GitCompareArrows
                      className={`mt-0.5 size-4 shrink-0 ${uploadMode === 'compare' ? 'text-cool' : 'text-muted'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {comparisonEnabled
                          ? t('วิเคราะห์และเทียบกับประวัติ', 'Analyze & compare with history')
                          : t('วิเคราะห์และบันทึกประวัติ', 'Analyze & save to history')}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {comparisonEnabled
                          ? t(
                              'บันทึกประวัติและเทียบกับ ZIP ก่อนหน้าของบัญชีเดิมอัตโนมัติ',
                              'Saves to local history and compares with earlier ZIPs from the same account.',
                            )
                          : t(
                              'บันทึกสถิติสรุปลงประวัติบนเครื่องนี้ตามการตั้งค่า',
                              'Saves summary counts to local history on this device.',
                            )}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={uploadMode === 'single'}
                    onClick={() => onUploadModeChange?.('single')}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 text-left transition-colors ${
                      uploadMode === 'single'
                        ? 'border-cool bg-cool-soft text-ink'
                        : 'border-rule bg-paper-3 text-ink-2 hover:border-rule-2 hover:text-ink'
                    }`}
                  >
                    <FileArchive
                      className={`mt-0.5 size-4 shrink-0 ${uploadMode === 'single' ? 'text-cool' : 'text-muted'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {t('วิเคราะห์ไฟล์เดี่ยว (ไม่เทียบ)', 'Analyze single file (no comparison)')}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {t(
                          'วิเคราะห์ทีละไฟล์เหมือนครั้งแรก ไม่เทียบและไม่บันทึกลงประวัติเดิม',
                          'Analyze one file on its own without comparing or saving to history.',
                        )}
                      </span>
                    </span>
                  </button>
                </div>
              )}

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed px-3 py-7 text-center transition-colors sm:px-6 sm:py-12 ${
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
                  tabIndex={-1}
                  className="sr-only"
                  aria-label={t('เลือกไฟล์ ZIP จาก Instagram', 'Choose an Instagram ZIP file')}
                />

                <FileArchive className="h-9 w-9 text-accent" aria-hidden="true" />
                <p className="mt-4 text-lg font-medium text-ink sm:hidden">
                  {t('เลือกไฟล์ ZIP ที่ดาวน์โหลดไว้', 'Choose your downloaded ZIP')}
                </p>
                <p className="mt-4 hidden text-lg font-medium text-ink sm:block">
                  {t('ลากไฟล์ ', 'Drop your ')}
                  <code className="measured text-cool">.zip</code>
                  {t(' มาวางตรงนี้', ' file here')}
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  {t(
                    'เลือกไฟล์ .zip เดิมจากโฟลเดอร์ดาวน์โหลดหรือตำแหน่งที่บันทึกไว้ ไม่ต้องแตกไฟล์ ขนาดสูงสุด 200 MB',
                    'Choose the original .zip from Downloads or wherever you saved it. Keep it zipped. Maximum size 200 MB.',
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
                  {historyEnabled && uploadMode === 'single'
                    ? t(
                        'โหมดไฟล์เดี่ยว: ระบบจะวิเคราะห์เฉพาะไฟล์ที่เลือกโดยไม่เทียบและไม่บันทึกลงประวัติ ประวัติเดิมของคุณจะยังคงอยู่ครบ',
                        'Single-file mode: analyzes only this ZIP without comparing or saving to history. Your existing history stays untouched.',
                      )
                    : t(
                        'ขอไฟล์แบบ JSON และเลือกช่วง ตลอดเวลา (All time) ให้ทั้งสอง ZIP ก่อนเทียบ ช่วงสั้นหรือช่วงที่กำหนดเองอาจทำให้รายชื่อบางบัญชีหายจากไฟล์',
                        'Request JSON and set Date range to All time for both ZIPs before comparing. Short or custom ranges may leave accounts out.',
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
                  className="min-h-11 cursor-pointer px-1 font-medium underline"
                >
                  {t('อ่านเงื่อนไข (1 นาที)', 'Read terms (1 minute)')}
                </button>
              </div>
            </>
          )}

          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="mt-5 scroll-mb-3 rounded-[10px] border border-bad bg-bad-soft p-5 text-left"
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
