import { ArrowRight, ExternalLink } from 'lucide-react';
import { NormalButton } from '../components/NormalButton';
import type { PageId } from '../components/AppShell';
import { useLanguage } from '../lib/language';

export function ExportComparisonScreen({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  const { t } = useLanguage();

  return (
    <div className="product-wrap pt-3 pb-9 lg:pt-4 lg:pb-14">
      <header className="max-w-[68ch]">
        <h1 id="export-comparison" className="page-heading">
          {t('ล็อกอิน Instagram กับใช้ไฟล์ ZIP ต่างกันอย่างไร?', 'Instagram Login or ZIP export?')}
        </h1>
        <p className="text-base leading-relaxed text-ink-2">
          {t(
            'API ทางการของ Instagram อ่านจำนวนผู้ติดตามได้ แต่ไม่มีรายชื่อที่ใช้ตรวจว่าใครไม่ติดตามกลับ เว็บนี้จึงใช้ไฟล์ ZIP จากศูนย์บัญชี',
            'Instagram’s official API can read follower counts, but it doesn’t provide the lists needed to see who doesn’t follow back. This tool uses your Accounts Center ZIP.',
          )}
        </p>
      </header>

      <div className="panels mt-7">
        <table
          aria-labelledby="export-comparison"
          className="w-full table-fixed border-collapse text-left text-sm leading-relaxed wrap-anywhere [&_td]:px-2 [&_td]:py-3 [&_th]:px-2 [&_th]:py-3 sm:[&_td]:px-5 sm:[&_th]:px-5"
        >
          <thead className="border-b border-rule bg-paper-3">
            <tr>
              <th scope="col" className="w-[23%]">
                {t('หัวข้อ', 'Topic')}
              </th>
              <th scope="col">
                {t('Instagram Login (API ทางการ)', 'Instagram Login (official API)')}
              </th>
              <th scope="col" className="text-accent">
                IG Follow Analyzer (ZIP)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule align-top text-ink-2">
            {[
              {
                topic: t('ใช้กับบัญชีไหน', 'Who can use it'),
                api: t(
                  'บัญชีมืออาชีพ (ธุรกิจหรือครีเอเตอร์)',
                  'Professional accounts (business or creator)',
                ),
                zip: t(
                  'บัญชีส่วนตัวและบัญชีมืออาชีพที่ขอไฟล์ได้',
                  'Personal and professional accounts that can export their data',
                ),
              },
              {
                topic: t('ทำอะไรได้', 'What it can do'),
                api: t(
                  'จัดการโพสต์ คอมเมนต์ และข้อความตามสิทธิ์ที่อนุญาต และอ่านจำนวนผู้ติดตามได้',
                  'Manage posts, comments, and messages with permission, and read follower counts',
                ),
                zip: t(
                  'เทียบรายชื่อเพื่อดูว่าใครไม่ติดตามกลับ หรือเทียบ ZIP สองรอบเพื่อดูรายชื่อที่เปลี่ยนไป',
                  'Compare lists to see who doesn’t follow back, or compare two exports to see what changed',
                ),
              },
              {
                topic: t('ข้อจำกัด', 'Limits'),
                api: t(
                  'ไม่มีรายชื่อว่าใครติดตามคุณหรือคุณกำลังติดตามใครให้แอปดึงมาเทียบ',
                  'Doesn’t provide lists of who follows you or whom you follow',
                ),
                zip: t(
                  'ผลอิงข้อมูลในไฟล์ ถ้าอยากดูข้อมูลล่าสุด ต้องขอ ZIP ใหม่',
                  'Results reflect what’s in the file. Request a new ZIP for updated results.',
                ),
              },
              {
                topic: t('เริ่มอย่างไร', 'How to start'),
                api: t(
                  'ลงชื่อเข้าใช้ผ่าน Instagram แล้วอนุญาตสิทธิ์ให้แอปที่เชื่อมต่อ',
                  'Sign in through Instagram and grant permissions to the connected app',
                ),
                zip: t(
                  'ขอไฟล์จากศูนย์บัญชี รอให้พร้อม แล้วดาวน์โหลดมาเลือกในเว็บ เว็บอ่านไฟล์บนเครื่องคุณ',
                  'Request the ZIP in Accounts Center, wait for it, then download and select it here. The file is read on your device.',
                ),
              },
            ].map(({ topic, api, zip }) => (
              <tr key={topic}>
                <th scope="row" className="font-semibold text-ink">
                  {topic}
                </th>
                <td>{api}</td>
                <td>{zip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-[76ch] text-sm leading-relaxed text-ink-2">
        {t(
          'การดึงข้อมูลอัตโนมัติโดยไม่ได้รับอนุญาตอาจทำให้บัญชีถูกจำกัดหรือระงับได้ IG Follow Analyzer อ่านไฟล์ ZIP บนเครื่องคุณโดยไม่ต้องเชื่อมบัญชี',
          'Collecting Instagram data automatically without permission can lead to account restrictions or suspension. IG Follow Analyzer reads the ZIP on your device without connecting to your account.',
        )}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <NormalButton variant="primary" onClick={() => onNavigate('how-it-works')}>
          {t('ดูวิธีขอไฟล์ ZIP', 'View the ZIP export guide')}
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </NormalButton>
        <a
          href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/"
          className="inline-flex items-center gap-1 text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          {t('เอกสาร Instagram Login ของ Meta', 'Meta’s Instagram Login documentation')}
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
