import { ChevronDown, FolderSearch, Laptop, Smartphone } from 'lucide-react';
import { type Translator, useLanguage } from '../lib/language';
import { useId, useState } from 'react';

const getDevices = (t: Translator) =>
  [
    { id: 'mobile', label: t('มือถือ', 'Mobile'), Icon: Smartphone },
    { id: 'pc', label: t('คอมพิวเตอร์', 'Desktop'), Icon: Laptop },
  ] as const;

export function UploadFileGuide() {
  const { t } = useLanguage();
  const devices = getDevices(t);
  const guideId = useId();
  const [device, setDevice] = useState<(typeof devices)[number]['id']>('mobile');

  return (
    <details className="group/file-guide min-w-0 rounded-[10px] border border-rule bg-paper-2">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2.5 rounded-[10px] px-4 py-3 font-medium text-ink hover:bg-paper-3 sm:px-6 [&::-webkit-details-marker]:hidden">
        <FolderSearch className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <span className="flex-1">{t('ดูวิธีหาไฟล์ที่ดาวน์โหลดไว้', 'Find your downloaded ZIP')}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted group-open/file-guide:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-rule px-4 pt-4 pb-5 sm:px-6">
        <p className="text-sm leading-relaxed text-ink-2">
          {t('กด ', 'Select ')}
          <strong className="text-ink">
            {t('เลือกไฟล์ .ZIP จากเครื่อง', 'Choose a ZIP from your device')}
          </strong>
          {t(' แล้วหาไฟล์ชื่อคล้าย', ', then look for a file named like')}{' '}
          <code className="measured font-semibold">instagram-…zip</code>
          {t(' ตามตำแหน่งด้านล่าง', ' in one of the locations below.')}
        </p>

        <div
          className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-rule bg-paper-3 p-1"
          role="group"
          aria-label={t('เลือกอุปกรณ์เพื่อดูวิธีหาไฟล์', 'Choose a device to see where files are saved')}
        >
          {devices.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              aria-controls={`${guideId}-${id}`}
              onClick={() => setDevice(id)}
              className={`flex min-h-[44px] min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium transition-colors ${
                device === id
                  ? 'bg-accent text-accent-ink'
                  : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="wrap-anywhere">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-1 text-sm leading-relaxed text-ink-2">
          <dl
            id={`${guideId}-mobile`}
            inert={device !== 'mobile'}
            className={`col-start-1 row-start-1 divide-y divide-rule ${device !== 'mobile' ? 'invisible' : ''}`}
          >
            <div className="py-3">
              <dt className="font-semibold text-ink">iPhone</dt>
              <dd className="mt-1">
                {t('แตะ ', 'Tap ')}
                <strong className="text-ink">{t('เลือกไฟล์ (Choose File)', 'Choose File')}</strong>
                {t(' แล้วดูในโฟลเดอร์', ', then open the')}{' '}
                <strong className="text-ink">{t('ดาวน์โหลด (Downloads)', 'Downloads')}</strong>
                {t(
                  ' ในแอปไฟล์ ถ้าบันทึกไว้ที่ Chrome หรือ Google Drive ให้เปิดตำแหน่งนั้น',
                  ' folder in the Files app. If you saved it in Chrome or Google Drive, look there instead.',
                )}
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-semibold text-ink">Android</dt>
              <dd className="mt-1">
                {t('เปิด ', 'Open ')}
                <strong className="text-ink">{t('ไฟล์ (Files)', 'Files')}</strong>
                {t(' แล้วดูใน', ' and look in')}{' '}
                <strong className="text-ink">{t('ดาวน์โหลด (Downloads)', 'Downloads')}</strong>
                {t(' หรือ Drive ที่บันทึกไว้', ' or the Drive folder where you saved the ZIP.')}
              </dd>
            </div>
          </dl>
          <dl
            id={`${guideId}-pc`}
            inert={device !== 'pc'}
            className={`col-start-1 row-start-1 divide-y divide-rule ${device !== 'pc' ? 'invisible' : ''}`}
          >
            <div className="py-3">
              <dt className="font-semibold text-ink">
                {t('Windows และ macOS', 'Windows and macOS')}
              </dt>
              <dd className="mt-1">
                {t('เปิดโฟลเดอร์ ', 'Open your ')}
                <strong className="text-ink">{t('ดาวน์โหลด (Downloads)', 'Downloads')}</strong>
                {t(
                  ' หรือโฟลเดอร์ที่บันทึกไฟล์ไว้ แล้วเลือกไฟล์',
                  ' folder or wherever you saved the ZIP, then select it.',
                )}
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-semibold text-ink">
                {t('ถ้า Safari แตกไฟล์เป็นโฟลเดอร์', 'If Safari unzipped the file')}
              </dt>
              <dd className="mt-1">
                {t(
                  'ใช้ ZIP เดิมถ้ายังมีอยู่ หรือคลิกขวาที่โฟลเดอร์แล้วเลือก',
                  'Use the original ZIP if you still have it. Otherwise, right-click the folder and choose',
                )}{' '}
                <strong className="text-ink">{t('บีบอัด (Compress)', 'Compress')}</strong>
                {t(' ให้เป็น ZIP อีกครั้ง', ' to make a ZIP again.')}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 border-t border-rule pt-4">
          <h2 className="text-sm font-semibold text-ink">
            {t('รูปแบบข้อมูลที่รองรับ', 'Supported formats')}
          </h2>
          <dl className="mt-2 text-sm text-ink-2">
            <div className="rounded-lg bg-ok-soft px-3 py-2.5">
              <dt className="font-semibold text-ok">{t('JSON · แนะนำ', 'JSON · Recommended')}</dt>
              <dd className="mt-0.5 leading-relaxed">
                {t(
                  'อ่านรายชื่อและวันที่ติดตามทั้งสองฝั่งเมื่อมีข้อมูล และช่วยเตือนเมื่อไฟล์อาจมีข้อมูลแค่ 1 ปีล่าสุด',
                  'Includes account lists and follow dates when available. Dates help flag exports that may cover only the past year.',
                )}
              </dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-semibold text-ink">
                {t('HTML · เฉพาะรายชื่อ', 'HTML · Account lists only')}
              </dt>
              <dd className="mt-0.5 leading-relaxed">
                {t(
                  'ใช้วิเคราะห์ความสัมพันธ์จากรายชื่อในไฟล์ได้',
                  'You can still compare the account lists in the export.',
                )}
              </dd>
            </div>
          </dl>

          <details className="group border-t border-rule text-sm">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 py-2 font-medium text-ink [&::-webkit-details-marker]:hidden">
              {t('ข้อมูลในไฟล์และประวัติหลายบัญชี', 'Export data and history for multiple accounts')}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="list-disc space-y-1.5 pb-2 pl-5 leading-relaxed text-ink-2">
              <li>
                {t(
                  'รายชื่ออิงจากวันที่ส่งออก เว็บอ่านเฉพาะรายชื่อและข้ามรูปกับวิดีโอ',
                  'Lists reflect the time of export. Photos and videos are skipped.',
                )}
              </li>
              <li>
                {t(
                  'เก็บชื่อ ZIP เดิมไว้เพื่อให้เว็บแยกประวัติของแต่ละบัญชีได้เมื่อเปิดใช้ประวัติ',
                  'Keep the original ZIP filename so the app can separate each account’s history if you turn on history.',
                )}
              </li>
            </ul>
          </details>
        </div>
      </div>
    </details>
  );
}
