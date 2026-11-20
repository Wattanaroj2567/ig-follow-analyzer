import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  FileCode2,
  Folder,
  Globe,
  HardDrive,
  Home,
  Image,
  ListFilter,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '../lib/language';

interface MobileMockupProps {
  inAppSheet?: boolean;
  children: ReactNode;
}

function MobileDeviceFrame({ inAppSheet, children }: MobileMockupProps) {
  return (
    <figure className="guide-device-phone" aria-hidden="true">
      <div
        className={`guide-device-phone__screen${inAppSheet ? ' guide-device-phone__screen--app' : ''}`}
      >
        <div
          className={`guide-device-phone__status flex h-9 items-center justify-between px-4 ${inAppSheet ? 'text-white' : 'text-ig-light-ink'}`}
        >
          <span className="measured text-[11px] font-semibold tracking-tight">08:07</span>

          <div className="flex items-center gap-1.5">
            <svg
              viewBox="0 0 14 10"
              className="h-2.5 w-3.5 shrink-0"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="0" y="6.5" width="2.4" height="3.5" rx="0.7" />
              <rect x="3.8" y="4.5" width="2.4" height="5.5" rx="0.7" />
              <rect x="7.6" y="2.2" width="2.4" height="7.8" rx="0.7" />
              <rect x="11.4" y="0" width="2.4" height="10" rx="0.7" />
            </svg>

            <span className="text-[10px] font-medium">5G</span>

            <span className="inline-flex items-center gap-[1.5px]">
              <span className="grid h-[11px] w-[19px] place-items-center rounded-[3.5px] bg-current">
                <span
                  className={`measured text-[8px] leading-none font-semibold ${inAppSheet ? 'text-neutral-950' : 'text-ig-light-bg'}`}
                >
                  76
                </span>
              </span>
              <span className="h-[4px] w-[1.5px] rounded-r-full bg-current/50" />
            </span>
          </div>
        </div>

        <div className={inAppSheet ? 'guide-device-phone__sheet' : undefined}>
          <div className="p-3 text-left text-xs text-ig-light-ink">
            {inAppSheet && <ChevronLeft className="mb-2 h-5 w-5 -translate-x-1" />}
            {children}
          </div>
          <div className="py-2">
            <div className="mx-auto h-1 w-24 rounded-full bg-ig-light-ink/70" />
          </div>
        </div>
      </div>
    </figure>
  );
}

interface DesktopDeviceFrameProps {
  address?: string;
  children: ReactNode;
}

function DesktopDeviceFrame({
  address = 'accountscenter.instagram.com',
  children,
}: DesktopDeviceFrameProps) {
  const { t } = useLanguage();

  return (
    <figure className="guide-device-desktop" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-ig-dark-rule bg-ig-dark-surface px-4 py-2 text-[11px] text-ig-dark-muted">
        <span className="measured inline-flex items-center gap-1.5 text-ig-dark-ink">
          <Globe className="h-3.5 w-3.5 text-ig-dark-muted" />
          {address}
        </span>
        <span>{t('โหมดเดสก์ท็อป', 'Desktop mode')}</span>
      </div>
      <div className="bg-ig-dark-bg p-4 text-left text-xs text-ig-dark-ink">{children}</div>
    </figure>
  );
}

export function MobileProfileMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <div className="flex items-center justify-between border-b border-ig-light-rule pb-2">
        <Plus className="h-4 w-4 text-ig-light-ink" />
        <span className="text-sm font-medium">somchai.demo</span>
        <span className="guide-highlight-row inline-flex items-center gap-1 px-2 py-1 text-ig-light-ink">
          <Menu className="h-4 w-4" />
          <span className="text-[10px] font-medium">{t('แตะ 1', 'Tap 1')}</span>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ig-light-surface text-ig-light-muted">
          <User className="h-6 w-6" />
        </div>
        <div className="grid flex-1 grid-cols-3 text-center">
          <div>
            <p className="measured font-medium">12</p>
            <p className="text-[10px] text-ig-light-muted">{t('โพสต์', 'Posts')}</p>
          </div>
          <div>
            <p className="measured font-medium">320</p>
            <p className="text-[10px] text-ig-light-muted">{t('ผู้ติดตาม', 'Followers')}</p>
          </div>
          <div>
            <p className="measured font-medium">280</p>
            <p className="text-[10px] text-ig-light-muted">{t('กำลังติดตาม', 'Following')}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-ig-light-surface py-1.5 text-center text-[11px] font-medium">
          {t('แก้ไขโปรไฟล์', 'Edit profile')}
        </div>
        <div className="rounded-lg bg-ig-light-surface py-1.5 text-center text-[11px] font-medium">
          {t('แชร์โปรไฟล์', 'Share profile')}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1">
        <div className="aspect-square rounded bg-ig-light-surface" />
        <div className="aspect-square rounded bg-ig-light-surface" />
        <div className="aspect-square rounded bg-ig-light-surface" />
      </div>

      <div className="mt-3 flex items-center justify-around border-t border-ig-light-rule pt-2 text-ig-light-muted">
        <Home className="h-4 w-4" />
        <Search className="h-4 w-4" />
        <Plus className="h-4 w-4" />
        <span className="guide-highlight-row inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium">
          <User className="h-3.5 w-3.5" />
          {t('โปรไฟล์', 'Profile')}
        </span>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileSettingsMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm font-medium text-ig-light-muted">&lt;</span>
        <span className="text-sm font-medium">
          {t('การตั้งค่าและกิจกรรม', 'Settings and activity')}
        </span>
        <span className="w-4" />
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-ig-light-surface px-3 py-1.5 text-ig-light-muted">
        <Search className="h-3.5 w-3.5" />
        <span className="text-[11px]">{t('ค้นหา', 'Search')}</span>
      </div>

      <p className="mt-3 text-[11px] font-medium text-ig-light-muted">
        {t('บัญชีของคุณ', 'Your account')}
      </p>

      <div className="guide-highlight-row mt-1.5 flex items-center justify-between gap-2 p-2.5">
        <div className="flex items-start gap-2.5">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-ig-light-ink" />
          <div>
            <p className="font-medium text-ig-light-ink">{t('ศูนย์บัญชี', 'Accounts Center')}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-ig-light-muted">
              {t(
                'รหัสผ่าน, การรักษาความปลอดภัย, รายละเอียดส่วนตัว, การใช้งานแบบเชื่อมต่อระหว่างแอพ',
                'Password, security, personal details and connected experiences',
              )}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ig-light-ink" />
      </div>

      <p className="mt-3 text-[11px] font-medium text-ig-light-muted">
        {t('วิธีที่คุณใช้ Instagram', 'How you use Instagram')}
      </p>
      <div className="mt-1.5 space-y-1.5 text-[11px] text-ig-light-muted">
        <div className="flex items-center justify-between rounded-lg bg-ig-light-surface px-2.5 py-1.5">
          <span>{t('บันทึกแล้ว', 'Saved')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-ig-light-surface px-2.5 py-1.5">
          <span>{t('คลัง', 'Archive')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-ig-light-surface px-2.5 py-1.5">
          <span>{t('กิจกรรมของคุณ', 'Your activity')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileAccountsCenterMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <div className="flex items-center justify-between pb-1">
        <span className="text-sm font-medium text-ig-light-muted">✕</span>
        <span className="text-xs font-medium text-ig-light-muted">
          {t('การตั้งค่าบัญชี', 'Account settings')}
        </span>
        <span className="w-4" />
      </div>

      <div className="text-center">
        <p className="text-base font-medium">{t('ศูนย์บัญชี', 'Accounts Center')}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-ig-light-muted">
          {t(
            'จัดการการใช้งานแบบเชื่อมต่อระหว่างแอพและการตั้งค่าบัญชี',
            'Manage connected experiences and account settings',
          )}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-lg border border-ig-light-rule bg-ig-light-surface px-3 py-2">
        <div>
          <p className="text-[11px] font-medium">
            {t('โปรไฟล์และรายละเอียดส่วนตัว', 'Profiles and personal details')}
          </p>
          <p className="text-[10px] text-ig-light-muted">somchai.demo</p>
        </div>
        <ChevronRight className="h-4 w-4 text-ig-light-muted" />
      </div>

      <div className="mt-2.5 space-y-1 rounded-lg border border-ig-light-rule bg-ig-light-bg p-1.5 text-[11px]">
        <div className="flex items-center justify-between rounded-md px-2 py-2 text-ig-light-muted">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('รหัสผ่านและการรักษาความปลอดภัย', 'Password and security')}
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center justify-between rounded-md px-2 py-2 text-ig-light-muted">
          <span>{t('การใช้งานแบบเชื่อมต่อระหว่างแอพ', 'Connected experiences')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
        <div className="guide-highlight-row flex items-center justify-between px-2.5 py-2 font-medium">
          <span>{t('ข้อมูลและสิทธิ์การอนุญาตของคุณ', 'Your information and permissions')}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
        <div className="flex items-center justify-between rounded-md px-2 py-2 text-ig-light-muted">
          <span>{t('การกำหนดลักษณะโฆษณา', 'Ad preferences')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobilePermissionsMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <p className="text-[11px] font-medium text-ig-light-muted">&lt;</p>
      <p className="mt-1 text-base font-medium">
        {t('ข้อมูลและสิทธิ์การอนุญาตของคุณ', 'Your information and permissions')}
      </p>
      <div className="mt-2 rounded-lg border border-ig-light-rule bg-ig-light-surface p-2.5 text-[10px] text-ig-light-muted">
        {t(
          'หากต้องการดาวน์โหลดหรือโอนสำเนาข้อมูลของคุณ ให้ไปที่ "ส่งออกข้อมูลของคุณ"',
          'To download or transfer a copy, go to “Export your information”.',
        )}
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="guide-highlight-row flex items-center justify-between px-3 py-2.5 font-medium">
          <span>{t('ส่งออกข้อมูลของคุณ', 'Export your information')}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-ig-light-rule px-3 py-2 text-[11px] text-ig-light-muted">
          <span>{t('ประวัติการค้นหา', 'Search history')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <p className="mt-3 text-[10px] text-ig-light-muted">
        {t('ดูหรือส่งออกข้อมูลและกิจกรรมของคุณบนแอพ', 'View or export your information and activity')}
      </p>
      <div className="mt-1.5 space-y-1 rounded-lg border border-ig-light-rule p-2 text-[10px] text-ig-light-muted">
        <div className="flex justify-between py-1">
          <span>{t('กิจกรรมของคุณนอกเทคโนโลยี', 'Your activity off Meta technologies')}</span>
          <ChevronRight className="h-3 w-3" />
        </div>
        <div className="flex justify-between py-1">
          <span>{t('การเชื่อมต่อแอพ', 'Apps and websites')}</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileExportMockup({
  state = 'create',
}: {
  state?: 'create' | 'pending' | 'ready';
}) {
  const { t } = useLanguage();
  const ready = state === 'ready';

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="text-lg font-semibold">{t('ส่งออกข้อมูลของคุณ', 'Export your information')}</p>
      <p className="mt-1.5 text-[11px] leading-snug">
        {t(
          'คุณสามารถส่งออกสำเนาข้อมูลของคุณไปยังบริการภายนอก หรือส่งออกไปยังอุปกรณ์ของคุณได้',
          'Export a copy of your information to your device or an external service.',
        )}
      </p>

      <div
        className={`mt-4 rounded-full bg-ig-blue py-2.5 text-center font-medium text-ig-blue-ink ${state === 'create' ? 'guide-highlight-btn' : ''}`}
      >
        {t('สร้างไฟล์ส่งออก', 'Create export')}
      </div>

      <div className="mt-4 grid grid-cols-2 text-center text-[11px] font-medium">
        <div className="border-b border-ig-light-ink px-1 pb-2">
          {t('กิจกรรมปัจจุบัน', 'Current activity')}
        </div>
        <div className="px-1 pb-2 text-ig-light-muted">{t('กิจกรรมที่ผ่านมา', 'Past activity')}</div>
      </div>

      {state !== 'create' && (
        <div className="mx-2 mt-4">
          <p className="font-semibold">
            {ready
              ? t('ไฟล์ที่พร้อมให้ดาวน์โหลด', 'Available downloads')
              : t('ส่งคำขอแล้ว', 'Request submitted')}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-ig-light-muted">
            {ready
              ? t(
                  'คุณจะมีเวลา 4 วันในการดาวน์โหลดไฟล์ลงในอุปกรณ์ของคุณ',
                  'You have four days to download the file to your device.',
                )
              : t('กำลังเตรียมข้อมูลของคุณเพื่อส่งออก', 'Preparing your information for export')}
          </p>

          <div className="mt-2.5 rounded-xl border border-ig-light-rule p-2.5">
            <div className="flex items-start gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ig-light-surface text-ig-light-muted">
                <User className="size-4" />
              </span>
              <div className="min-w-0 text-[10px] leading-snug text-ig-light-muted">
                <p className="text-[11px] font-semibold text-ig-light-ink">
                  somchai.demo (Instagram)
                </p>
                <p className="mt-0.5">{t('ผู้ติดตามและคนที่คุณติดตาม', 'Followers and following')}</p>
                <p>{t('1 ม.ค. 2553 – 20 พ.ย. 2569', 'Jan 1, 2010 – Nov 20, 2026')}</p>
                <p>{t('ส่งออกไปยังอุปกรณ์ · ครั้งเดียว · JSON', 'Export to device · One time · JSON')}</p>
                <p>
                  {ready
                    ? t('หมดอายุ 24 พ.ย. 2569 · ไม่เกิน 1 MB', 'Expires Nov 24, 2026 · Up to 1 MB')
                    : t('ส่งคำขอเมื่อ 20 พ.ย. 2569', 'Requested Nov 20, 2026')}
                </p>
              </div>
            </div>
            <div
              className={`mt-2.5 grid gap-2 text-center text-[11px] font-medium ${ready ? 'grid-cols-2' : ''}`}
            >
              {ready && (
                <div className="guide-highlight-btn rounded-full bg-ig-light-surface py-1.5">
                  {t('ดาวน์โหลด', 'Download')}
                </div>
              )}
              <div className="rounded-full bg-ig-light-surface py-1.5">{t('ยกเลิก', 'Cancel')}</div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 text-[10px] leading-snug text-ig-light-muted">
        {t(
          'ไฟล์ที่คุณส่งออกจะไม่รวมข้อมูลที่ผู้อื่นแชร์ เช่น รูปภาพของผู้อื่นที่มีการแท็กคุณ',
          "Your export excludes information shared by others, such as photos they've tagged you in.",
        )}
      </p>
    </MobileDeviceFrame>
  );
}

export function MobileSelectProfileMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="mt-1 text-base font-medium">{t('เลือกโปรไฟล์', 'Select profiles')}</p>
      <p className="mt-0.5 text-[10px] text-ig-light-muted">
        {t('เลือกโปรไฟล์เพื่อส่งออกข้อมูลของคุณ', 'Choose a profile to export your information')}
      </p>
      <p className="mt-2.5 text-[11px] font-medium">{t('โปรไฟล์', 'Profile')}</p>

      <div className="mt-1.5 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg border border-ig-light-rule px-3 py-2 text-ig-light-muted">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-ig-light-surface" />
            <div>
              <p className="text-[11px] font-medium text-ig-light-ink">
                {t('บัญชีเชื่อมต่ออื่น', 'Another connected account')}
              </p>
              <p className="text-[10px]">{t('โปรไฟล์ที่เชื่อมโยง', 'Linked profile')}</p>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>

        <div className="guide-highlight-row flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ig-light-bg text-ig-light-ink">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-ig-light-ink">somchai.demo</p>
              <p className="text-[10px] font-medium text-ig-light-muted">Instagram</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileDestinationMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="mt-1 text-[10px] text-ig-light-muted">somchai.demo (Instagram)</p>
      <p className="mt-0.5 text-base font-medium">
        {t('เลือกปลายทางเพื่อส่งออก', 'Choose where to export')}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-ig-light-muted">
        {t(
          'คุณสามารถส่งออกข้อมูลไปยังอุปกรณ์หรือบริการภายนอกได้',
          'You can export to your device or an external service.',
        )}
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="guide-highlight-row flex items-center justify-between px-3 py-3 font-medium">
          <span>{t('ส่งออกไปยังอุปกรณ์', 'Export to device')}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-ig-light-rule px-3 py-3 text-[11px] text-ig-light-muted">
          <span>{t('ส่งออกไปยังบริการภายนอก', 'Export to external service')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileConfirmExportMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="text-base font-medium">{t('ยืนยันการส่งออกของคุณ', 'Confirm your export')}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-ig-light-muted">
        {t(
          'เมื่อการส่งออกของคุณพร้อมแล้ว เราจะส่งการแจ้งเตือนถึงคุณ โดยคุณจะมีเวลา 4 วันเท่านั้นในการดาวน์โหลดไฟล์',
          "We'll notify you when your export is ready. You'll have four days to download it.",
        )}
      </p>

      <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-ig-light-rule bg-ig-light-surface p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ig-light-bg">
          <User className="h-4 w-4 text-ig-light-muted" />
        </div>
        <div>
          <p className="text-[11px] font-medium">somchai.demo</p>
          <p className="text-[10px] text-ig-light-muted">
            {t('Instagram · ส่งออกไปยังอุปกรณ์ · ครั้งเดียว', 'Instagram · Export to device · One time')}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-ig-light-rule px-2.5 py-2">
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-ig-light-muted" />
          <div>
            <p className="text-[10px] font-medium">
              {t('แจ้ง (แตะเปลี่ยนอีเมลได้)', 'Notify (tap to change email)')}
            </p>
            <p className="text-[10px] text-ig-light-muted">example@mail.example</p>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-ig-light-muted" />
      </div>

      <div className="mt-2 space-y-1 rounded-lg border border-ig-light-rule bg-ig-light-bg p-1.5">
        <div className="guide-highlight-row flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <ListFilter className="h-3.5 w-3.5 text-ig-blue" />
            <div>
              <p className="text-[11px] font-semibold">
                {t('1. ปรับแต่งข้อมูล', '1. Customize information')}
              </p>
              <p className="text-[10px] text-ig-light-muted">
                {t('เดิมเป็น: ข้อมูลที่มีทั้งหมด', 'Default: All available information')}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </div>

        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-ig-light-muted" />
            <div>
              <p className="text-[11px] font-medium">{t('2. ช่วงวันที่', '2. Date range')}</p>
              <p className="text-[10px] text-ig-light-muted">
                {t('เดิมเป็น: ปีที่แล้ว', 'Default: Last year')}
              </p>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-ig-light-muted" />
        </div>

        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-3.5 w-3.5 text-ig-light-muted" />
            <div>
              <p className="text-[11px] font-medium">{t('3. รูปแบบ', '3. Format')}</p>
              <p className="text-[10px] text-ig-light-muted">
                {t('เดิมเป็น: HTML', 'Default: HTML')}
              </p>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-ig-light-muted" />
        </div>

        <div className="flex items-center justify-between px-2 py-1.5 text-ig-light-muted">
          <div className="flex items-center gap-2">
            <Image className="h-3.5 w-3.5" />
            <div>
              <p className="text-[11px] font-medium text-ig-light-ink">
                {t('คุณภาพของสื่อ', 'Media quality')}
              </p>
              <p className="text-[10px]">{t('คุณภาพปานกลาง (ไม่ต้องแก้)', 'Medium (leave as is)')}</p>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileCustomizeDataMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="text-sm font-medium">
        {t('เลือกข้อมูลที่ต้องการส่งออก', 'Select information to export')}
      </p>

      {/* Top section showing ล้างทั้งหมด */}
      <div className="mt-2 rounded-lg border border-ig-light-rule bg-ig-light-surface/60 p-2">
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="font-medium text-ig-light-ink">
            {t('กิจกรรมบน Instagram ของคุณ', 'Your Instagram activity')}
          </span>
          <span className="guide-highlight-row px-1.5 py-0.5 text-[9px] font-semibold text-ig-blue">
            {t('กด ล้างทั้งหมด', 'Tap Clear all')}
          </span>
        </div>
        <p className="mt-1 text-[9px] text-ig-light-muted">
          {t(
            'และเลื่อนลงไปกด “ล้างทั้งหมด” ในหมวด ข้อมูลส่วนบุคคล ด้วย',
            'Scroll down and tap Clear all under Personal information too.',
          )}
        </p>
      </div>

      {/* Connections section (S__54272008) */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-ig-light-ink">
            {t('การเชื่อมต่อ (เลื่อนลงมาเจอหัวข้อนี้)', 'Connections (scroll down to find it)')}
          </span>
          <span className="text-[10px] font-medium text-ig-blue">{t('ล้างทั้งหมด', 'Clear all')}</span>
        </div>

        <div className="mt-1.5 space-y-1 rounded-lg border border-ig-light-rule bg-ig-light-bg p-1.5 text-[11px]">
          <div className="flex items-center justify-between px-2 py-1.5 text-ig-light-muted">
            <span>{t('ผู้ติดต่อ (เอาติ๊กออก)', 'Contacts (uncheck)')}</span>
            <span className="h-4 w-4 rounded border border-ig-light-rule bg-ig-light-bg" />
          </div>
          <div className="guide-highlight-row flex items-center justify-between px-2 py-1.5 font-medium">
            <span>{t('ผู้ติดตามและคนที่คุณติดตาม', 'Followers and following')}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded bg-ig-blue text-ig-blue-ink">
              <Check className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Bottom sections reminder (S__54272007 - 2006) */}
      <div className="mt-2 rounded-lg border border-dashed border-ig-light-rule bg-ig-light-surface p-2 text-[9px] leading-snug text-ig-light-muted">
        {t('↓ เลื่อนลงจนสุดแล้วกด', '↓ Scroll to the bottom and tap')}{' '}
        <strong className="text-ig-light-ink">{t('ล้างทั้งหมด', 'Clear all')}</strong>{' '}
        {t(
          'ในอีก 5 หมวดด้านล่างด้วย (ข้อมูลที่ลงบันทึกไว้, การรักษาความปลอดภัยฯ, แอพและเว็บไซต์นอก IG, การกำหนดลักษณะ, ข้อมูลโฆษณา)',
          'in the five remaining categories (Logged information, Security and login, Apps and websites, Preferences, and Ads information).',
        )}
      </div>

      <div className="guide-highlight-btn mt-2.5 rounded-full bg-ig-blue py-1.5 text-center text-xs font-medium text-ig-blue-ink">
        {t('บันทึก', 'Save')}
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileDateRangeMockup() {
  const { t } = useLanguage();
  const presets = [
    t('สัปดาห์ที่แล้ว', 'Last week'),
    t('เดือนที่แล้ว', 'Last month'),
    t('3 เดือนที่ผ่านมา', 'Last 3 months'),
    t('6 เดือนที่ผ่านมา', 'Last 6 months'),
    t('ปีที่แล้ว', 'Last year'),
    t('3 ปีที่ผ่านมา', 'Last 3 years'),
  ];

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="text-[11px]">somchai.demo · Instagram</p>
      <p className="mt-0.5 text-lg font-semibold">{t('ช่วงวันที่', 'Date range')}</p>

      <div className="mt-3 divide-y divide-ig-light-rule rounded-xl border border-ig-light-rule text-[11px]">
        {presets.map((label) => (
          <div key={label} className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span>{label}</span>
            <span className="size-4 shrink-0 rounded-full border border-ig-light-muted" />
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 bg-ig-light-highlight px-3 py-2.5 outline-2 -outline-offset-2 outline-accent">
          <div>
            <p className="font-semibold">{t('ตั้งแต่ต้น', 'All time')}</p>
            <p className="text-[10px] text-ig-light-muted">
              {t('อาจใช้เวลานานขึ้นเพื่อส่งออก', 'May take longer to export')}
            </p>
          </div>
          <span className="grid size-4 shrink-0 place-items-center rounded-full border-2 border-ig-blue">
            <span className="size-2 rounded-full bg-ig-blue" />
          </span>
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p>{t('กำหนดเอง', 'Custom')}</p>
              <p className="text-[10px] text-ig-light-muted">
                {t('20 พ.ย. 2568 – 20 พ.ย. 2569', 'Nov 20, 2025 – Nov 20, 2026')}
              </p>
            </div>
            <span className="size-4 shrink-0 rounded-full border border-ig-light-muted" />
          </div>
          <div className="mt-2 rounded-full bg-ig-light-surface py-1.5 text-center font-medium">
            {t('แก้ไข', 'Edit')}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-ig-light-rule pt-3">
        <div className="guide-highlight-btn rounded-full bg-ig-blue py-2 text-center font-medium text-ig-blue-ink">
          {t('บันทึก', 'Save')}
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileFormatAndStartMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame inAppSheet>
      <p className="text-[10px] text-ig-light-muted">somchai.demo · Instagram</p>
      <p className="mt-0.5 text-base font-medium">{t('รูปแบบ', 'Format')}</p>

      <div className="mt-2 space-y-1.5 rounded-lg border border-ig-light-rule bg-ig-light-bg p-2 text-[11px]">
        <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-ig-light-muted">
          <div>
            <p className="font-medium">HTML</p>
            <p className="text-[9px]">
              {t('ดูข้อมูลบนคอมพิวเตอร์แบบออฟไลน์', 'View information offline on your computer')}
            </p>
          </div>
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-ig-light-rule" />
        </div>

        <div className="guide-highlight-row flex items-center justify-between px-2 py-2">
          <div>
            <p className="font-semibold text-ig-light-ink">
              {t('JSON (แนะนำ)', 'JSON (recommended)')}
            </p>
            <p className="text-[9px] text-ig-light-muted">
              {t(
                'นำเข้าข้อมูลไปยังเว็บไซต์หรือแอพอื่นได้',
                'Import your information into another website or app',
              )}
            </p>
          </div>
          <span className="h-4 w-4 shrink-0 rounded-full border-4 border-ig-blue bg-ig-light-bg" />
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-ig-light-rule bg-ig-light-surface px-2.5 py-2 text-[10px] text-ig-light-muted">
        {t('กด', 'Tap')} <strong className="text-ig-light-ink">{t('บันทึก', 'Save')}</strong>{' '}
        {t(
          '→ กลับมาหน้ายืนยัน (คุณภาพของสื่อคงเดิมได้) แล้วเลื่อนลงกดปุ่มด้านล่าง',
          '→ Return to Confirm your export, keep Media quality as is, then scroll down and tap the button below.',
        )}
      </div>

      <div className="guide-highlight-btn mt-2.5 rounded-full bg-ig-blue py-2 text-center text-xs font-medium text-ig-blue-ink">
        {t('เริ่มส่งออก', 'Start export')}
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileOpenExternalBrowserMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame inAppSheet>
      <div className="opacity-55">
        <p className="text-sm font-medium">{t('ดาวน์โหลดไฟล์ของคุณ', 'Download your files')}</p>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-ig-light-rule bg-ig-light-bg p-2.5">
          <div>
            <p className="text-[11px] font-medium">somchai.demo</p>
            <p className="text-[10px] text-ig-light-muted">
              {t('ไฟล์ที่ 1 จาก 1 · ไม่เกิน 1 MB', 'File 1 of 1 · Up to 1 MB')}
            </p>
          </div>
          <span className="rounded-full bg-ig-light-surface px-3 py-1 text-[10px] font-medium">
            {t('ดาวน์โหลด', 'Download')}
          </span>
        </div>
      </div>

      {/* System Modal Overlay (S__54272032) */}
      <div className="mt-3 rounded-2xl border border-ig-light-rule bg-ig-light-bg p-3 text-center shadow-sm">
        <p className="text-xs font-semibold text-ig-light-ink">Instagram</p>
        <p className="mt-1 text-[10px] leading-snug text-ig-light-muted">
          {t(
            'คุณต้องการเปิดแอปภายนอก Instagram หรือไม่?',
            'Do you want to open an app outside Instagram?',
          )}
        </p>
        <div className="mt-2.5 space-y-1.5 border-t border-ig-light-rule pt-2">
          <div className="guide-highlight-row py-1.5 text-xs font-semibold text-ig-blue">
            {t('เปิด (Open)', 'Open')}
          </div>
          <div className="py-1 text-[11px] text-ig-light-muted">{t('ยกเลิก', 'Cancel')}</div>
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

const demoExportFileName = 'instagram-somchai.demo-2026.zip';

export function MobileBrowserDownloadBarMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <div className="h-40" />
      <div className="border-y border-ig-light-rule py-3">
        <p className="mb-1.5 text-[11px] font-semibold">
          {t('ดาวน์โหลดเสร็จสมบูรณ์', 'Download complete')}
        </p>
        <div className="flex items-center gap-2">
          <Download className="size-4 shrink-0 text-ig-light-muted" />
          <p className="measured min-w-0 text-[10px] break-all text-ig-light-muted">
            {demoExportFileName}
          </p>
          <span className="guide-highlight-row ml-auto shrink-0 px-2 py-1 text-[11px] font-semibold">
            {t('เปิดใน…', 'Open in…')}
          </span>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-full bg-ig-light-surface py-1.5 text-[11px] text-ig-light-muted">
        <Globe className="size-3" />
        about:blank
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileShareDownloadMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <div className="rounded-xl border border-ig-light-rule p-2.5">
        <div className="flex items-start gap-2">
          <FileArchive className="size-7 shrink-0 rounded-md bg-ig-light-surface p-1.5 text-ig-light-muted" />
          <div className="min-w-0 flex-1">
            <p className="measured text-[11px] font-semibold break-all">{demoExportFileName}</p>
            <p className="text-[10px] text-ig-light-muted">
              {t('ไฟล์ ZIP', 'ZIP archive')} · 169 KB
            </p>
          </div>
          <X className="size-4 shrink-0 text-ig-light-muted" />
        </div>

        <div className="my-3 flex items-center gap-2 border-y border-ig-light-rule px-1 py-2.5 text-[10px] text-ig-light-muted">
          <Download className="size-4 shrink-0" />
          {t('เปิดใน “ดาวน์โหลด”', 'Open in Downloads')}
        </div>
        <div className="guide-highlight-row flex items-center gap-2 px-2.5 py-2 text-[11px] font-semibold">
          <Folder className="size-4 shrink-0" />
          {t('บันทึกไปยัง แอปไฟล์', 'Save to Files')}
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

export function MobileSaveDestinationMockup() {
  const { t } = useLanguage();

  return (
    <MobileDeviceFrame>
      <div className="rounded-xl border border-ig-light-rule p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-semibold">
            <ChevronLeft className="size-4 shrink-0" />
            <span>{t('รายการดาวน์โหลด', 'Downloads')}</span>
            <ChevronDown className="size-3 shrink-0 text-ig-light-muted" />
          </span>
          <span className="guide-highlight-btn shrink-0 rounded-full bg-ig-blue px-3 py-1.5 text-[11px] font-semibold text-ig-blue-ink">
            {t('บันทึก', 'Save')}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-ig-light-surface px-2.5 py-1.5 text-[10px] text-ig-light-muted">
          <Search className="size-3.5 shrink-0" />
          {t('ค้นหา', 'Search')}
        </div>
        <div className="grid min-h-28 grid-cols-3 gap-2 pt-4 text-center text-[10px] text-ig-light-muted">
          <div>
            <Folder className="mx-auto mb-1.5 size-7" />
            {t('เอกสาร', 'Documents')}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-ig-light-rule bg-ig-light-surface px-2.5 py-2">
          <FileArchive className="size-5 shrink-0 text-ig-light-muted" />
          <div className="min-w-0">
            <p className="text-[10px] text-ig-light-muted">{t('บันทึกเป็น', 'Save as')}</p>
            <p className="measured text-[11px] font-medium break-all">{demoExportFileName}</p>
          </div>
        </div>
      </div>
    </MobileDeviceFrame>
  );
}

/* ---------------------------------------------------------------- Desktop Mockups */

export function DesktopMoreSettingsMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="instagram.com">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-5 flex flex-col justify-between rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-2.5">
          <div className="space-y-1.5 text-[11px] text-ig-dark-muted">
            <div className="px-2 py-1">{t('หน้าหลัก', 'Home')}</div>
            <div className="px-2 py-1">Reels</div>
            <div className="px-2 py-1">{t('ค้นหา', 'Search')}</div>
          </div>

          <div className="mt-3 rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-1.5">
            <div className="guide-highlight-row--dark flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium">
              <Settings className="h-3.5 w-3.5 shrink-0" />
              <span>{t('การตั้งค่า', 'Settings')}</span>
            </div>
            <div className="px-2 py-1 text-[10px] text-ig-dark-muted">
              {t('กิจกรรมของคุณ', 'Your activity')}
            </div>
            <div className="px-2 py-1 text-[10px] text-ig-dark-muted">{t('บันทึกไว้', 'Saved')}</div>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-md bg-ig-dark-bg px-2 py-1.5 text-[11px] font-medium text-ig-dark-ink">
            <Menu className="h-3.5 w-3.5" />
            <span>{t('เพิ่มเติม (มุมซ้ายล่าง)', 'More (bottom left)')}</span>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-center rounded-lg border border-ig-dark-rule bg-ig-dark-bg p-4 text-center">
          <p className="text-[11px] text-ig-dark-muted">{t('หน้าหลักและฟีด', 'Home and feed')}</p>
          <p className="mt-2 text-xs leading-relaxed text-ig-dark-muted">
            {t('คลิกไอคอน', 'Click')}{' '}
            <strong className="text-ig-dark-ink">{t('เพิ่มเติม (≡)', 'More (≡)')}</strong>{' '}
            {t('มุมซ้ายล่าง แล้วเลือก', 'at the bottom left, then select')}{' '}
            <strong className="text-accent">{t('การตั้งค่า', 'Settings')}</strong>
          </p>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopSettingsAccountsCenterMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="instagram.com/accounts/edit/">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-2.5">
          <p className="text-xs font-medium text-ig-dark-ink">{t('การตั้งค่า', 'Settings')}</p>
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-ig-dark-elevated px-2.5 py-1.5 text-[10px] text-ig-dark-muted">
            <Search className="h-3 w-3" />
            <span>{t('ค้นหา', 'Search')}</span>
          </div>
          <p className="mt-2.5 text-[10px] text-ig-dark-muted">{t('บัญชีของคุณ', 'Your account')}</p>
          <div className="guide-highlight-row--dark mt-1 p-2">
            <p className="text-[11px] font-medium text-accent">{t('ศูนย์บัญชี', 'Accounts Center')}</p>
            <p className="mt-0.5 text-[9px] leading-snug text-ig-dark-ink">
              {t(
                'รหัสผ่าน, การรักษาความปลอดภัย, รายละเอียดส่วนตัว',
                'Password, security and personal details',
              )}
            </p>
          </div>
          <p className="mt-2.5 text-[10px] text-ig-dark-muted">
            {t('วิธีที่คุณใช้ Instagram', 'How you use Instagram')}
          </p>
          <div className="mt-1 rounded-md bg-ig-dark-elevated px-2 py-1.5 text-[10px] text-ig-dark-ink">
            {t('แก้ไขโปรไฟล์', 'Edit profile')}
          </div>
        </div>

        <div className="col-span-6 rounded-lg border border-ig-dark-rule bg-ig-dark-bg p-3">
          <p className="text-xs font-medium text-ig-dark-ink">{t('แก้ไขโปรไฟล์', 'Edit profile')}</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-ig-dark-surface p-2.5">
            <div className="h-7 w-7 rounded-full bg-ig-dark-elevated" />
            <div>
              <p className="text-[11px] font-medium text-ig-dark-ink">somchai.demo</p>
              <p className="text-[10px] text-ig-dark-muted">{t('บัญชีตัวอย่าง', 'Sample account')}</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-ig-dark-muted">
            {t('คลิกกรอบ', 'Click')}{' '}
            <strong className="text-accent">{t('ศูนย์บัญชี', 'Accounts Center')}</strong>{' '}
            {t('ด้านซ้ายบนเพื่อเปิดการส่งออกข้อมูล', 'at the top left to open the export settings.')}
          </p>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopPermissionsMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-5 space-y-1 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-2.5 text-[10px]">
          <p className="pb-1 text-xs font-medium text-ig-dark-ink">
            {t('ศูนย์บัญชี', 'Accounts Center')}
          </p>
          <div className="rounded-md px-2 py-1.5 text-ig-dark-muted">
            {t('โปรไฟล์และรายละเอียดส่วนตัว', 'Profiles and personal details')}
          </div>
          <div className="rounded-md px-2 py-1.5 text-ig-dark-muted">
            {t('รหัสผ่านและการรักษาความปลอดภัย', 'Password and security')}
          </div>
          <div className="rounded-md bg-ig-dark-ink px-2 py-1.5 font-medium text-ig-dark-bg">
            {t('ข้อมูลและสิทธิ์การอนุญาตของคุณ', 'Your information and permissions')}
          </div>
          <div className="rounded-md px-2 py-1.5 text-ig-dark-muted">
            {t('การกำหนดลักษณะโฆษณา', 'Ad preferences')}
          </div>
        </div>

        <div className="col-span-7 rounded-lg border border-ig-dark-rule bg-ig-dark-bg p-3">
          <p className="text-xs font-medium text-ig-dark-ink">
            {t('ข้อมูลและสิทธิ์การอนุญาตของคุณ', 'Your information and permissions')}
          </p>
          <div className="mt-2 rounded-md border border-ig-dark-rule bg-ig-dark-surface px-2.5 py-2 text-[10px] text-ig-dark-muted">
            {t(
              'หากต้องการดาวน์โหลดหรือโอนสำเนาข้อมูลของคุณ ให้ไปที่ "ส่งออกข้อมูลของคุณ"',
              'To download or transfer a copy, go to “Export your information”.',
            )}
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="guide-highlight-row--dark flex items-center justify-between px-3 py-2.5 text-[11px] font-medium text-accent">
              <span>{t('ส่งออกข้อมูลของคุณ', 'Export your information')}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between rounded-md border border-ig-dark-rule bg-ig-dark-surface px-3 py-2 text-[10px] text-ig-dark-muted">
              <span>{t('ประวัติการค้นหา', 'Search history')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopCreateExportMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-4">
        <p className="text-sm font-medium text-ig-dark-ink">
          {t('ส่งออกข้อมูลของคุณ', 'Export your information')}
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-ig-dark-muted">
          {t(
            'คุณสามารถส่งออกสำเนาข้อมูลของคุณไปยังบริการภายนอก หรือส่งออกไปยังอุปกรณ์ของคุณได้',
            'Export a copy of your information to your device or an external service.',
          )}
        </p>

        <div className="guide-highlight-btn mt-3 rounded-full bg-ig-blue py-2 text-center text-xs font-medium text-ig-blue-ink">
          {t('สร้างไฟล์ส่งออก', 'Create export')}
        </div>

        <div className="mt-4 grid grid-cols-2 border-b border-ig-dark-rule text-center text-[11px] font-medium">
          <div className="border-b-2 border-ig-dark-ink pb-2 text-ig-dark-ink">
            {t('กิจกรรมปัจจุบัน', 'Current activity')}
          </div>
          <div className="pb-2 text-ig-dark-muted">{t('กิจกรรมที่ผ่านมา', 'Past activity')}</div>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopSelectProfileMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-4">
        <p className="text-sm font-medium text-ig-dark-ink">{t('เลือกโปรไฟล์', 'Select profiles')}</p>
        <p className="mt-0.5 text-[10px] text-ig-dark-muted">
          {t('เลือกโปรไฟล์เพื่อส่งออกข้อมูลของคุณ', 'Choose a profile to export your information')}
        </p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between rounded-lg border border-ig-dark-rule bg-ig-dark-surface px-3 py-2 text-[11px] text-ig-dark-muted">
            <div>
              <p className="font-medium text-ig-dark-ink">
                {t('บัญชีเชื่อมต่ออื่น', 'Another connected account')}
              </p>
              <p className="text-[10px]">{t('โปรไฟล์ที่เชื่อมโยง', 'Linked profile')}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>

          <div className="guide-highlight-row--dark flex items-center justify-between px-3 py-2.5 text-[11px]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <div>
                <p className="font-medium text-ig-dark-ink">somchai.demo</p>
                <p className="text-[10px] text-accent">Instagram</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-accent" />
          </div>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopDestinationMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-4">
        <p className="text-[10px] text-ig-dark-muted">somchai.demo · Instagram</p>
        <p className="mt-0.5 text-sm font-medium text-ig-dark-ink">
          {t('เลือกปลายทางเพื่อส่งออก', 'Choose where to export')}
        </p>
        <p className="mt-0.5 text-[10px] text-ig-dark-muted">
          {t(
            'คุณสามารถส่งออกข้อมูลไปยังอุปกรณ์หรือบริการภายนอกได้',
            'You can export to your device or an external service.',
          )}
        </p>

        <div className="mt-3 space-y-1.5">
          <div className="guide-highlight-row--dark flex items-center justify-between px-3 py-2.5 text-[11px] font-medium text-accent">
            <span>{t('ส่งออกไปยังอุปกรณ์', 'Export to device')}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-ig-dark-rule bg-ig-dark-surface px-3 py-2.5 text-[11px] text-ig-dark-muted">
            <span>{t('ส่งออกไปยังบริการภายนอก', 'Export to external service')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopConfirmExportMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-3.5">
        <p className="text-sm font-medium text-ig-dark-ink">
          {t('ยืนยันการส่งออกของคุณ', 'Confirm your export')}
        </p>
        <p className="mt-0.5 text-[10px] text-ig-dark-muted">
          {t(
            'คุณจะมีเวลา 4 วันเท่านั้นในการดาวน์โหลดไฟล์เพื่อเป็นการรักษาความปลอดภัย',
            'For security, you have four days to download your files.',
          )}
        </p>

        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-ig-dark-rule bg-ig-dark-surface px-3 py-2 text-[11px]">
          <div>
            <p className="font-medium text-ig-dark-ink">
              {t('แจ้ง (คลิกเปลี่ยนอีเมลได้)', 'Notify (click to change email)')}
            </p>
            <p className="text-[10px] text-ig-dark-muted">example@mail.example</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-ig-dark-muted" />
        </div>

        <div className="mt-2 space-y-1 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-1.5 text-[11px]">
          <div className="guide-highlight-row--dark flex items-center justify-between px-2.5 py-2">
            <div>
              <p className="font-semibold text-accent">
                {t('1. ปรับแต่งข้อมูล', '1. Customize information')}
              </p>
              <p className="text-[10px] text-ig-dark-muted">
                {t('เดิมเป็น: ข้อมูลที่มีทั้งหมด', 'Default: All available information')}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-accent" />
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <div>
              <p className="font-medium text-ig-dark-ink">{t('2. ช่วงวันที่', '2. Date range')}</p>
              <p className="text-[10px] text-ig-dark-muted">
                {t('เดิมเป็น: ปีที่แล้ว', 'Default: Last year')}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-ig-dark-muted" />
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <div>
              <p className="font-medium text-ig-dark-ink">{t('3. รูปแบบ', '3. Format')}</p>
              <p className="text-[10px] text-ig-dark-muted">{t('เดิมเป็น: HTML', 'Default: HTML')}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-ig-dark-muted" />
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 text-ig-dark-muted">
            <div>
              <p className="font-medium text-ig-dark-ink">{t('คุณภาพของสื่อ', 'Media quality')}</p>
              <p className="text-[10px]">{t('คุณภาพปานกลาง (ไม่ต้องแก้)', 'Medium (leave as is)')}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopCustomizeDataMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[390px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-3.5">
        <p className="text-sm font-medium text-ig-dark-ink">
          {t('เลือกข้อมูลที่ต้องการส่งออก', 'Select information to export')}
        </p>

        <div className="mt-2 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-2">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="font-medium text-ig-dark-ink">
              {t('กิจกรรมบน Instagram ของคุณ', 'Your Instagram activity')}
            </span>
            <span className="guide-highlight-row--dark px-1.5 py-0.5 text-[9px] font-semibold text-accent">
              {t('คลิก ล้างทั้งหมด', 'Click Clear all')}
            </span>
          </div>
          <p className="mt-1 text-[9px] text-ig-dark-muted">
            {t(
              'และเลื่อนลงไปคลิก “ล้างทั้งหมด” ในหมวด ข้อมูลส่วนบุคคล ด้วย',
              'Scroll down and click Clear all under Personal information too.',
            )}
          </p>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-ig-dark-ink">
              {t('การเชื่อมต่อ (เลื่อนลงมาเจอหัวข้อนี้)', 'Connections (scroll down to find it)')}
            </span>
            <span className="text-[10px] font-medium text-cool">{t('ล้างทั้งหมด', 'Clear all')}</span>
          </div>
          <div className="mt-1.5 space-y-1 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-1.5 text-[11px]">
            <div className="flex items-center justify-between px-2 py-1 text-ig-dark-muted">
              <span>{t('ผู้ติดต่อ (เอาติ๊กออก)', 'Contacts (uncheck)')}</span>
              <span className="h-4 w-4 rounded border border-ig-dark-rule bg-ig-dark-bg" />
            </div>
            <div className="guide-highlight-row--dark flex items-center justify-between px-2 py-1.5 font-medium text-accent">
              <span>{t('ผู้ติดตามและคนที่คุณติดตาม', 'Followers and following')}</span>
              <span className="flex h-4 w-4 items-center justify-center rounded bg-ig-blue text-ig-blue-ink">
                <Check className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-dashed border-ig-dark-rule bg-ig-dark-bg p-2 text-[9px] leading-snug text-ig-dark-muted">
          {t('↓ เลื่อนลงจนสุดแล้วคลิก', '↓ Scroll to the bottom and click')}{' '}
          <strong className="text-ig-dark-ink">{t('ล้างทั้งหมด', 'Clear all')}</strong>{' '}
          {t(
            'ในอีก 5 หมวดด้านล่างด้วย (ข้อมูลที่ลงบันทึกไว้, การรักษาความปลอดภัยฯ, แอพและเว็บไซต์นอก IG, การกำหนดลักษณะ, ข้อมูลโฆษณา)',
            'in the five remaining categories (Logged information, Security and login, Apps and websites, Preferences, and Ads information).',
          )}
        </div>

        <div className="guide-highlight-btn mt-2.5 rounded-full bg-ig-blue py-1.5 text-center text-xs font-medium text-ig-blue-ink">
          {t('บันทึก', 'Save')}
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopDateRangeMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-3.5">
        <p className="text-[10px] text-ig-dark-muted">somchai.demo · Instagram</p>
        <p className="mt-0.5 text-sm font-medium text-ig-dark-ink">{t('ช่วงวันที่', 'Date range')}</p>

        <div className="mt-2 divide-y divide-ig-dark-rule rounded-lg border border-ig-dark-rule bg-ig-dark-surface px-2.5 text-[11px]">
          {[
            t('สัปดาห์ที่แล้ว', 'Last week'),
            t('เดือนที่แล้ว', 'Last month'),
            t('3 เดือนที่ผ่านมา', 'Last 3 months'),
            t('ปีที่แล้ว (ค่าเริ่มต้น)', 'Last year (default)'),
            t('3 ปีที่ผ่านมา', 'Last 3 years'),
          ].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 text-ig-dark-muted"
            >
              <span>{label}</span>
              <span className="h-3.5 w-3.5 rounded-full border border-ig-dark-rule" />
            </div>
          ))}
          <div className="guide-highlight-row--dark -mx-1 my-1 flex items-center justify-between px-2 py-2">
            <div>
              <p className="font-semibold text-accent">{t('ตลอดเวลา', 'All time')}</p>
              <p className="text-[9px] text-ig-dark-muted">
                {t('อาจใช้เวลานานขึ้นเพื่อส่งออก', 'May take longer to export')}
              </p>
            </div>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border-4 border-ig-blue bg-ig-dark-bg" />
          </div>
        </div>

        <div className="guide-highlight-btn mt-2.5 rounded-full bg-ig-blue py-1.5 text-center text-xs font-medium text-ig-blue-ink">
          {t('บันทึก', 'Save')}
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopFormatAndStartMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-3.5">
        <p className="text-[10px] text-ig-dark-muted">somchai.demo · Instagram</p>
        <p className="mt-0.5 text-sm font-medium text-ig-dark-ink">{t('รูปแบบ', 'Format')}</p>

        <div className="mt-2 space-y-1.5 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-2 text-[11px]">
          <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-ig-dark-muted">
            <div>
              <p className="font-medium">HTML</p>
              <p className="text-[9px]">
                {t('ดูข้อมูลบนคอมพิวเตอร์แบบออฟไลน์', 'View information offline on your computer')}
              </p>
            </div>
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-ig-dark-rule" />
          </div>

          <div className="guide-highlight-row--dark flex items-center justify-between px-2 py-2">
            <div>
              <p className="font-semibold text-accent">{t('JSON (แนะนำ)', 'JSON (recommended)')}</p>
              <p className="text-[9px] text-ig-dark-muted">
                {t(
                  'นำเข้าข้อมูลไปยังเว็บไซต์หรือแอพอื่นได้',
                  'Import your information into another website or app',
                )}
              </p>
            </div>
            <span className="h-4 w-4 shrink-0 rounded-full border-4 border-ig-blue bg-ig-dark-bg" />
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-ig-dark-rule bg-ig-dark-bg px-2.5 py-2 text-[10px] text-ig-dark-muted">
          {t('คลิก', 'Click')} <strong className="text-ig-dark-ink">{t('บันทึก', 'Save')}</strong>{' '}
          {t(
            '→ กลับมาหน้ายืนยัน (คุณภาพของสื่อคงเดิมได้) แล้วคลิกปุ่มด้านล่าง',
            '→ Return to Confirm your export, keep Media quality as is, then click the button below.',
          )}
        </div>

        <div className="guide-highlight-btn mt-2.5 rounded-full bg-ig-blue py-2 text-center text-xs font-medium text-ig-blue-ink">
          {t('เริ่มส่งออก', 'Start export')}
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}

export function DesktopDownloadReadyMockup() {
  const { t } = useLanguage();

  return (
    <DesktopDeviceFrame address="accountscenter.instagram.com">
      <div className="mx-auto max-w-[380px] rounded-lg border border-ig-dark-rule bg-ig-dark-elevated p-3.5">
        <div className="grid grid-cols-2 border-b border-ig-dark-rule text-center text-[11px] font-medium">
          <div className="border-b-2 border-ig-dark-ink pb-2 text-ig-dark-ink">
            {t('กิจกรรมปัจจุบัน', 'Current activity')}
          </div>
          <div className="pb-2 text-ig-dark-muted">{t('กิจกรรมที่ผ่านมา', 'Past activity')}</div>
        </div>

        <p className="mt-3 text-xs font-medium text-ig-dark-ink">
          {t('ไฟล์ที่พร้อมให้ดาวน์โหลด', 'Available downloads')}
        </p>
        <div className="mt-2 rounded-lg border border-ig-dark-rule bg-ig-dark-surface p-3">
          <p className="text-[11px] font-medium text-ig-dark-ink">somchai.demo (Instagram)</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-ig-dark-muted">
            {t(
              'ผู้ติดตามและคนที่คุณติดตาม (JSON · หมดอายุ 4 วัน · ไม่เกิน 1 MB)',
              'Followers and following (JSON · Available for four days · Up to 1 MB)',
            )}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="guide-highlight-row--dark flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-accent">
              <Download className="h-3.5 w-3.5" />
              <span>{t('ดาวน์โหลด', 'Download')}</span>
            </div>
            <div className="rounded-md bg-ig-dark-bg py-1.5 text-center text-[11px] text-ig-dark-muted">
              {t('ยกเลิก', 'Cancel')}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-ig-dark-rule bg-ig-dark-bg px-3 py-2 text-[10px] text-ig-dark-ink">
          <span className="measured inline-flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-cool" />
            Downloads/instagram-somchai.demo.zip
          </span>
          <span className="text-ig-dark-muted">{t('ไม่ต้องแตกไฟล์', 'Keep the file zipped')}</span>
        </div>
      </div>
    </DesktopDeviceFrame>
  );
}
