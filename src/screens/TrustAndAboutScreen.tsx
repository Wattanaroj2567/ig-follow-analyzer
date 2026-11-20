import { ChevronDown, ExternalLink, FileText, History, Star } from 'lucide-react';
import { useState } from 'react';
import type { PageId } from '../components/AppShell';
import { FeedbackForm } from '../components/FeedbackForm';
import { NormalButton } from '../components/NormalButton';
import { ReviewForm } from '../components/ReviewForm';
import { useLanguage } from '../lib/language';
import { getReviewEndpoint } from '../lib/review';
import { pageHref } from '../lib/routes';

export function TermsAndFaqScreen({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sections = [
    {
      id: 'terms-of-use',
      heading: t('เงื่อนไขการใช้งาน', 'Terms of use'),
      items: [
        {
          label: t('ใช้ไฟล์จากบัญชีของคุณเอง', 'Use an export from your own account'),
          detail: t(
            'ใช้ไฟล์ ZIP ที่ขอจาก Instagram เพื่อวิเคราะห์รายชื่อผู้ติดตามและบัญชีที่คุณกำลังติดตาม ใช้งานได้โดยไม่ต้องสมัครสมาชิก เข้าสู่ระบบ หรือให้รหัสผ่าน Instagram',
            'Use your Instagram ZIP to review your followers and the accounts you follow. You can use the site without creating an account, signing in, or sharing your Instagram password.',
          ),
        },
        {
          label: t('คุณเป็นผู้จัดการบัญชีและไฟล์', 'You manage your account and files'),
          detail: t(
            'หากต้องการติดตามหรือเลิกติดตามบัญชี ให้ทำด้วยตัวเองบน Instagram ส่วนไฟล์ ZIP และ PDF ที่ดาวน์โหลดไว้ คุณเลือกเก็บหรือลบได้เอง',
            'To follow or unfollow an account, do so directly on Instagram. You decide where to store the ZIP and PDF files you download and when to delete them.',
          ),
        },
        {
          label: t('เครื่องมืออิสระ', 'Independent tool'),
          detail: t(
            'IG Follow Analyzer ไม่มีส่วนเกี่ยวข้องกับ Instagram หรือ Meta และไม่ได้รับการรับรองจากทั้งสองบริษัท',
            'IG Follow Analyzer is unaffiliated with Instagram or Meta and is not endorsed by either company.',
          ),
        },
      ],
    },
    {
      id: 'privacy',
      heading: t('ความเป็นส่วนตัว', 'Privacy'),
      items: [
        {
          label: t('ไฟล์ ZIP รายชื่อ และรายงาน PDF', 'ZIP files, account lists, and PDF reports'),
          detail: t(
            'เบราว์เซอร์อ่านไฟล์ คำนวณผล และสร้างรายงาน PDF บนอุปกรณ์ของคุณ ไฟล์ ZIP และรายชื่อจากการวิเคราะห์จะไม่ถูกส่งไปยังเซิร์ฟเวอร์',
            'Your browser reads the ZIP, compares account lists, and creates the PDF on your device. It does not send the ZIP or account lists from your analysis to a server.',
          ),
        },
        {
          label: t('ประวัติย้อนหลังปิดไว้ตั้งแต่แรก', 'History is off by default'),
          detail: t(
            'หากเปิดใช้ประวัติ เบราว์เซอร์นี้จะเก็บสถิติสรุปและข้อมูลไฟล์ การเก็บรายชื่อเพื่อดูและเปรียบเทียบย้อนหลังต้องเปิดอีกตัวเลือก ข้อมูลจะไม่ซิงก์ข้ามอุปกรณ์',
            'If you turn on history, this browser stores summary counts and file details. Saving account lists for later review and comparison requires a second opt-in. History does not sync across devices.',
          ),
        },
        {
          label: t('ข้อความที่ส่งผ่านแบบฟอร์มความคิดเห็น', 'Feedback you choose to send'),
          detail: t(
            'เมื่อส่งความคิดเห็นจากหน้าเกี่ยวกับเรา แบบฟอร์มจะส่งหมวดหมู่ ข้อความ ระบบปฏิบัติการ เบราว์เซอร์ และขนาดพื้นที่แสดงผลของหน้าเว็บ ไปยัง Google Forms',
            'When you submit feedback from the About page, the form sends your category, message, operating system, browser, and viewport size to Google Forms.',
          ),
        },
        {
          label: t('คะแนนและข้อความรีวิว', 'Ratings and review comments'),
          detail: t(
            'แบบฟอร์มส่งคะแนน ชื่อ และข้อความที่คุณกรอกไปยัง Google Forms เว็บไซต์ใช้รหัสสุ่มที่เก็บในเบราว์เซอร์และชีตส่วนตัวเพื่อกันคะแนนซ้ำจากเบราว์เซอร์เดิม หน้าแรกแสดงคะแนนเฉลี่ยและจำนวนคะแนน รวมถึงชื่อและข้อความที่ได้รับอนุญาตและผ่านการคัดกรองอัตโนมัติ',
            'The form sends your rating, name, and any comment you enter to Google Forms. A random ID stored in your browser and a private spreadsheet helps prevent duplicate ratings from that browser. The homepage shows the average and number of ratings, plus comments and names that were authorized and pass automated screening.',
          ),
        },
      ],
    },
  ];

  const faqs: { q: string; a: string; link?: { page: PageId; label: string } }[] = [
    {
      q: t(
        'ต้องกรอกรหัสผ่าน Instagram หรือเสี่ยงโดนระงับบัญชีไหม?',
        'Do I need to enter my Instagram password, or could my account be suspended?',
      ),
      a: t(
        'ไม่ต้องกรอกรหัสผ่านและไม่มีระบบล็อกอินครับ เว็บนี้ไม่เชื่อม Instagram API และไม่กดติดตามหรือเลิกติดตามแทนคุณ ทุกอย่างใช้เฉพาะไฟล์ .zip ทางการที่คุณขอจากศูนย์บัญชี Instagram ด้วยตัวเอง จึงไม่เสี่ยงโดนแบนเหมือนแอปภายนอกที่ขอรหัสผ่าน',
        'No password or login is ever required. This app does not use the Instagram API and never follows or unfollows anyone on your behalf. It only reads the official .zip file you request from Instagram Accounts Center yourself.',
      ),
    },
    {
      q: t(
        'ไฟล์ .zip และรายชื่อผู้ติดตามถูกส่งขึ้นเซิร์ฟเวอร์ไหม?',
        'Are my .zip file or follower lists uploaded to a server?',
      ),
      a: t(
        'ไม่ส่งครับ การแตกไฟล์ .zip และคำนวณรายชื่อทั้งหมดทำงานภายในเบราว์เซอร์บนเครื่องคุณ 100% ไฟล์จะไม่ถูกอัปโหลดออกไปที่เซิร์ฟเวอร์ใด ๆ',
        'Never. Unzipping and comparing your follower lists run 100% locally inside your browser. Your archive never leaves your device.',
      ),
    },
    {
      q: t(
        'ต้องขอไฟล์แบบไหนจาก Instagram และต้องรอนานแค่ไหน?',
        'Which export settings should I choose on Instagram, and how long does it take?',
      ),
      a: t(
        'เลือกเฉพาะหมวด “ผู้ติดตามและกำลังติดตาม” ตั้งช่วงเวลาเป็น “ตลอดเวลา (All time)” และเลือกรูปแบบ JSON ระยะเวลารอขึ้นอยู่กับคิวของระบบ Meta (ตั้งแต่ไม่กี่นาทีจนถึงหลายชั่วโมง) ระหว่างรอปิดแอปไปทำอย่างอื่นได้เลย เมื่อได้ไฟล์ .zip แล้วนำมาเลือกในเว็บได้ทันทีโดยไม่ต้องแตกไฟล์',
        'Select Followers and following only, set the date range to All time, and choose JSON. Wait times depend on Meta’s queue (from a few minutes to several hours), and you can close Instagram while waiting. Once downloaded, upload the .zip directly without unzipping it.',
      ),
      link: {
        page: 'how-it-works',
        label: t('ดูวิธีขอไฟล์จาก Instagram', 'See how to export from Instagram'),
      },
    },
    {
      q: t(
        'ถ้าขอไฟล์มาเป็นแบบ HTML แทน JSON ใช้ได้ไหม? ต่างกันอย่างไร?',
        'Can I upload an HTML export instead of JSON? What is the difference?',
      ),
      a: t(
        'ใช้ได้ครับ แยกครบทั้ง 5 หมวด (ผู้ติดตาม, กำลังติดตาม, ไม่ติดตามกลับ, คุณไม่ได้ติดตามกลับ, ติดตามกันสองฝ่าย) เหมือนกัน แต่ไฟล์ HTML จะไม่มีข้อมูลวันที่เริ่มติดตาม และระบบไม่สามารถเตือนอัตโนมัติได้หากลืมเลือกช่วงเวลา “ตลอดเวลา” จึงแนะนำให้เลือก JSON จะครบที่สุด',
        'Yes—HTML exports still separate all five relationship categories accurately. However, HTML files lack usable follow dates and cannot trigger automatic partial-export warnings, so JSON is recommended for the fullest details.',
      ),
    },
    {
      q: t(
        'ทำไมยอดผู้ติดตามต่างจากหน้าโปรไฟล์?',
        'Why does my follower count differ from my Instagram profile?',
      ),
      a: t(
        'มักเกิดจาก 3 สาเหตุหลัก: (1) ตอนขอไฟล์ไม่ได้เปลี่ยนช่วงเวลาเป็น “ตลอดเวลา (All time)” ค่าเริ่มต้นของ Instagram จะส่งมาเฉพาะ 1 ปีล่าสุดทำให้ยอดหายไปเยอะ (2) บัญชีที่ปิดใช้งานชั่วคราว ถูกลบ หรือถูกระงับ อาจยังถูกนับบนหน้าโปรไฟล์แต่ไม่ติดมาในไฟล์ .zip และ (3) ไฟล์เป็นข้อมูล ณ เวลาที่กดส่งคำขอ ไม่ใช่แบบ Real-time หากยอดต่างกันมาก แนะนำขอไฟล์ใหม่โดยเลือกช่วงเวลา “ตลอดเวลา”',
        'There are three common reasons: (1) the export date range was left at Instagram’s default (“Last year”) instead of “All time,” which omits older followers; (2) deactivated, deleted, or suspended accounts may still be counted on your live profile but excluded from the ZIP; and (3) the ZIP is a snapshot from the moment you requested it, not live data. If the gap is large, request a new export set to “All time.”',
      ),
      link: {
        page: 'how-it-works',
        label: t('ดูวิธีตั้งค่าช่วงเวลา “ตลอดเวลา”', 'See how to select “All time”'),
      },
    },
    {
      q: t('จะรู้ได้อย่างไรว่าใครเพิ่งเลิกติดตามเราไป?', 'How can I see who recently unfollowed me?'),
      a: t(
        'เปิดทั้งสองสวิตช์ในหน้า “ประวัติบนเครื่อง” แล้ววิเคราะห์ ZIP รอบแรกเพื่อบันทึกรายชื่อ เมื่ออัปโหลด ZIP ใหม่ของบัญชีเดิมในเบราว์เซอร์เดิม ระบบจะเทียบกับรอบก่อนให้อัตโนมัติและแสดงชื่อ ZIP ทั้งคู่ ถ้ามีรายชื่อบันทึกไว้หลายรอบ ให้กด “เปลี่ยนไฟล์ย้อนหลัง” ในหน้าผลล่าสุด แล้วดูว่ามีใครติดตามใหม่หรือหายจากรายชื่อระหว่างสองไฟล์',
        'Turn on both History settings and analyze your first ZIP to save its account lists. When you upload a newer ZIP for the same account in the same browser, the app compares it with the previous export and shows both filenames. If you have several earlier lists, select “Change previous export” in your latest results to see new and missing followers between the two exports.',
      ),
      link: { page: 'history', label: t('ไปที่หน้าประวัติบนเครื่อง', 'Open History settings') },
    },
    {
      q: t(
        'ใช้ตรวจหลายบัญชี Instagram ในเครื่องเดียวกันได้ไหม?',
        'Can I analyze multiple Instagram accounts on the same device?',
      ),
      a: t(
        'ได้ครับ แนะนำให้คงชื่อไฟล์ .zip เดิมที่ Instagram ตั้งให้ (เช่น instagram-ชื่อบัญชี-2026-11-20.zip) ระบบจะอ่านชื่อบัญชีจากชื่อไฟล์แล้วแยกประวัติและการเทียบคนเพิ่งเลิกติดตามของแต่ละบัญชีออกจากกันโดยอัตโนมัติไม่ปนกัน',
        'Yes. Keep the original filename from Instagram (for example, instagram-username-2026-11-20.zip) so the app can automatically isolate saved history and unfollower comparisons per account.',
      ),
    },
    {
      q: t(
        'ประมวลผลและเก็บประวัติในเครื่อง จะหนักเครื่องหรือเปลืองพื้นที่มือถือไหม?',
        'Does local processing or saved history slow down my device or use much storage?',
      ),
      a: t(
        'เบามากครับ หน้าเว็บทั่วไปใช้ RAM ประมาณ 5–15 MB การวิเคราะห์บัญชีขนาดทั่วไป (1,000–10,000 รายชื่อ) ใช้เวลาไม่ถึง 0.2 วินาทีและคืน RAM ทันทีหลังอ่านไฟล์เสร็จ ส่วนประวัติบนเครื่องจะปิดเป็นค่าเริ่มต้น (0 KB) และหากเปิดใช้จะเก็บเฉพาะข้อความรายชื่อกับตัวเลข ไม่มีรูปหรือวิดีโอ ใช้พื้นที่เพียงไม่กี่สิบถึงไม่กี่ร้อย KB (รองรับไฟล์ .zip สูงสุด 200 MB แนะนำเลือกเฉพาะหมวดผู้ติดตามเพื่อให้ไฟล์เล็กและไวที่สุด)',
        'It stays very light: normal pages use around 5–15 MB of memory, typical accounts (1,000–10,000 entries) finish parsing in under 0.2 seconds, and temporary worker memory is freed right after parsing. Local history is off by default (0 KB), and when enabled it stores text-only counts and usernames—no photos or videos—taking only a few dozen to a few hundred KB (ZIP limit: 200 MB; selecting Followers and following only keeps exports tiny and fast).',
      ),
    },
    {
      q: t(
        'เปิดดูโปรไฟล์ IG และดาวน์โหลดรายงาน PDF ทำอย่างไร? รองรับภาษาอะไรบ้าง?',
        'How do I open profiles or export a PDF report? Which languages are supported?',
      ),
      a: t(
        'ในตารางผลวิเคราะห์สามารถกดลิงก์ของแต่ละบัญชีเพื่อเปิดหน้าโปรไฟล์จริงบน Instagram ได้ทันที (เว็บไม่ดึงรูปโปรไฟล์จากภายนอกเพื่อรักษาความเป็นส่วนตัว) และสามารถกด “สร้างรายงาน PDF” เพื่อเลือกหัวข้อ เลือกภาษาของเอกสารได้ทั้งภาษาไทยและภาษาอังกฤษ แล้วดาวน์โหลดเป็นไฟล์ A4 ลงเครื่องได้โดยตรง',
        'Click any account link in the results table to open its live Instagram profile (profile pictures are not fetched externally to protect privacy). You can also open the PDF Report screen to choose sections, pick Thai or English for the document, and download an A4 PDF directly to your device.',
      ),
    },
    {
      q: t(
        'จะลบประวัติที่เคยบันทึกไว้อย่างไร? และถ้าล้างข้อมูลเบราว์เซอร์จะเกิดอะไรขึ้น?',
        'How do I delete saved history, and what happens if I clear browser data?',
      ),
      a: t(
        'ในหน้าประวัติสามารถลบทีละรายการ หรือกด “ล้างประวัติทั้งหมด” แล้วยืนยันเพื่อลบข้อมูลทั้งหมดในเบราว์เซอร์และปิดสวิตช์ทั้งสองข้อทันที หากคุณล้างข้อมูลเว็บไซต์/คุกกี้ของเบราว์เซอร์ ประวัติบนเครื่องก็จะถูกลบไปด้วย ส่วนไฟล์ .zip และรายงาน PDF ที่ดาวน์โหลดเก็บไว้ในเครื่องจะยังคงอยู่ตามปกติ',
        'On the History page, you can delete individual runs or select Clear all history and confirm to erase everything in the browser and turn both toggles off. Clearing browser site data also removes saved history, while any .zip or PDF files downloaded to your device remain untouched.',
      ),
      link: { page: 'history', label: t('เปิดหน้าประวัติ', 'Open History') },
    },
  ];

  return (
    <div className="product-wrap max-w-5xl py-9 lg:py-14">
      <h1 className="text-2xl text-ink sm:text-4xl">
        {t('เงื่อนไขการใช้งาน', 'Terms,')}{' '}
        <span className="whitespace-nowrap">{t('ความเป็นส่วนตัว', 'privacy,')}</span>{' '}
        {t('และคำถามที่พบบ่อย', 'and frequently asked questions')}
      </h1>

      <div className="panels mt-7 md:grid-cols-2">
        {sections.map(({ id, heading, items }) => (
          <section key={id} aria-labelledby={id} className="p-5 sm:p-7">
            <h2 id={id} className="text-xl text-ink">
              {heading}
            </h2>
            <dl className="mt-4 space-y-4 border-t border-rule pt-4 text-sm leading-relaxed">
              {items.map(({ label, detail }) => (
                <div key={label}>
                  <dt className="font-semibold text-ink">{label}</dt>
                  <dd className="mt-1 text-ink-2">{detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section aria-labelledby="faq-heading" className="mt-9">
        <h2 id="faq-heading" className="text-xl text-ink">
          {t('คำถามที่พบบ่อย', 'Frequently asked questions')}
        </h2>
        <div className="mt-4 divide-y divide-rule border-y border-rule">
          {faqs.map(({ q, a, link }, idx) => {
            const expanded = openFaq === idx;
            const answerId = `faq-answer-${idx}`;
            return (
              <div key={answerId}>
                <h3 className="font-sans">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(expanded ? null : idx)}
                    className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-4 py-3 text-left text-sm font-semibold text-ink hover:text-accent sm:text-base"
                  >
                    <span>{q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted motion-safe:transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={answerId}
                  hidden={!expanded}
                  className="max-w-[72ch] pb-4 pr-6 text-sm leading-relaxed text-ink-2"
                >
                  <p>{a}</p>
                  {link && (
                    <a
                      href={pageHref(link.page)}
                      onClick={(event) => {
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                          return;
                        event.preventDefault();
                        onNavigate(link.page);
                      }}
                      className="mt-2 inline-block font-medium text-accent underline underline-offset-4"
                    >
                      {link.label}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function AboutScreen({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  const { t } = useLanguage();
  const reviewEndpoint = getReviewEndpoint();
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="product-wrap py-9 lg:py-14">
      <header className="border-b border-rule pb-8">
        <h1 className="max-w-[26ch] text-3xl leading-[1.2] text-ink sm:text-5xl">
          {t('ทำไมเราถึงสร้าง', 'Why we built')}{' '}
          <span className="inline-block max-w-full">IG Follow Analyzer</span>
        </h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-pretty text-ink-2">
          {t(
            'เวลายอดผู้ติดตามลดลง ตัวเลขบอกได้แค่ว่าลดไปเท่าไร การจะรู้ว่าบัญชีไหนหายไปต้องเทียบรายชื่อจากสองช่วงเวลา เราจึงสร้างเครื่องมือนี้เพื่อให้คุณเทียบรายชื่อจากไฟล์ที่ขอจาก Instagram ได้ง่ายขึ้น',
            'A drop in your follower count tells you how much it changed. To see which accounts are missing, you need to compare two follower lists. We built this tool to make that easier with the files you request from Instagram.',
          )}
        </p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
          <span>{t('สร้างโดย', 'Created by')}</span>
          <a
            href="https://github.com/Wattanaroj2567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-medium text-cool underline underline-offset-4 hover:text-ink"
          >
            Wattanaroj Butdee (GitHub)
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        </p>
      </header>

      <section className="mt-8" aria-labelledby="about-design-heading">
        <h2 id="about-design-heading" className="text-xl text-ink">
          {t('หลักที่เราใช้ในการออกแบบ', 'What guides our design')}
        </h2>
        <div className="panels mt-4 md:grid-cols-2">
          <div className="flex flex-col p-5 sm:p-6">
            <FileText className="size-6 text-cool" aria-hidden="true" />
            <h3 className="mt-3 text-lg text-ink">
              {t('ใช้ไฟล์ที่คุณขอเอง', 'Use the export you request')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {t(
                'ไฟล์ ZIP จาก Instagram มีรายชื่อที่ใช้วิเคราะห์อยู่แล้ว เราจึงให้เบราว์เซอร์อ่านไฟล์และเทียบรายชื่อบนเครื่องของคุณโดยไม่ต้องเชื่อมบัญชีหรือกรอกรหัสผ่าน',
                'Your Instagram ZIP contains the lists the tool needs. Your browser reads and compares them on your device without connecting to your account or asking for your password.',
              )}
            </p>
            <div className="mt-auto pt-4">
              <NormalButton variant="secondary" onClick={() => onNavigate('how-it-works')}>
                {t('ดูคู่มือขอไฟล์', 'Export guide')}
              </NormalButton>
            </div>
          </div>
          <div className="flex flex-col p-5 sm:p-6">
            <History className="size-6 text-accent" aria-hidden="true" />
            <h3 className="mt-3 text-lg text-ink">
              {t('คุณเลือกได้ว่าจะเก็บอะไร', 'You choose what to keep')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {t(
                'ประวัติปิดไว้ตั้งแต่แรก คุณเลือกบันทึกเฉพาะสรุป หรือเปิดเพิ่มเพื่อเก็บรายชื่อในเบราว์เซอร์นี้ไว้เปิดดูและเลือก ZIP เทียบย้อนหลังได้ คุณล้างประวัติได้ทุกเมื่อ',
                'History is off by default. You can save summaries in this browser and separately opt in to keeping account lists so you can reopen results and choose an earlier ZIP to compare. You can clear your history at any time.',
              )}
            </p>
            <div className="mt-auto pt-4">
              <NormalButton variant="secondary" onClick={() => onNavigate('history')}>
                {t('ตั้งค่าประวัติบนเครื่อง', 'Local history settings')}
              </NormalButton>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm leading-relaxed text-muted">
            {t(
              'IG Follow Analyzer เป็นเครื่องมืออิสระ ไม่มีส่วนเกี่ยวข้องกับ Instagram หรือ Meta',
              'IG Follow Analyzer is an independent tool with no affiliation with Instagram or Meta.',
            )}
          </p>
          <a
            href={pageHref('terms')}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onNavigate('terms');
            }}
            className="inline-flex min-h-11 items-center text-sm font-medium text-cool underline underline-offset-4 hover:text-ink"
          >
            {t('อ่านเงื่อนไขและความเป็นส่วนตัว', 'Read Terms and Privacy')}
          </a>
        </div>
      </section>

      <section
        aria-labelledby="review-heading"
        className="mt-8 rounded-[10px] border border-rule bg-paper-2"
      >
        <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-3">
            <Star className="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 id="review-heading" className="text-xl text-ink">
                {t('รีวิวการใช้งาน', 'Review your experience')}
              </h2>
              <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-muted">
                {t(
                  'ให้คะแนน 1–5 ดาวและกรอกชื่อแสดงผล เขียนข้อความเพิ่มเติมได้ตามสะดวก',
                  'Give a rating from 1 to 5 stars and enter a display name. You can also leave a comment.',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--secondary shrink-0"
            aria-expanded={reviewOpen}
            aria-controls="review-form"
            onClick={() => setReviewOpen((open) => !open)}
          >
            {reviewOpen ? t('ซ่อนแบบฟอร์ม', 'Hide review form') : t('เขียนรีวิว', 'Write a review')}
            <ChevronDown
              className={`size-4 shrink-0 ${reviewOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <div id="review-form" hidden={!reviewOpen} className="border-t border-rule p-6 sm:p-8">
          <ReviewForm endpoint={reviewEndpoint} />
        </div>
      </section>
      <FeedbackForm />
    </div>
  );
}
