import { Send, Star } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { useLanguage } from '../lib/language';
import { getReviewBrowserId, getReviewEditUrl } from '../lib/review';
import { NormalButton } from './NormalButton';

const RATING_OPTIONS = [1, 2, 3, 4, 5];
const COMMENT_LIMIT = 500;
const NAME_LIMIT = 80;
const INPUT_CLASS =
  'w-full rounded-md border border-rule-2 bg-paper-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-hidden';

export function ReviewForm({ endpoint }: { endpoint?: string }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mayPublish, setMayPublish] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'duplicate' | 'error'>('idle');
  const [editUrl, setEditUrl] = useState<string>();
  const browserId = useRef<string | undefined>(undefined);
  const sending = useRef(false);
  const trimmedName = displayName.trim();
  const canSubmit = rating > 0 && trimmedName.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!endpoint || !canSubmit || sending.current || status === 'sent' || status === 'duplicate')
      return;
    sending.current = true;
    setStatus('sending');

    try {
      browserId.current ??= getReviewBrowserId(endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        body: new URLSearchParams({
          rating: String(rating),
          comment: comment.trim(),
          displayName: trimmedName,
          mayPublish: String(mayPublish),
          browserId: browserId.current,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const result: unknown = response.ok ? await response.json() : null;
      if (typeof result !== 'object' || !result || !('ok' in result) || result.ok !== true) {
        setStatus('error');
        return;
      }
      setRating(0);
      setComment('');
      setDisplayName('');
      setMayPublish(false);
      setEditUrl('editUrl' in result ? getReviewEditUrl(result.editUrl) : undefined);
      setStatus('duplicate' in result && result.duplicate === true ? 'duplicate' : 'sent');
    } catch {
      setStatus('error');
    } finally {
      sending.current = false;
    }
  }

  if (status === 'sent' || status === 'duplicate') {
    return (
      <div className="space-y-2 rounded-md bg-ok-soft p-4 text-sm text-ok">
        <p role="status" className="font-medium">
          {status === 'duplicate'
            ? t(
                'เบราว์เซอร์นี้ส่งคะแนนแล้ว ใช้ลิงก์ที่บันทึกไว้เพื่อแก้รีวิวเดิม',
                'This browser has already rated. Use your saved link to edit the existing review.',
              )
            : t(
                'บันทึกรีวิวแล้ว ขอบคุณที่สละเวลาให้คะแนนครับ',
                'Review saved. Thank you for rating your experience.',
              )}
        </p>
        {editUrl && (
          <p>
            <a
              href={editUrl}
              rel="noreferrer"
              className="font-semibold underline underline-offset-4"
            >
              {t('แก้รีวิวใน Google Forms', 'Edit your review in Google Forms')}
            </a>
            {' · '}
            {t(
              'เก็บลิงก์นี้ไว้เพื่อแก้ภายหลัง ผู้ที่มีลิงก์จะใช้แก้คำตอบได้',
              'Keep this link private to edit later. Anyone with it can edit the response.',
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <form aria-labelledby="review-heading" onSubmit={(event) => void handleSubmit(event)}>
      <fieldset disabled={status === 'sending'} className="min-w-0 space-y-5">
        <fieldset className="min-w-0" aria-describedby="review-rating-hint">
          <legend className="text-sm font-semibold text-ink">
            {t('ให้คะแนนการใช้งาน', 'Rate your experience')}{' '}
            <span className="font-normal text-muted">{t('(จำเป็น)', '(required)')}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RATING_OPTIONS.map((value) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="review-rating"
                  value={value}
                  required
                  checked={rating === value}
                  onClick={() => {
                    if (rating === value) setRating(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === ' ' && rating === value) {
                      event.preventDefault();
                      setRating(0);
                    }
                  }}
                  onChange={() => setRating(value)}
                  className="peer sr-only"
                />
                <span
                  className={`flex min-h-12 min-w-11 flex-col items-center justify-center rounded-md border text-xs font-semibold outline-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cool ${
                    rating === value
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-rule-2 bg-paper-3 text-ink-2 hover:border-accent'
                  }`}
                >
                  <Star
                    size={17}
                    className={value <= rating ? 'fill-current text-accent' : 'text-muted'}
                    aria-hidden="true"
                  />
                  <span aria-hidden="true">{value}</span>
                  <span className="sr-only">
                    {t(`${value} ดาว`, `${value} ${value === 1 ? 'star' : 'stars'}`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p id="review-rating-hint" className="mt-1.5 text-xs text-muted">
            {t('กดดาวที่เลือกซ้ำเพื่อยกเลิกคะแนน', 'Select the same star again to clear the rating.')}
          </p>
        </fieldset>

        <div>
          <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-ink">
            {t('เล่าประสบการณ์สั้น ๆ', 'Tell us about your experience')}
          </label>
          <textarea
            id="review-comment"
            rows={3}
            maxLength={COMMENT_LIMIT}
            aria-describedby="review-privacy review-count"
            className={`${INPUT_CLASS} feedback-details max-h-40 min-h-20 field-sizing-content resize-none overflow-y-auto`}
            value={comment}
            placeholder={t(
              'ส่วนไหนช่วยคุณได้ หรือส่วนไหนยังใช้งานยาก?',
              'What helped you, or what was hard to use?',
            )}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="mt-1 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted">
            <p id="review-privacy">
              {t(
                'กรุณาเว้นข้อมูลส่วนตัวและรหัสผ่าน',
                'Please leave out personal information and passwords.',
              )}
            </p>
            <p id="review-count" className="tabular-nums">
              {comment.length} / {COMMENT_LIMIT} {t('ตัวอักษร', 'characters')}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="review-name" className="mb-2 block text-sm font-semibold text-ink">
            {t('ชื่อที่ต้องการให้แสดง', 'Display name')}{' '}
            <span className="font-normal text-muted">{t('(จำเป็น)', '(required)')}</span>
          </label>
          <input
            id="review-name"
            type="text"
            required
            maxLength={NAME_LIMIT}
            className={INPUT_CLASS}
            value={displayName}
            placeholder={t('ใช้ชื่อเล่นหรือนามแฝงได้', 'You can use a nickname or alias')}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={mayPublish}
            onChange={(event) => setMayPublish(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-accent"
          />
          <span>
            {t(
              'อนุญาตให้นำข้อความและชื่อที่กรอกไว้ไปแสดงบนเว็บเมื่อผ่านการคัดกรองอัตโนมัติ',
              'You may publish my comment and display name if they pass automated screening.',
            )}
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <NormalButton type="submit" disabled={!endpoint || !canSubmit || status === 'sending'}>
            <Send className="size-4" aria-hidden="true" />
            {status === 'sending' ? t('กำลังส่ง…', 'Sending…') : t('ส่งรีวิว', 'Send review')}
          </NormalButton>
          <p className="text-xs text-muted">
            {endpoint
              ? t(
                  'คำตอบจะถูกบันทึกใน Google Forms เว็บไซต์ใช้รหัสสุ่มประจำเบราว์เซอร์เพื่อกันคะแนนซ้ำ',
                  'Your answers are saved in Google Forms. The site uses a random browser ID to prevent duplicate ratings.',
                )
              : t('ยังไม่เปิดรับรีวิวในขณะนี้', 'Review submissions are currently unavailable.')}
          </p>
        </div>
      </fieldset>
      {status === 'error' && (
        <p role="alert" className="mt-4 rounded-md bg-bad-soft p-3 text-sm text-bad">
          {t(
            'ยังยืนยันการบันทึกไม่ได้ คำตอบของคุณยังอยู่ในฟอร์ม',
            'We couldn’t confirm that your review was saved. Your answers are still in the form.',
          )}
        </p>
      )}
    </form>
  );
}
