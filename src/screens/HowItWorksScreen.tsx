import { AlertTriangle, ExternalLink, Laptop, Smartphone, Upload } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { BackButton } from '../components/BackButton';
import type { PageId } from '../components/AppShell';
import {
  DesktopConfirmExportMockup,
  DesktopConfirmPasswordMockup,
  DesktopCreateExportMockup,
  DesktopCustomizeDataMockup,
  DesktopDateRangeMockup,
  DesktopDestinationMockup,
  DesktopDownloadFilesMockup,
  DesktopDownloadReadyMockup,
  DesktopFormatMockup,
  DesktopMoreSettingsMockup,
  DesktopPermissionsMockup,
  DesktopSavedZipMockup,
  DesktopSelectProfileMockup,
  DesktopSettingsAccountsCenterMockup,
  MobileAccountsCenterMockup,
  MobileBrowserDownloadBarMockup,
  MobileConfirmExportMockup,
  MobileConfirmPasswordMockup,
  MobileCustomizeDataMockup,
  MobileDateRangeMockup,
  MobileDestinationMockup,
  MobileDownloadFilesMockup,
  MobileExportMockup,
  MobileFormatMockup,
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
  focusDateRange: boolean;
  onNavigate: (id: PageId) => void;
}

type Device = 'mobile' | 'web';

function focusGuideStep(id: string) {
  const step = document.getElementById(id);
  step?.focus({ preventScroll: true });
  step?.scrollIntoView?.({ block: 'start' });
}

interface GuideStep {
  id: string;
  title: string;
  summary: string | string[];
  tip?: string;
  mockup: ReactNode;
}

const STEP_UNDERLINE_PATTERNS = [
  'ผู้ติดตามและคนที่คุณติดตาม',
  'ข้อมูลและสิทธิ์การอนุญาตของคุณ',
  'ส่งออกไปยังอุปกรณ์',
  'ส่งออกข้อมูลของคุณ',
  'กิจกรรมปัจจุบัน',
  'สร้างไฟล์ส่งออก',
  'เมนูสามขีดที่มุมขวาบน',
  'ปรับแต่งข้อมูล',
  'ล้างทั้งหมด',
  'เริ่มส่งออก',
  'รูปโปรไฟล์',
  'ศูนย์บัญชี',
  'ช่วงวันที่',
  'ตั้งแต่ต้น',
  'ตลอดเวลา',
  'การตั้งค่า',
  'แอปไฟล์',
  'บันทึกเป็น',
  'แสดงในโฟลเดอร์',
  'รูปแบบ',
  'Your information and permissions',
  'Export your information',
  'Followers and following',
  'Customize information',
  'Current activity',
  'Export to device',
  'Accounts Center',
  'Create export',
  'Start export',
  'Date range',
  'All time',
  'Settings',
  'Files',
  'Save as',
  'Show in folder',
  'JSON',
];

const STEP_UNDERLINE_REGEX = new RegExp(
  `(${STEP_UNDERLINE_PATTERNS.map((pattern) =>
    /^[A-Za-z]/.test(pattern) ? `(?<![A-Za-z])${pattern}(?![A-Za-z])` : pattern,
  ).join('|')})`,
  'g',
);

function underlineStepText(text: string): ReactNode {
  const parts = text.split(STEP_UNDERLINE_REGEX);
  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="bg-transparent font-semibold text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const getExportWaitTip = (t: Translator) =>
  t(
    'ถ้าเข้าอีเมลเดิมไม่ได้หรือยังไม่ได้รับแจ้งเตือน ลองกลับมาเช็ก กิจกรรมปัจจุบัน อีกครั้งใน 2–5 นาที ถ้ายังเตรียมไฟล์อยู่ ให้กลับมาเช็กภายหลัง Instagram อาจใช้เวลานานกว่านี้',
    'If you can’t access your email or haven’t received a notification, try checking Current activity again in 2–5 minutes. If it’s still pending, come back later. Instagram may take longer to prepare the file.',
  );

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
      'ช่วงที่สั้นกว่าตลอดเวลา รวมถึงช่วงที่กำหนดเอง อาจทำให้บางบัญชีไม่อยู่ในไฟล์',
      'A shorter or custom date range may leave some accounts out of the export.',
    ),
    mockup: <MobileDateRangeMockup />,
  },
  {
    id: 'm-11',
    title: t('เลือกรูปแบบ JSON แล้วแตะ บันทึก', 'Choose JSON as the format and tap Save'),
    summary: t(
      'แตะแถว รูปแบบ เปลี่ยนจาก HTML เป็น JSON แล้วแตะ บันทึก เพื่อกลับไปหน้า ยืนยันการส่งออกของคุณ',
      'Open Format, change HTML to JSON, and tap Save to return to Confirm your export.',
    ),
    tip: t(
      'JSON มักมีวันที่ติดตามที่ช่วยสังเกตว่ารายชื่ออาจไม่ครบ ส่วน HTML ยังใช้เทียบรายชื่อได้ ให้ตรวจว่าเลือก ตั้งแต่ต้น (All time) สำหรับทั้งสองไฟล์',
      'JSON can include follow dates that help flag potentially incomplete lists. HTML still works for comparing lists. Check that both exports use All time.',
    ),
    mockup: <MobileFormatMockup />,
  },
  {
    id: 'm-12',
    title: t('กลับมาหน้ายืนยัน แล้วแตะ เริ่มส่งออก', 'Back on the confirmation screen, tap Start export'),
    summary: t(
      'ในหน้า ยืนยันการส่งออกของคุณ ตรวจว่าเลือกเฉพาะ ผู้ติดตามและคนที่คุณติดตาม ช่วงวันที่ ตั้งแต่ต้น และรูปแบบ JSON แล้วเลื่อนลงสุดเพื่อแตะ เริ่มส่งออก',
      'On Confirm your export, check that only Followers and following is selected, the date range is All time, and the format is JSON. Scroll to the bottom and tap Start export.',
    ),
    mockup: <MobileConfirmExportMockup configured />,
  },
  {
    id: 'm-13',
    title: t(
      'เช็กว่า ส่งคำขอแล้ว แล้วรอ Instagram เตรียมไฟล์',
      'Check for Request submitted, then wait for Instagram',
    ),
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
    tip: getExportWaitTip(t),
    mockup: <MobileExportMockup state="pending" />,
  },
  {
    id: 'm-14',
    title: t(
      'เมื่อไฟล์พร้อม กลับเข้าแอป IG หน้า ส่งออกข้อมูลของคุณ แล้วแตะ ดาวน์โหลด',
      'Return to Export your information and tap Download',
    ),
    summary: [
      t(
        'กลับเข้าแอป Instagram ไปที่ ศูนย์บัญชี → ข้อมูลและสิทธิ์การอนุญาตของคุณ → ส่งออกข้อมูลของคุณ',
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
    id: 'm-15',
    title: t('แตะดาวน์โหลดที่แถวไฟล์ ZIP', 'Tap Download next to the ZIP file'),
    summary: t(
      'ในหน้า ดาวน์โหลดไฟล์ของคุณ ให้แตะปุ่ม ดาวน์โหลด ข้างชื่อบัญชี',
      'On Download your files, tap Download next to your account name.',
    ),
    mockup: <MobileDownloadFilesMockup />,
  },
  {
    id: 'm-16',
    title: t('ยืนยันรหัสผ่านในศูนย์บัญชี', 'Confirm your password in Accounts Center'),
    summary: [
      t(
        'กรอกรหัสผ่านของบัญชีที่แสดงในศูนย์บัญชีของ Instagram แล้วแตะ ดำเนินการต่อ',
        'Enter the password for the account shown in Instagram’s Accounts Center, then tap Continue.',
      ),
      t(
        'บน Android เบราว์เซอร์จะเปิดและดาวน์โหลดไฟล์ ZIP อัตโนมัติ เมื่อดาวน์โหลดเสร็จ ให้ข้ามขั้นที่ 17–18 ไปหาไฟล์ในขั้นที่ 19',
        'On Android, your browser opens and downloads the ZIP automatically. Once it finishes, skip steps 17–18 and find the file in step 19.',
      ),
      t(
        'บน iPhone ถ้าหน้า about:blank แสดงแถบไฟล์ ZIP ที่ด้านล่าง ให้แตะ บันทึก… ข้างชื่อไฟล์',
        'On iPhone, if the about:blank page shows the ZIP in the bottom bar, tap Save… next to the file.',
      ),
    ],
    mockup: (
      <div className="grid items-center gap-4 xl:grid-cols-2">
        <MobileConfirmPasswordMockup />
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-muted">iPhone</p>
          <MobileBrowserDownloadBarMockup state="save" />
        </div>
      </div>
    ),
  },
  {
    id: 'm-17',
    title: t(
      'สำหรับ iPhone เท่านั้น — แตะ เปิดใน… เมื่อดาวน์โหลดเสร็จ',
      'iPhone only — tap Open in… when the download is complete',
    ),
    summary: t(
      'บน iPhone หลังแตะ บันทึก… ให้รอจนแถบด้านล่างขึ้นว่า ดาวน์โหลดเสร็จสมบูรณ์ แล้วแตะ เปิดใน… ข้างไฟล์ ZIP',
      'On iPhone, after tapping Save…, wait until the bottom bar says Download complete, then tap Open in… next to the ZIP.',
    ),
    mockup: <MobileBrowserDownloadBarMockup state="complete" />,
  },
  {
    id: 'm-18',
    title: t('สำหรับ iPhone เท่านั้น — เลือก บันทึกไปยัง แอปไฟล์', 'iPhone only — choose Save to Files'),
    summary: t(
      'ในเมนูแชร์ที่เปิดขึ้น ให้เลื่อนลงไปที่รายการคำสั่ง แล้วแตะ บันทึกไปยัง แอปไฟล์',
      'In the share sheet, scroll down to the list of actions and tap Save to Files.',
    ),
    mockup: <MobileShareDownloadMockup />,
  },
  {
    id: 'm-19',
    title: t('หาไฟล์ ZIP แล้วเลือกไฟล์เพื่อวิเคราะห์', 'Find and select your ZIP for analysis'),
    summary: [
      t(
        'บน iPhone ในแอปไฟล์ เลือกโฟลเดอร์ดาวน์โหลดหรือโฟลเดอร์ที่จำได้ แล้วแตะ บันทึก มุมขวาบน',
        'On iPhone, choose Downloads or another folder in Files, then tap Save at the top right.',
      ),
      t(
        'บน Android ให้ดูที่ Chrome → เมนู ⋮ → ดาวน์โหลด หรือดูรายการดาวน์โหลดในเบราว์เซอร์ที่เปิดขึ้น อีกทางคือเปิดแอปจัดการไฟล์แล้วดูโฟลเดอร์ Download',
        'On Android, check Chrome → ⋮ menu → Downloads or the Downloads list in the browser that opened. You can also check the Download folder in your file manager.',
      ),
      t(
        'กลับมาที่หน้า วิเคราะห์ไฟล์ ใน IG Follow Analyzer แตะ เลือกไฟล์ .ZIP จากเครื่อง ไปที่โฟลเดอร์ที่บันทึกไว้ แล้วแตะไฟล์ .zip ที่เพิ่งดาวน์โหลดทั้งไฟล์',
        'In IG Follow Analyzer, open Analyze ZIP and tap Choose a ZIP from your device. Go to the folder where you saved it and select the original .zip file.',
      ),
    ],
    mockup: (
      <div>
        <p className="mb-2 text-center text-sm font-semibold text-muted">iPhone</p>
        <MobileSaveDestinationMockup />
      </div>
    ),
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
      'ตั้งช่วงวันที่เป็น ตลอดเวลา (All time) แล้วคลิก บันทึก',
      'Set Date range to All time and click Save',
    ),
    summary: [
      t('กลับมาหน้ายืนยันแล้วคลิกแถว ช่วงวันที่', 'On the confirmation screen, open Date range.'),
      t('เลื่อนลงมาเลือก ตลอดเวลา แล้วคลิก บันทึก', 'Select All time, then click Save.'),
    ],
    tip: t(
      'ช่วงที่สั้นกว่าตลอดเวลา รวมถึงช่วงที่กำหนดเอง อาจทำให้บางบัญชีไม่อยู่ในไฟล์',
      'A shorter or custom date range may leave some accounts out of the export.',
    ),
    mockup: <DesktopDateRangeMockup />,
  },
  {
    id: 'w-10',
    title: t('เลือกรูปแบบ JSON แล้วคลิก บันทึก', 'Choose JSON as the format and click Save'),
    summary: t(
      'คลิกแถว รูปแบบ เปลี่ยนจาก HTML เป็น JSON แล้วคลิก บันทึก เพื่อกลับไปหน้า ยืนยันการส่งออกของคุณ',
      'Open Format, change HTML to JSON, and click Save to return to Confirm your export.',
    ),
    tip: t(
      'JSON มักมีวันที่ติดตามที่ช่วยสังเกตว่ารายชื่ออาจไม่ครบ ส่วน HTML ยังใช้เทียบรายชื่อได้ ให้ตรวจว่าเลือก ตลอดเวลา (All time) สำหรับทั้งสองไฟล์',
      'JSON can include follow dates that help flag potentially incomplete lists. HTML still works for comparing lists. Check that both exports use All time.',
    ),
    mockup: <DesktopFormatMockup />,
  },
  {
    id: 'w-11',
    title: t('กลับมาหน้ายืนยัน แล้วคลิก เริ่มส่งออก', 'Back on the confirmation screen, click Start export'),
    summary: t(
      'ในหน้า ยืนยันการส่งออกของคุณ ตรวจว่าเลือกเฉพาะ ผู้ติดตามและคนที่คุณติดตาม ช่วงวันที่ ตลอดเวลา และรูปแบบ JSON แล้วคลิก เริ่มส่งออก',
      'On Confirm your export, check that only Followers and following is selected, the date range is All time, and the format is JSON. Then click Start export.',
    ),
    mockup: <DesktopConfirmExportMockup configured />,
  },
  {
    id: 'w-12',
    title: t(
      'เช็กสถานะ แล้วคลิก ดาวน์โหลด เมื่อไฟล์พร้อม',
      'Check the status and click Download when the ZIP is ready',
    ),
    summary: [
      t(
        'หลังคลิก เริ่มส่งออก ให้กลับมาที่หน้า ส่งออกข้อมูลของคุณ → กิจกรรมปัจจุบัน ถ้าขึ้น ส่งคำขอแล้ว แสดงว่า Instagram ยังเตรียมไฟล์อยู่',
        'After clicking Start export, return to Export your information → Current activity. Request submitted means Instagram is still preparing your file.',
      ),
      t(
        'ใต้หัวข้อ ไฟล์ที่พร้อมให้ดาวน์โหลด คลิก ดาวน์โหลด ภายใน 4 วัน',
        'Under Available downloads, click Download within four days.',
      ),
    ],
    tip: getExportWaitTip(t),
    mockup: <DesktopDownloadReadyMockup />,
  },
  {
    id: 'w-13',
    title: t('คลิกดาวน์โหลดที่แถวไฟล์ ZIP', 'Click Download next to the ZIP file'),
    summary: t(
      'ในหน้า ดาวน์โหลดไฟล์ของคุณ ให้คลิกปุ่ม ดาวน์โหลด ข้างชื่อบัญชี',
      'On Download your files, click Download next to your account name.',
    ),
    mockup: <DesktopDownloadFilesMockup />,
  },
  {
    id: 'w-14',
    title: t('ยืนยันรหัสผ่านในศูนย์บัญชี', 'Confirm your password in Accounts Center'),
    summary: t(
      'กรอกรหัสผ่านของบัญชีที่แสดงในศูนย์บัญชีของ Instagram แล้วคลิก ดำเนินการต่อ เพื่อดาวน์โหลดไฟล์ ZIP',
      'Enter the password for the account shown in Instagram’s Accounts Center, then click Continue to download the ZIP.',
    ),
    mockup: <DesktopConfirmPasswordMockup />,
  },
  {
    id: 'w-15',
    title: t('หาไฟล์ ZIP แล้วเลือกไฟล์เพื่อวิเคราะห์', 'Find and select your ZIP for analysis'),
    summary: [
      t(
        'ถ้ามีหน้าต่าง บันทึกเป็น ให้เลือกโฟลเดอร์ที่หาเจอ เช่น ดาวน์โหลด (Downloads) แล้วกด บันทึก ถ้าไฟล์ถูกดาวน์โหลดอัตโนมัติ ให้ดูในโฟลเดอร์ดาวน์โหลด หรือเปิดรายการดาวน์โหลดแล้วเลือก แสดงในโฟลเดอร์',
        'If a Save as dialog opens, choose a folder you can find again, such as Downloads, and click Save. If your browser saves automatically, check Downloads or choose Show in folder in your browser’s download list.',
      ),
      t(
        'กลับมาที่หน้า วิเคราะห์ไฟล์ ของ IG Follow Analyzer แล้วคลิก เลือกไฟล์ .ZIP จากเครื่อง เปิดโฟลเดอร์ที่บันทึกไว้ แล้วเลือกไฟล์ .zip ที่เพิ่งดาวน์โหลดทั้งไฟล์ โดยไม่ต้องเปิดหรือแตกไฟล์ก่อน',
        'In IG Follow Analyzer, go to Analyze ZIP and click Choose a ZIP from your device. Open the folder where you saved it and select the original .zip file without opening or extracting it.',
      ),
    ],
    mockup: <DesktopSavedZipMockup />,
  },
];

export function HowItWorksScreen({ onNavigate, focusDateRange }: HowItWorksScreenProps) {
  const { t } = useLanguage();
  const [device, setDevice] = useState<Device>(() =>
    focusDateRange && window.matchMedia?.('(min-width: 48rem)').matches ? 'web' : 'mobile',
  );
  const steps = device === 'mobile' ? getMobileSteps(t) : getDesktopSteps(t);
  const dateRangeStep = device === 'mobile' ? 'm-10' : 'w-9';

  useEffect(() => {
    if (focusDateRange) focusGuideStep(dateRangeStep);
  }, [focusDateRange, dateRangeStep]);

  return (
    <div className="product-wrap py-9 lg:py-14">
      <BackButton onNavigate={onNavigate} target="landing" />
      <header className="border-b border-rule pb-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-[66ch]">
            <h1 className="page-heading">
              {t('วิธีขอไฟล์ ZIP จาก Instagram', 'How to export your Instagram ZIP')}
            </h1>
            <p className="text-base leading-relaxed text-ink-2">
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
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
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
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
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
        <button
          type="button"
          className="min-h-11 cursor-pointer font-semibold text-cool underline underline-offset-4"
          onClick={() => focusGuideStep(device === 'mobile' ? 'm-13' : 'w-12')}
        >
          {t('ขอไฟล์แล้ว? ดูวิธีเช็กและดาวน์โหลด', 'Already requested? Check and download your export')}
        </button>
      </div>

      <section className="pb-6" aria-labelledby="export-overview">
        <h2 id="export-overview" className="mt-6 text-xl text-ink sm:text-2xl">
          {t('ภาพรวม 3 ขั้นตอน: ขอไฟล์จนเลือก ZIP', '3-step overview: request to ZIP')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t(
            'ทำตาม 3 ขั้นนี้ก่อน แล้วเลื่อนลงเพื่อดูรายละเอียดและภาพประกอบทุกหน้าจอ',
            'Start with these three steps, then scroll for detailed instructions and screen examples.',
          )}
        </p>
        <ol className="panels mt-7 md:grid-cols-3" role="list">
          <li className="p-5">
            <p className="measured text-xs font-semibold text-accent">{t('ขั้นที่ 1', 'Step 1')}</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">
              {t('ตั้งค่าแล้วขอไฟล์', 'Set up and request the export')}
            </h3>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-ink-2">
              <li>
                {device === 'mobile'
                  ? t(
                      'เริ่มจากแอป Instagram → โปรไฟล์ → เมนูสามขีด → การตั้งค่าและกิจกรรม → ศูนย์บัญชี',
                      'Start in the Instagram app → Profile → menu → Settings and activity → Accounts Center',
                    )
                  : t(
                      'เริ่มจาก instagram.com → เพิ่มเติม → การตั้งค่า → ศูนย์บัญชี',
                      'Start at instagram.com → More → Settings → Accounts Center',
                    )}
              </li>
              <li>
                {t(
                  'เลือก ข้อมูลและสิทธิ์การอนุญาตของคุณ → ส่งออกข้อมูลของคุณ → สร้างไฟล์ส่งออก',
                  'Choose Your information and permissions → Export your information → Create export',
                )}
              </li>
              <li>
                {t(
                  'เลือกโปรไฟล์ Instagram ที่ต้องการตรวจสอบ แล้วเลือก ส่งออกไปยังอุปกรณ์',
                  'Select the Instagram profile to check, then choose Export to device',
                )}
              </li>
              <li>
                {t(
                  'แตะ ปรับแต่งข้อมูล → ล้างทั้งหมด ทุกหมวด → เลือก ผู้ติดตามและคนที่คุณติดตาม → บันทึก',
                  'Open Customize information → Clear all in every category → select Followers and following → Save',
                )}
              </li>
              <li>
                {device === 'mobile'
                  ? t(
                      'ตั้งค่า ช่วงวันที่ เป็น ตั้งแต่ต้น (All time) และ รูปแบบ เป็น JSON เมื่อบันทึกแล้ว ให้กลับมาหน้ายืนยันและแตะ เริ่มส่งออก',
                      'Set Date range to All time and Format to JSON. After saving, return to the confirmation screen and tap Start export',
                    )
                  : t(
                      'ตั้งค่า ช่วงวันที่ เป็น ตลอดเวลา (All time) และ รูปแบบ เป็น JSON เมื่อบันทึกแล้ว ให้กลับมาหน้ายืนยันและคลิก เริ่มส่งออก',
                      'Set Date range to All time and Format to JSON. After saving, return to the confirmation screen and click Start export',
                    )}
              </li>
            </ul>
          </li>

          <li className="p-5">
            <p className="measured text-xs font-semibold text-accent">{t('ขั้นที่ 2', 'Step 2')}</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">
              {t('รอแล้วเช็กสถานะ', 'Wait and check the status')}
            </h3>
            <p className="mt-2 text-sm text-ink-2">
              {t(
                'กลับไปที่ กิจกรรมปัจจุบัน จนเห็นว่าไฟล์พร้อมให้ดาวน์โหลด',
                'Return to Current activity and wait until the file is ready to download.',
              )}
            </p>
          </li>

          <li className="p-5">
            <p className="measured text-xs font-semibold text-accent">{t('ขั้นที่ 3', 'Step 3')}</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">
              {t('ดาวน์โหลดแล้วเลือก ZIP', 'Download and select the ZIP')}
            </h3>
            <p className="mt-2 text-sm text-ink-2">
              {t(
                'ดาวน์โหลดไฟล์ .zip แล้วกลับมาที่หน้านี้เพื่อเลือกไฟล์โดยไม่ต้องแตกไฟล์',
                'Download the .zip, then return here and select it without extracting the archive.',
              )}
            </p>
          </li>
        </ol>
      </section>

      {/* Steps List */}
      <ol id="export-steps" className="divide-y divide-rule" role="list">
        {steps.map((step, index) => (
          <li
            key={step.id}
            id={step.id}
            tabIndex={
              step.id === dateRangeStep || ['m-13', 'm-19', 'w-12'].includes(step.id)
                ? -1
                : undefined
            }
            className="grid scroll-mt-(--nav-bar-height) grid-cols-1 gap-8 py-9 lg:grid-cols-12 lg:items-center"
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
                    <li key={idx}>{underlineStepText(item)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-base leading-relaxed text-ink-2">
                  {underlineStepText(step.summary)}
                </p>
              )}

              {step.id === 'm-16' && (
                <button
                  type="button"
                  className="mt-2 min-h-11 cursor-pointer text-start font-semibold text-cool underline underline-offset-4"
                  onClick={() => focusGuideStep('m-19')}
                >
                  {t('Android · ไปขั้นที่ 19 เพื่อหาไฟล์ ZIP', 'Android · Go to step 19 to find your ZIP')}
                </button>
              )}

              {step.tip && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-accent bg-accent-soft p-4 text-sm leading-relaxed text-ink">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span>{underlineStepText(step.tip)}</span>
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
                'ขั้นตอนอิงจากศูนย์ช่วยเหลือของ Instagram เมื่อไฟล์พร้อม คุณดาวน์โหลดได้จากแท็บ กิจกรรมปัจจุบัน ภายใน 4 วัน',
                'The steps follow Instagram’s Accounts Center export guide. When your file is ready, you can download it from Current activity within four days.',
              )}
            </p>
          </div>
          <div>
            <a
              href="https://help.instagram.com/181231772500920"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary shrink-0 whitespace-nowrap"
            >
              <span>{t('อ่านคู่มือ Instagram Help Center', 'Read Instagram Help Center')}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
