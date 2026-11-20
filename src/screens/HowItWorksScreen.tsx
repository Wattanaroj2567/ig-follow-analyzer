import { AlertTriangle, ExternalLink, Laptop, Smartphone, Upload } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { PageId } from '../components/AppShell';
import {
  DesktopConfirmExportMockup,
  DesktopCreateExportMockup,
  DesktopCustomizeDataMockup,
  DesktopDateRangeMockup,
  DesktopDestinationMockup,
  DesktopDownloadReadyMockup,
  DesktopFormatAndStartMockup,
  DesktopMoreSettingsMockup,
  DesktopPermissionsMockup,
  DesktopSelectProfileMockup,
  DesktopSettingsAccountsCenterMockup,
  MobileAccountsCenterMockup,
  MobileBrowserDownloadBarMockup,
  MobileConfirmExportMockup,
  MobileCustomizeDataMockup,
  MobileDateRangeMockup,
  MobileDestinationMockup,
  MobileExportMockup,
  MobileFormatAndStartMockup,
  MobileOpenExternalBrowserMockup,
  MobilePermissionsMockup,
  MobileProfileMockup,
  MobileSaveDestinationMockup,
  MobileSelectProfileMockup,
  MobileSettingsMockup,
  MobileShareDownloadMockup,
} from '../components/GuideIllustration';
import { type Translator, useLanguage } from '../lib/language';
import { NormalButton } from '../components/NormalButton';

interface HowItWorksScreenProps {
  onNavigate: (id: PageId) => void;
}

type Device = 'mobile' | 'web';

interface GuideStep {
  id: string;
  title: string;
  summary: string | string[];
  tip?: string;
  mockup: ReactNode;
}

const STEP_HIGHLIGHT_PATTERNS = [
  'ผู้ติดตามและคนที่คุณติดตาม',
  'ข้อมูลและสิทธิ์การอนุญาตของคุณ',
  'ดาวน์โหลดเสร็จสมบูรณ์',
  'ไฟล์ที่พร้อมให้ดาวน์โหลด',
  'ดาวน์โหลดไฟล์ของคุณ',
  'บันทึกไปยัง แอปไฟล์',
  'ส่งออกไปยังอุปกรณ์',
  'ส่งออกข้อมูลของคุณ',
  'ตลอดเวลา \\(All time\\)',
  'กิจกรรมปัจจุบัน',
  'สร้างไฟล์ส่งออก',
  'รายการดาวน์โหลด',
  'เมนูสามขีดที่มุมขวาบน',
  'ปรับแต่งข้อมูล',
  'คุณภาพของสื่อ',
  'คุณภาพปานกลาง',
  'เพิ่มเติม \\(≡\\)',
  'เปิด \\(Open\\)',
  'บัญชีของคุณ',
  'การเชื่อมต่อ',
  'ล้างทั้งหมด',
  'เริ่มส่งออก',
  'ส่งคำขอแล้ว',
  'รูปโปรไฟล์',
  'ศูนย์บัญชี',
  'ช่วงวันที่',
  'ตั้งแต่ต้น',
  'ตลอดเวลา',
  'ปีที่แล้ว',
  'กำหนดเอง',
  'การตั้งค่า',
  'เปิดใน…',
  'แอปไฟล์',
  'รูปแบบ',
  '(?<=แตะ |คลิก )ดาวน์โหลด(?!ไฟล์)',
  '(?<!ลง)บันทึก(?!ไว้)',
  'แจ้ง(?!เตือน)',
  'Your information and permissions',
  'Export your information',
  'Followers and following',
  'Confirm your export',
  'Customize information',
  'Available downloads',
  'Request submitted',
  'Download complete',
  'Current activity',
  'Export to device',
  'Accounts Center',
  'Your account',
  'Create export',
  'Start export',
  'Media quality',
  'Connections',
  'Save to Files',
  'Clear all',
  'Date range',
  'All time',
  'Last year',
  'Downloads',
  'Settings',
  'Open in…',
  'Download',
  'Format',
  'Notify',
  'Medium',
  'Custom',
  'Files',
  'More',
  'Open',
  'Save',
  'JSON',
  'HTML',
];

const STEP_HIGHLIGHT_REGEX = new RegExp(
  `(${STEP_HIGHLIGHT_PATTERNS.map((pattern) =>
    /^[A-Za-z]/.test(pattern) ? `(?<![A-Za-z])${pattern}(?![A-Za-z])` : pattern,
  ).join('|')})`,
  'g',
);

function highlightStepText(text: string, variant: 'summary' | 'tip' = 'summary'): ReactNode {
  const parts = text.split(STEP_HIGHLIGHT_REGEX);
  if (parts.length === 1) return text;

  const badgeClass =
    variant === 'tip'
      ? 'rounded border border-accent/50 bg-paper-2 px-1.5 py-0.5 font-semibold text-ink'
      : 'rounded border border-accent/40 bg-accent-soft px-1.5 py-0.5 font-semibold text-ink';

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className={badgeClass}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const getMobileSteps = (t: Translator): GuideStep[] => [
  {
    id: 'm-1',
    title: t('เปิดหน้าโปรไฟล์และแตะเมนูสามขีด', 'Open your profile and tap the menu'),
    summary: t(
      'เปิดแอป Instagram แตะรูปโปรไฟล์มุมขวาล่าง จากนั้นแตะเมนูสามขีดที่มุมขวาบนเพื่อเข้าหน้าการตั้งค่า',
      'In the Instagram app, tap your profile picture at the bottom right, then tap the menu at the top right to open settings.',
    ),
    mockup: <MobileProfileMockup />,
  },
  {
    id: 'm-2',
    title: t(
      'เข้าเมนู การตั้งค่าและกิจกรรม แล้วแตะ ศูนย์บัญชี',
      'Open Accounts Center in Settings and activity',
    ),
    summary: t(
      'ในหมวด บัญชีของคุณ ด้านบนสุด แตะ ศูนย์บัญชี เพื่อเปิดการตั้งค่าบัญชีและข้อมูลส่วนตัว',
      'Under Your account at the top, tap Accounts Center to manage your account and information.',
    ),
    mockup: <MobileSettingsMockup />,
  },
  {
    id: 'm-3',
    title: t('ในหน้า ศูนย์บัญชี เลือก ข้อมูลและสิทธิ์การอนุญาตของคุณ', 'Tap Your information and permissions'),
    summary: t(
      'เลื่อนดูในรายการเมนูใต้โปรไฟล์ แล้วแตะ ข้อมูลและสิทธิ์การอนุญาตของคุณ',
      'Scroll below your profiles in Accounts Center and tap Your information and permissions.',
    ),
    mockup: <MobileAccountsCenterMockup />,
  },
  {
    id: 'm-4',
    title: t('เลือก ส่งออกข้อมูลของคุณ', 'Tap Export your information'),
    summary: t(
      'ในแอป Instagram แตะ ส่งออกข้อมูลของคุณ เพื่อเปิดหน้าจัดการไฟล์ส่งออกในแอป',
      'In the Instagram app, tap Export your information to open the export screen.',
    ),
    mockup: <MobilePermissionsMockup />,
  },
  {
    id: 'm-5',
    title: t('แตะปุ่ม สร้างไฟล์ส่งออก', 'Tap Create export'),
    summary: t(
      'ในหน้า ส่งออกข้อมูลของคุณ แตะปุ่มสีน้ำเงิน สร้างไฟล์ส่งออก เพื่อเริ่มตั้งค่าคำขอใหม่',
      'On the Export your information screen, tap the blue Create export button to start a new request.',
    ),
    mockup: <MobileExportMockup />,
  },
  {
    id: 'm-6',
    title: t('หน้า เลือกโปรไฟล์ ให้เลือกบัญชี Instagram ของคุณ', 'Select your Instagram profile'),
    summary: t(
      'หากมีหลายบัญชีเชื่อมโยงอยู่ ให้แตะเลือกเฉพาะโปรไฟล์ที่มีป้าย Instagram ของบัญชีที่ต้องการตรวจสอบ',
      'If several profiles are connected, choose the Instagram profile you want to analyze.',
    ),
    mockup: <MobileSelectProfileMockup />,
  },
  {
    id: 'm-7',
    title: t('หน้า เลือกปลายทางเพื่อส่งออก เลือก ส่งออกไปยังอุปกรณ์', 'Select Export to device'),
    summary: t(
      'เลือก ส่งออกไปยังอุปกรณ์ เพื่อดาวน์โหลดไฟล์ .zip ลงเครื่องมือถือของคุณโดยตรง',
      'This option lets you download the ZIP directly to your phone.',
    ),
    mockup: <MobileDestinationMockup />,
  },
  {
    id: 'm-8',
    title: t(
      'หน้า ยืนยันการส่งออกของคุณ — แตะ ปรับแต่งข้อมูล (และเช็กอีเมลในช่อง แจ้ง)',
      'Open Customize information and check the notification email',
    ),
    summary: [
      t(
        'อย่าเพิ่งกดปุ่ม เริ่มส่งออก ทันที ให้เข้าไปแก้ค่า 3 ช่องก่อน เริ่มจากแตะแถว ปรับแต่งข้อมูล',
        'On Confirm your export, review the next three settings before starting the export. Open Customize information first.',
      ),
      t(
        'หากต้องการเปลี่ยนอีเมลรับแจ้งเตือน สามารถแตะช่อง แจ้ง ด้านบนเพื่อเลือกอีเมลได้',
        'Use Notify at the top if you want to change the notification email.',
      ),
      t('ช่อง คุณภาพของสื่อ ปล่อยเป็น คุณภาพปานกลาง ตามเดิมได้เลย', 'Leave Media quality set to Medium.'),
    ],
    mockup: <MobileConfirmExportMockup />,
  },
  {
    id: 'm-9',
    title: t(
      'หน้า เลือกข้อมูลที่ต้องการส่งออก — เลื่อนลงกด ล้างทั้งหมด ทุกหมวด แล้วติ๊กเฉพาะ ผู้ติดตามและคนที่คุณติดตาม',
      'Clear each category and select only Followers and following',
    ),
    summary: [
      t(
        'หน้านี้ Instagram จะติ๊กเลือกไว้ครบทั้ง 8 หมวด ให้เลื่อนหน้าจอลงเรื่อยๆ แล้วกดปุ่ม ล้างทั้งหมด ที่ด้านขวาบนของทุกหมวด',
        'Instagram preselects all eight categories. Scroll down and tap Clear all at the top right of each category.',
      ),
      t(
        'ในหมวด การเชื่อมต่อ ให้ติ๊กเลือกไว้เพียงข้อเดียวคือ ผู้ติดตามและคนที่คุณติดตาม',
        'Under Connections, check only Followers and following.',
      ),
      t('กดปุ่ม บันทึก ด้านล่าง', 'Tap Save at the bottom.'),
    ],
    tip: t(
      'ถ้าไม่เลื่อนลงไปกด ล้างทั้งหมด ในหมวดอื่นด้านล่าง ไฟล์จะติดรูป วิดีโอ และแชทมาด้วย ทำให้ไฟล์ใหญ่หลาย GB และรอนานมากครับ',
      'If other categories are selected, the export may include photos, videos, and messages, making it much larger and slower to prepare.',
    ),
    mockup: <MobileCustomizeDataMockup />,
  },
  {
    id: 'm-10',
    title: t('เลือกช่วงวันที่ ตั้งแต่ต้น (All time) แล้วแตะ บันทึก', 'Set Date range to All time and tap Save'),
    summary: [
      t('กลับมาหน้ายืนยันแล้วแตะแถว ช่วงวันที่', 'Back on the confirmation screen, tap Date range.'),
      t(
        'เลื่อนลงมาเลือก ตั้งแต่ต้น (อยู่เหนือตัวเลือก กำหนดเอง) แล้วแตะ บันทึก ด้านล่าง',
        'Select All time above Custom, then tap Save at the bottom.',
      ),
    ],
    tip: t(
      'ถ้าเลือก ปีที่แล้ว ไฟล์อาจขาดรายชื่อบัญชีที่เริ่มติดตามกันก่อนช่วงนั้น',
      'If Date range stays set to Last year, older followers can be missing from your export.',
    ),
    mockup: <MobileDateRangeMockup />,
  },
  {
    id: 'm-11',
    title: t(
      'แตะ รูปแบบ — เปลี่ยนเป็น JSON กด บันทึก แล้วกดปุ่ม เริ่มส่งออก',
      'Choose JSON, save, then tap Start export',
    ),
    summary: [
      t(
        'แตะแถว รูปแบบ แล้วเปลี่ยนจาก HTML เป็น JSON จากนั้นกด บันทึก',
        'Open Format, change HTML to JSON, and tap Save.',
      ),
      t(
        'เมื่อกลับมาหน้ายืนยัน ให้เลื่อนลงสุดแล้วแตะปุ่มสีน้ำเงิน เริ่มส่งออก',
        'Scroll to the bottom of the confirmation screen and tap Start export.',
      ),
    ],
    tip: t(
      'ทำไมแนะนำ JSON มากกว่า HTML: ไฟล์ JSON เล็กและอ่านไวกว่า รวมถึงมีข้อมูลวันที่ทั้งฝั่งเขาฟอลคุณและคุณฟอลเขา และตรวจเตือนไฟล์ช่วง "ปีที่แล้ว" ได้ ส่วนไฟล์ HTML วิเคราะห์แยกหมวดรายชื่อได้เหมือนกัน แต่จะไม่มีวันที่เริ่มติดตามและตรวจเตือนไฟล์ไม่ครบไม่ได้ครับ',
      'JSON is smaller and includes follow dates when available. Those dates help flag exports that may cover only the past year. HTML works for comparing account lists.',
    ),
    mockup: <MobileFormatAndStartMockup />,
  },
  {
    id: 'm-12',
    title: t('เช็กสถานะ ส่งคำขอแล้ว', 'Check for Request submitted'),
    summary: [
      t(
        'หลังแตะ เริ่มส่งออก ให้ดูแท็บ กิจกรรมปัจจุบัน ในหน้า ส่งออกข้อมูลของคุณ',
        'After tapping Start export, check Current activity on the Export your information screen.',
      ),
      t(
        'เมื่อเห็นสถานะ ส่งคำขอแล้ว แสดงว่า Instagram กำลังเตรียมไฟล์ สามารถกลับมาเช็กที่หน้านี้ได้อีกครั้ง',
        'Request submitted means Instagram is preparing your file. Return here to check its status.',
      ),
    ],
    tip: t(
      'ระยะเวลารอขึ้นอยู่กับคิวของระบบ Meta อาจใช้เวลาตั้งแต่ไม่กี่นาทีไปจนถึงหลายชั่วโมง (แม้เลือกเฉพาะรายชื่อผู้ติดตามแล้ว) ระหว่างรอสามารถปิดแอปไปใช้งานอย่างอื่นก่อนได้',
      'Instagram may take a few minutes or several hours to prepare the file. You can close the app while you wait.',
    ),
    mockup: <MobileExportMockup state="pending" />,
  },
  {
    id: 'm-13',
    title: t(
      'เมื่อไฟล์พร้อม กลับเข้าแอป IG หน้า ส่งออกข้อมูลของคุณ แล้วแตะ ดาวน์โหลด',
      'Return to Export your information and tap Download',
    ),
    summary: [
      t(
        'เมื่อเห็นแจ้งเตือนว่าไฟล์พร้อมแล้ว ให้เข้าแอป Instagram ไปที่ ศูนย์บัญชี → ข้อมูลและสิทธิ์การอนุญาตของคุณ → ส่งออกข้อมูลของคุณ',
        'In Instagram, go to Accounts Center → Your information and permissions → Export your information.',
      ),
      t(
        'ในแท็บ กิจกรรมปัจจุบัน ดูหัวข้อ ไฟล์ที่พร้อมให้ดาวน์โหลด (มีเวลาโหลดภายใน 4 วัน) แล้วแตะ ดาวน์โหลด',
        'Under Current activity, find Available downloads and tap Download within four days.',
      ),
    ],
    mockup: <MobileExportMockup state="ready" />,
  },
  {
    id: 'm-14',
    title: t('แตะ เปิด เพื่อไปยังเบราว์เซอร์', 'Tap Open to continue in your browser'),
    summary: [
      t(
        'หากหน้า ดาวน์โหลดไฟล์ของคุณ ปรากฏขึ้น ให้แตะ ดาวน์โหลด ที่แถวไฟล์ ZIP อีกครั้ง',
        'If a file list appears after tapping Download, tap Download next to the ZIP.',
      ),
      t(
        'เมื่อ Instagram ถามว่าจะเปิดแอปภายนอกหรือไม่ ให้แตะ เปิด (Open) เพื่อไปยังเบราว์เซอร์',
        'When Instagram asks to open an external app, tap Open to continue in your browser.',
      ),
    ],
    mockup: <MobileOpenExternalBrowserMockup />,
  },
  {
    id: 'm-15',
    title: t('เมื่อดาวน์โหลดเสร็จ ให้แตะ เปิดใน…', 'When the download is complete, tap Open in…'),
    summary: [
      t(
        'บน iPhone เบราว์เซอร์อาจเปิดหน้าว่าง about:blank ให้ดูแถบด้านล่าง (ถ้าขึ้นปุ่ม บันทึก ก่อน ให้แตะแล้วรอจนเสร็จ)',
        'On iPhone, the browser may show a blank about:blank page. If the bottom bar shows Save first, tap it and wait for the download to finish.',
      ),
      t(
        'เมื่อขึ้นว่า ดาวน์โหลดเสร็จสมบูรณ์ ให้แตะ เปิดใน… ข้างไฟล์ ZIP',
        'When the bottom bar says Download complete, tap Open in… next to the ZIP.',
      ),
    ],
    mockup: <MobileBrowserDownloadBarMockup />,
  },
  {
    id: 'm-16',
    title: t('บน iPhone เลือก บันทึกไปยัง แอปไฟล์', 'On iPhone, choose Save to Files'),
    summary: t(
      'ในเมนูแชร์ที่เปิดขึ้น ให้เลื่อนลงไปที่รายการคำสั่ง แล้วแตะ บันทึกไปยัง แอปไฟล์',
      'In the share sheet, scroll down to the list of actions and tap Save to Files.',
    ),
    mockup: <MobileShareDownloadMockup />,
  },
  {
    id: 'm-17',
    title: t('เลือกโฟลเดอร์ แล้วแตะ บันทึก', 'Choose a folder and tap Save'),
    summary: [
      t(
        'ในแอปไฟล์ เลือกโฟลเดอร์ รายการดาวน์โหลด หรือโฟลเดอร์ที่จำได้ แล้วแตะ บันทึก มุมขวาบน (บน Android ไฟล์จะอยู่ในโฟลเดอร์ดาวน์โหลด)',
        'In Files, choose Downloads or another folder you can find again, then tap Save at the top right (on Android, look in the Downloads folder).',
      ),
      t(
        'กลับมาเลือกไฟล์ .zip ใน IG Follow Analyzer ได้เลยโดยไม่ต้องแตกไฟล์',
        'Return to IG Follow Analyzer and select the ZIP as downloaded.',
      ),
    ],
    mockup: <MobileSaveDestinationMockup />,
  },
];

const getDesktopSteps = (t: Translator): GuideStep[] => [
  {
    id: 'w-1',
    title: t('เปิด เพิ่มเติม แล้วเลือก การตั้งค่า', 'Open More and choose Settings'),
    summary: t(
      'เข้าเว็บไซต์ instagram.com บนคอมพิวเตอร์ คลิกปุ่ม เพิ่มเติม (≡) มุมซ้ายล่างของแถบเมนู จากนั้นคลิก การตั้งค่า (หรือเข้า accountscenter.instagram.com โดยตรง)',
      'On instagram.com, click More at the bottom left, then click Settings. You can also open accountscenter.instagram.com directly.',
    ),
    mockup: <DesktopMoreSettingsMockup />,
  },
  {
    id: 'w-2',
    title: t('หน้า การตั้งค่า คลิก ศูนย์บัญชี ด้านซ้ายบน', 'Open Accounts Center'),
    summary: t(
      'ในแถบซ้ายใต้หัวข้อ บัญชีของคุณ คลิกกรอบ ศูนย์บัญชี เพื่อเข้าไปจัดการข้อมูลบัญชี',
      'In Settings, click Accounts Center under Your account on the left.',
    ),
    mockup: <DesktopSettingsAccountsCenterMockup />,
  },
  {
    id: 'w-3',
    title: t(
      'เลือก ข้อมูลและสิทธิ์การอนุญาตของคุณ และ ส่งออกข้อมูลของคุณ',
      'Open Your information and permissions, then Export your information',
    ),
    summary: t(
      'ในหน้าต่างศูนย์บัญชี คลิกเมนูด้านซ้าย ข้อมูลและสิทธิ์การอนุญาตของคุณ แล้วคลิกแถว ส่งออกข้อมูลของคุณ ด้านขวา',
      'In Accounts Center, select Your information and permissions in the sidebar, then click Export your information.',
    ),
    mockup: <DesktopPermissionsMockup />,
  },
  {
    id: 'w-4',
    title: t('หน้า ส่งออกข้อมูลของคุณ คลิกปุ่ม สร้างไฟล์ส่งออก', 'Click Create export'),
    summary: t(
      'ในหน้าต่าง ส่งออกข้อมูลของคุณ คลิกปุ่มสีน้ำเงิน สร้างไฟล์ส่งออก เพื่อเริ่มสร้างคำขอใหม่',
      'On Export your information, click the blue Create export button to start a request.',
    ),
    mockup: <DesktopCreateExportMockup />,
  },
  {
    id: 'w-5',
    title: t('หน้า เลือกโปรไฟล์ คลิกเลือกบัญชี Instagram ของคุณ', 'Select your Instagram profile'),
    summary: t(
      'หากเชื่อมกับ Facebook หรือ Threads ไว้หลายโปรไฟล์ ให้คลิกเลือกเฉพาะแถวที่มีป้าย Instagram',
      'If Facebook or Threads profiles are linked, select the Instagram profile you want to analyze.',
    ),
    mockup: <DesktopSelectProfileMockup />,
  },
  {
    id: 'w-6',
    title: t('หน้า เลือกปลายทางเพื่อส่งออก เลือก ส่งออกไปยังอุปกรณ์', 'Select Export to device'),
    summary: t(
      'คลิก ส่งออกไปยังอุปกรณ์ เพื่อดาวน์โหลดไฟล์ .zip ลงเครื่องคอมพิวเตอร์ของคุณโดยตรง',
      'Choose Export to device so you can download the ZIP to your computer.',
    ),
    mockup: <DesktopDestinationMockup />,
  },
  {
    id: 'w-7',
    title: t(
      'หน้า ยืนยันการส่งออกของคุณ — คลิก ปรับแต่งข้อมูล (และเช็กอีเมลในช่อง แจ้ง)',
      'Open Customize information and check the notification email',
    ),
    summary: [
      t(
        'อย่าเพิ่งคลิก เริ่มส่งออก ทันที ให้เข้าไปตั้งค่า 3 ช่องก่อน เริ่มจากคลิก ปรับแต่งข้อมูล',
        'On Confirm your export, review the next three settings before starting the export. Click Customize information first.',
      ),
      t(
        'หากต้องการเปลี่ยนอีเมลรับแจ้งเตือน คลิกช่อง แจ้ง ด้านบนได้ ส่วน คุณภาพของสื่อ คงค่า คุณภาพปานกลาง ตามเดิมได้เลย',
        'Use Notify to change your email if needed, and leave Media quality set to Medium.',
      ),
    ],
    mockup: <DesktopConfirmExportMockup />,
  },
  {
    id: 'w-8',
    title: t(
      'หน้า เลือกข้อมูลที่ต้องการส่งออก — เลื่อนลงคลิก ล้างทั้งหมด ทุกหมวด แล้วติ๊กเฉพาะ ผู้ติดตามและคนที่คุณติดตาม',
      'Clear each category and select only Followers and following',
    ),
    summary: [
      t(
        'Instagram จะติ๊กเลือกไว้ครบทั้ง 8 หมวด ให้เลื่อนหน้าต่างลงเรื่อยๆ แล้วคลิกปุ่ม ล้างทั้งหมด ด้านขวาบนของทุกหมวด',
        'Instagram preselects all eight categories. Scroll down and click Clear all at the top right of each category.',
      ),
      t(
        'ในหมวด การเชื่อมต่อ ให้ติ๊กเลือกไว้เพียงข้อเดียวคือ ผู้ติดตามและคนที่คุณติดตาม',
        'Under Connections, check only Followers and following.',
      ),
      t('คลิกปุ่ม บันทึก ด้านล่าง', 'Click Save at the bottom.'),
    ],
    tip: t(
      'ต้องเลื่อนลงจนสุดหน้าต่างเพื่อคลิก ล้างทั้งหมด ในอีก 5 หมวดล่างด้วย ไม่อย่างนั้นไฟล์จะมีรูปและวิดีโอติดมาจนใหญ่เกินไปครับ',
      'Scroll to the bottom to clear all categories. Selecting photos and videos can make the ZIP too large.',
    ),
    mockup: <DesktopCustomizeDataMockup />,
  },
  {
    id: 'w-9',
    title: t(
      'คลิก ช่วงวันที่ — เปลี่ยนจาก ปีที่แล้ว เป็น ตลอดเวลา (All time) แล้วคลิก บันทึก',
      'Set Date range to All time and click Save',
    ),
    summary: [
      t('กลับมาหน้ายืนยันแล้วคลิกแถว ช่วงวันที่', 'On the confirmation screen, open Date range.'),
      t('เลื่อนลงมาเลือก ตลอดเวลา แล้วคลิก บันทึก', 'Select All time, then click Save.'),
    ],
    tip: t(
      'อย่าลืมเปลี่ยนจากค่าเริ่มต้น "ปีที่แล้ว" เป็น "ตลอดเวลา (All time)" เพื่อให้ได้รายชื่อผู้ติดตามครบทุกปี',
      'Choose All time to include followers from before the past year.',
    ),
    mockup: <DesktopDateRangeMockup />,
  },
  {
    id: 'w-10',
    title: t(
      'คลิก รูปแบบ — เปลี่ยนเป็น JSON คลิก บันทึก แล้วคลิก เริ่มส่งออก',
      'Choose JSON, save, then click Start export',
    ),
    summary: [
      t(
        'คลิกแถว รูปแบบ แล้วเปลี่ยนจาก HTML เป็น JSON จากนั้นคลิก บันทึก',
        'Click Format, change HTML to JSON, and click Save.',
      ),
      t(
        'เมื่อกลับมาหน้ายืนยัน ให้คลิกปุ่มสีน้ำเงิน เริ่มส่งออก',
        'On the confirmation screen, click Start export.',
      ),
    ],
    tip: t(
      'ทำไมแนะนำ JSON มากกว่า HTML: ไฟล์ JSON เล็กกว่า มีข้อมูลวันที่เริ่มติดตามครบทั้ง 2 ฝั่ง และตรวจเตือนไฟล์ช่วง "ปีที่แล้ว" ได้ ส่วนไฟล์ HTML วิเคราะห์แยกหมวดรายชื่อได้ครบเช่นกัน แต่จะไม่มีวันที่เริ่มติดตามและแจ้งเตือนไฟล์ไม่ครบไม่ได้ครับ',
      'JSON is smaller and includes follow dates when available. Those dates help flag exports that may cover only the past year. HTML works for comparing account lists.',
    ),
    mockup: <DesktopFormatAndStartMockup />,
  },
  {
    id: 'w-11',
    title: t(
      'รอแจ้งเตือน แล้วกลับมาคลิก ดาวน์โหลด ในแท็บ กิจกรรมปัจจุบัน',
      'Download the ZIP from Current activity',
    ),
    summary: [
      t(
        'เมื่อได้รับแจ้งเตือนว่าไฟล์พร้อมแล้ว ให้กลับมาที่หน้า ส่งออกข้อมูลของคุณ แท็บ กิจกรรมปัจจุบัน',
        'When Instagram notifies you that the export is ready, return to Export your information → Current activity.',
      ),
      t(
        'ใต้หัวข้อ ไฟล์ที่พร้อมให้ดาวน์โหลด คลิกปุ่ม ดาวน์โหลด ภายใน 4 วัน เพื่อบันทึกไฟล์ .zip ลงเครื่อง',
        'Under Available downloads, click Download within four days to save the ZIP to your computer.',
      ),
    ],
    tip: t(
      'ระยะเวลารอขึ้นอยู่กับคิวของระบบ Meta อาจใช้เวลาตั้งแต่ไม่กี่นาทีจนถึงหลายชั่วโมง ระหว่างรอสามารถปิดหน้าต่างไปทำอย่างอื่นก่อนได้เลย',
      'Instagram may take a few minutes or several hours to prepare the file. You can close the window while you wait.',
    ),
    mockup: <DesktopDownloadReadyMockup />,
  },
];

export function HowItWorksScreen({ onNavigate }: HowItWorksScreenProps) {
  const { t } = useLanguage();
  const [device, setDevice] = useState<Device>('mobile');
  const steps = device === 'mobile' ? getMobileSteps(t) : getDesktopSteps(t);

  return (
    <div className="product-wrap py-9 lg:py-14">
      <header className="border-b border-rule pb-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-[66ch]">
            <h1 className="text-3xl text-ink sm:text-5xl">
              {t('วิธีขอไฟล์ ZIP จาก Instagram', 'How to export your Instagram ZIP')}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-2">
              {t(
                'คู่มือทีละขั้นตอนถอดจากหน้าจอจริงของศูนย์บัญชี Instagram ทั้งบนแอปมือถือและคอมพิวเตอร์ เลือกอุปกรณ์ที่คุณใช้งานด้านล่างแล้วทำตามลำดับได้เลย',
                'Follow the Accounts Center steps for your phone or computer.',
              )}
            </p>
          </div>

          <div
            className="inline-flex shrink-0 flex-wrap gap-2"
            role="group"
            aria-label={t('เลือกอุปกรณ์สำหรับคู่มือ', 'Choose a device for the guide')}
          >
            <button
              type="button"
              aria-pressed={device === 'mobile'}
              aria-controls="export-steps"
              onClick={() => setDevice('mobile')}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                device === 'mobile'
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-rule-2 bg-paper-2 text-ink hover:border-ink'
              }`}
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              <span>{t('มือถือ (แอป IG)', 'Mobile app')}</span>
            </button>
            <button
              type="button"
              aria-pressed={device === 'web'}
              aria-controls="export-steps"
              onClick={() => setDevice('web')}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                device === 'web'
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-rule-2 bg-paper-2 text-ink hover:border-ink'
              }`}
            >
              <Laptop className="h-4 w-4" aria-hidden="true" />
              <span>{t('คอมพิวเตอร์ (Web)', 'Desktop web')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Step Count Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule py-4 text-sm">
        <p className="font-semibold text-ink">
          {t('คู่มือ', 'Guide: ')}
          {device === 'mobile'
            ? t('มือถือ (แอป IG)', 'Mobile app')
            : t('คอมพิวเตอร์ (Web)', 'Desktop web')}{' '}
          ·{' '}
          <span className="measured text-accent">
            {t('ทั้งหมด ', '')}
            {steps.length}
            {t(' ขั้นตอน', ' steps')}
          </span>
        </p>
        <p className="text-xs text-muted">
          {t('ทำตามภาพทีละขั้น', 'Follow the illustrated steps in order.')}
        </p>
      </div>

      {/* Steps List */}
      <ol id="export-steps" className="divide-y divide-rule" role="list">
        {steps.map((step, index) => (
          <li
            key={step.id}
            id={step.id}
            className="grid grid-cols-1 gap-8 py-9 lg:grid-cols-12 lg:items-center"
          >
            <div className="lg:col-span-6">
              <div className="flex items-baseline gap-3">
                <span className="measured inline-flex h-8 shrink-0 items-center justify-center rounded border border-rule-2 bg-paper-3 px-2.5 text-sm font-semibold text-accent">
                  {String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
                </span>
                <h2 className="text-xl text-ink sm:text-2xl">{step.title}</h2>
              </div>

              {Array.isArray(step.summary) ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-ink-2 marker:text-accent">
                  {step.summary.map((item, idx) => (
                    <li key={idx}>{highlightStepText(item, 'summary')}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-base leading-relaxed text-ink-2">
                  {highlightStepText(step.summary, 'summary')}
                </p>
              )}

              {step.tip && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-accent bg-accent-soft p-4 text-sm leading-relaxed text-ink">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span>{highlightStepText(step.tip, 'tip')}</span>
                </div>
              )}

              {index === steps.length - 1 && (
                <div className="mt-5">
                  <NormalButton variant="primary" onClick={() => onNavigate('upload')}>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {t('ไปหน้าเลือกไฟล์ ZIP', 'Choose your ZIP file')}
                  </NormalButton>
                </div>
              )}
            </div>

            <div className="lg:col-span-6">{step.mockup}</div>
          </li>
        ))}
      </ol>

      {/* Official Instagram Help Center Reference */}
      <section
        className="mt-6 rounded-[10px] border border-rule bg-paper-2 p-6 sm:p-8"
        aria-labelledby="ig-docs-ref"
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-[68ch]">
            <h2 id="ig-docs-ref" className="text-lg text-ink">
              {t('แหล่งอ้างอิงเอกสารทางการของ Instagram', 'Official Instagram guide')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t(
                'ขั้นตอนทั้งหมดอ้างอิงจากศูนย์ช่วยเหลือทางการของ Instagram (Download a copy of your information on Instagram ผ่าน Meta Accounts Center) โดยระบบจะแจ้งเตือนทางอีเมลเมื่อไฟล์พร้อม และลิงก์ดาวน์โหลดจะมีอายุจำกัด 4 วันเพื่อความปลอดภัยของบัญชี',
                'The steps follow Instagram’s Accounts Center export guide. Instagram emails you when the export is ready. The download is available for four days.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://help.instagram.com/181231772500920"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary shrink-0 whitespace-nowrap"
            >
              <span>{t('อ่านคู่มือ Instagram Help Center', 'Read Instagram Help Center')}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <NormalButton variant="primary" onClick={() => onNavigate('upload')}>
              {t('พร้อมอัปโหลดไฟล์ ZIP', 'Ready to select your ZIP')}
            </NormalButton>
          </div>
        </div>
      </section>
    </div>
  );
}
