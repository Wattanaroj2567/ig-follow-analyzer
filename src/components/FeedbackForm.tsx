import { AlertCircle, ChevronDown, MessageSquarePlus, Send } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { useLanguage } from '../lib/language';
import { privacyHref } from '../lib/routes';
import { NormalButton } from './NormalButton';

const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSfADGFKA0leHNh2CpRZnpi5B-5CFwApo5m-OJcHfu8hgJlnpA/formResponse';

const ENTRY_CATEGORY = 'entry.1729969809';
const ENTRY_DETAILS = 'entry.1974617888';
const ENTRY_DEVICE = 'entry.2106459818';
const DETAILS_LIMIT = 500;

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
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('แจ้งปัญหา');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const deviceField = useRef<HTMLInputElement>(null);
  const canSubmit = details.trim().length > 0 && details.length <= DETAILS_LIMIT;

  const categories: { value: FeedbackCategory; label: string }[] = [
    { value: 'แจ้งปัญหา', label: t('แจ้งปัญหา', 'Report a bug') },
    { value: 'เสนอฟีเจอร์', label: t('เสนอฟีเจอร์', 'Suggest a feature') },
    { value: 'อื่นๆ', label: t('อื่นๆ', 'Other') },
  ];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const device = deviceField.current;
    if (!canSubmit || !device) {
      e.preventDefault();
      return;
    }
    device.value = `${detectDeviceSummary()} · ${window.innerWidth}×${window.innerHeight}`;
    setSubmitted(true);
  };

  return (
    <section
      id="feedback"
      aria-labelledby="feedback-h"
      className="mt-8 scroll-mt-24 rounded-[10px] border border-rule bg-paper-2"
    >
      <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-3">
          <MessageSquarePlus
            className="mt-0.5 size-6 shrink-0 text-cool"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <div>
            <h2 id="feedback-h" className="text-xl text-ink">
              {t('แจ้งปัญหาหรือเสนอแนะฟีเจอร์', 'Send feedback or report an issue')}
            </h2>
            <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-muted">
              {t(
                'หากพบปัญหาการใช้งาน อัปโหลดไฟล์ไม่ได้ หรืออยากเสนอฟีเจอร์เพิ่มเติม ส่งข้อความมาได้เลยครับ',
                'Ran into a bug, an export issue, or have a feature idea? Send a quick note below.',
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--secondary shrink-0"
          aria-expanded={isOpen}
          aria-controls="feedback-form"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen
            ? t('ซ่อนแบบฟอร์มแจ้งปัญหา', 'Hide feedback form')
            : t('เปิดแบบฟอร์มแจ้งปัญหา', 'Open feedback form')}
          <ChevronDown
            className={`size-4 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <form
        action={GOOGLE_FORM_ACTION}
        method="post"
        target="_blank"
        id="feedback-form"
        aria-labelledby="feedback-h"
        hidden={!isOpen}
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 border-t border-rule p-6 sm:p-8"
      >
        <input type="hidden" name={ENTRY_CATEGORY} value={category} />
        <input type="hidden" name={ENTRY_DETAILS} value={details.trim()} />
        <input type="hidden" name={ENTRY_DEVICE} ref={deviceField} />
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
                    setSubmitted(false);
                  }}
                  className={`min-h-10 cursor-pointer rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
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
            rows={3}
            required
            maxLength={DETAILS_LIMIT}
            aria-describedby="feedback-privacy feedback-character-count"
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              setSubmitted(false);
            }}
            placeholder={t(
              'อธิบายปัญหาที่เจอหรือฟีเจอร์ที่อยากให้เพิ่ม เช่น ขั้นตอนที่ติดขัด หรือสิ่งที่อยากให้ปรับ…',
              'Describe the issue or feature idea…',
            )}
            className="feedback-details mt-2 min-h-20 max-h-40 w-full field-sizing-content resize-none overflow-y-auto rounded-md border border-rule-2 bg-paper-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted">
            <p id="feedback-privacy">
              {t(
                'กรุณาไม่ใส่รหัสผ่านหรือข้อมูลส่วนตัวในข้อความนี้',
                'Please don’t include passwords or personal data in this message.',
              )}
            </p>
            <p id="feedback-character-count" className="ml-auto tabular-nums">
              {details.length} / {DETAILS_LIMIT} {t('ตัวอักษร', 'characters')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <NormalButton type="submit" variant="primary" disabled={!canSubmit}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {t('ส่งผ่าน Google Forms (เปิดแท็บใหม่)', 'Send via Google Forms (opens a new tab)')}
          </NormalButton>
          <p className="text-xs text-muted">
            {t(
              'เราส่งข้อความและข้อมูลเบราว์เซอร์ไปยัง Google Forms เพื่อช่วยตรวจปัญหา',
              'We send your message and browser details to Google Forms to help investigate issues.',
            )}{' '}
            <a
              href={privacyHref('feedback-data')}
              className="font-medium text-cool underline underline-offset-4 hover:text-ink"
            >
              {t('อ่านวิธีที่เราใช้ข้อมูลข้อเสนอแนะ', 'See how we use your feedback data')}
            </a>
          </p>
        </div>

        {submitted && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-[10px] border border-rule bg-paper-3 px-4 py-3 text-sm text-ink"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t(
              'ตรวจผลการส่งในแท็บ Google Forms ร่างยังอยู่ในหน้านี้',
              'Check the Google Forms tab for the submission result. Your draft is still here.',
            )}
          </p>
        )}
      </form>
    </section>
  );
}
