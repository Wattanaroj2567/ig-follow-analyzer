import { AlertCircle, CheckCircle2, Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useLanguage } from '../lib/language';
import { NormalButton } from './NormalButton';

const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSfADGFKA0leHNh2CpRZnpi5B-5CFwApo5m-OJcHfu8hgJlnpA/formResponse';

const ENTRY_CATEGORY = 'entry.1729969809';
const ENTRY_DETAILS = 'entry.1974617888';
const ENTRY_DEVICE = 'entry.2106459818';

type FeedbackCategory = 'แจ้งปัญหา' | 'เสนอฟีเจอร์' | 'อื่นๆ';

function detectDeviceSummary(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/i.test(ua)
    ? 'iOS'
    : /Android/i.test(ua)
      ? 'Android'
      : /Mac OS X/i.test(ua)
        ? 'macOS'
        : /Windows/i.test(ua)
          ? 'Windows'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Other OS';

  const browser = /EdgA?|EdgiOS/i.test(ua)
    ? 'Edge'
    : /CriOS|Chrome/i.test(ua)
      ? 'Chrome'
      : /FxiOS|Firefox/i.test(ua)
        ? 'Firefox'
        : /SamsungBrowser/i.test(ua)
          ? 'Samsung Internet'
          : /Safari/i.test(ua)
            ? 'Safari'
            : 'Other Browser';

  return `${os} · ${browser}`;
}

export function FeedbackForm() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<FeedbackCategory>('แจ้งปัญหา');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const categories: { value: FeedbackCategory; label: string }[] = [
    { value: 'แจ้งปัญหา', label: t('แจ้งปัญหา', 'Report a bug') },
    { value: 'เสนอฟีเจอร์', label: t('เสนอฟีเจอร์', 'Suggest a feature') },
    { value: 'อื่นๆ', label: t('อื่นๆ', 'Other') },
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = details.trim();
    if (!trimmed) return;

    setStatus('submitting');
    try {
      const deviceSummary = detectDeviceSummary();
      const viewport =
        typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '';
      const devicePayload = viewport ? `${deviceSummary} · ${viewport}` : deviceSummary;

      const body = new URLSearchParams();
      body.append(ENTRY_CATEGORY, category);
      body.append(ENTRY_DETAILS, trimmed);
      body.append(ENTRY_DEVICE, devicePayload);

      await fetch(GOOGLE_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: body.toString(),
      });

      setDetails('');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section
      id="feedback"
      aria-labelledby="feedback-h"
      className="mt-8 scroll-mt-24 rounded-[10px] border border-rule bg-paper-2 p-6 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <MessageSquarePlus
          className="mt-0.5 hidden h-6 w-6 shrink-0 text-cool sm:inline-block"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <div>
          <h2 id="feedback-h" className="text-xl text-ink">
            {t('แจ้งปัญหาหรือเสนอแนะฟีเจอร์', 'Send feedback or report an issue')}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {t(
              'หากพบปัญหาการใช้งาน อัปโหลดไฟล์ไม่ได้ หรืออยากเสนอฟีเจอร์เพิ่มเติม ส่งข้อความมาได้เลยครับ',
              'Ran into a bug, an export issue, or have a feature idea? Send a quick note below.',
            )}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-ink">
            {t('1. เลือกประเภทเรื่อง', '1. Topic')}
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {categories.map((item) => {
              const active = category === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCategory(item.value);
                    if (status === 'success' || status === 'error') setStatus('idle');
                  }}
                  className={`min-h-[40px] cursor-pointer rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-ig-blue bg-ig-blue text-ig-blue-ink'
                      : 'border-rule-2 bg-paper-3 text-ink-2 hover:border-ink hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="feedback-details" className="block text-sm font-medium text-ink">
            {t('2. รายละเอียด', '2. Details')}
          </label>
          <textarea
            id="feedback-details"
            rows={4}
            required
            maxLength={2000}
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              if (status === 'success' || status === 'error') setStatus('idle');
            }}
            placeholder={t(
              'อธิบายปัญหาที่เจอหรือฟีเจอร์ที่อยากให้เพิ่ม เช่น ขั้นตอนที่ติดขัด หรือสิ่งที่อยากให้ปรับ…',
              'Describe the issue or feature idea…',
            )}
            className="mt-2 w-full rounded-md border border-rule-2 bg-paper-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-muted">
            {t(
              'กรุณาไม่ใส่รหัสผ่านหรือข้อมูลส่วนตัวในข้อความนี้',
              'Please don’t include passwords or personal data in this message.',
            )}
          </p>
        </div>

        <div>
          <NormalButton
            type="submit"
            variant="primary"
            disabled={status === 'submitting' || details.trim().length === 0}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('กำลังส่งข้อความ…', 'Sending…')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                {t('ส่งข้อเสนอแนะ', 'Send feedback')}
              </>
            )}
          </NormalButton>
        </div>

        {status === 'success' && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-[10px] border border-ok bg-ok-soft px-4 py-3 text-sm font-medium text-ok"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {t(
                'ส่งข้อเสนอแนะเรียบร้อยแล้ว ขอบคุณที่ช่วยปรับปรุง IG Follow Analyzer ครับ',
                'Feedback sent. Thank you for helping improve IG Follow Analyzer.',
              )}
            </span>
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-[10px] border border-bad bg-bad-soft px-4 py-3 text-sm font-medium text-bad"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {t(
                'ไม่สามารถส่งได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
                'Couldn’t send right now. Please try again.',
              )}
            </span>
          </div>
        )}
      </form>
    </section>
  );
}
