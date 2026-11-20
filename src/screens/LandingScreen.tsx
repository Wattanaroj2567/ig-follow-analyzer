import { ChevronDown, FileText, ListChecks, ShieldCheck, Upload, UserMinus } from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { AddToHomeGuide } from '../components/AddToHomeGuide';
import type { PageId } from '../components/AppShell';
import { pageHref } from '../lib/routes';
import type { AnalysisResult } from '../types/analyzer';
import { type Translator, useLanguage } from '../lib/language';
import { LandingPreview } from './LandingPreview';
import { LocalHistoryPreview } from './LocalHistoryPreview';

interface LandingScreenProps {
  demo: AnalysisResult;
  onNavigate: (id: PageId) => void;
  onOpenDemo: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(
    () =>
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      prefersReducedMotion(),
  );

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}

function AnimatedStatNumber({
  target,
  suffix = '',
  visible,
}: {
  target: number;
  suffix?: string;
  visible: boolean;
}) {
  const [value, setValue] = useState(() => (visible || target === 0 ? target : 0));

  useEffect(() => {
    if (!visible || target === 0) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, visible]);

  return (
    <>
      {value.toLocaleString('th-TH')}
      {suffix}
    </>
  );
}

const getLandingFaqs = (t: Translator) => [
  {
    q: t('ทำไมไม่แสดงรูปโปรไฟล์ของแต่ละบัญชี?', 'Why are profile pictures missing?'),
    a: t(
      'ไฟล์ .zip ที่ส่งออกจาก Instagram มีเฉพาะชื่อบัญชีและวันที่ติดตาม ไม่มีรูปโปรไฟล์ของคนอื่นติดมาด้วย และเว็บนี้ไม่ยิงคำขอไปดึงรูปจากภายนอกเพื่อรักษาความเป็นส่วนตัว 100% บนเครื่องคุณ แต่สามารถกดลิงก์ในตารางเพื่อเปิดดูหน้าโปรไฟล์จริงของแต่ละคนบน Instagram ได้ทันทีครับ',
      'The export contains usernames and may include follow dates. It does not include other accounts’ profile pictures, and this app does not fetch them. You can open an account’s Instagram profile from the table.',
    ),
  },
  {
    q: t(
      'ต้องกรอกรหัสผ่าน Instagram หรือเชื่อมบัญชีกับเว็บนี้ไหม?',
      'Do I need to enter my Instagram password or connect my account?',
    ),
    a: t(
      'ไม่ต้องครับ เว็บนี้ไม่มีระบบล็อกอินและไม่ขอรหัสผ่านใดๆ ทุกขั้นตอนใช้แค่ไฟล์ .zip ที่คุณส่งออกเองจากศูนย์บัญชี Instagram',
      'Everything runs from the ZIP you export from Instagram Accounts Center. The app has no login and never asks for your password.',
    ),
  },
  {
    q: t('ไฟล์ข้อมูลผู้ติดตามถูกอัปโหลดไปที่เซิร์ฟเวอร์หรือเปล่า?', 'Is my followers file uploaded to a server?'),
    a: t(
      'ไม่ส่งขึ้นเซิร์ฟเวอร์ครับ การเปิดอ่านไฟล์ .zip และวิเคราะห์รายชื่อทั้งหมดทำงานภายในเบราว์เซอร์เครื่องคุณเท่านั้น',
      'Your browser opens the ZIP and analyzes the lists on your device. The file never leaves your browser.',
    ),
  },
  {
    q: t('ทำไมการขอไฟล์ดูยุ่งยากและต้องรอนาน?', 'Why does the export take time?'),
    a: t(
      'เพราะเป็นวิธีทางการของ Instagram ที่ไม่ต้องขอรหัสผ่านและไม่เสี่ยงโดนระงับบัญชีครับ ระยะเวลารอขึ้นอยู่กับคิวของระบบ Meta (ตั้งแต่ไม่กี่นาทีไปจนถึงหลายชั่วโมง) การเลือกเฉพาะหมวด ผู้ติดตามและกำลังติดตาม + ช่วงวันที่ ตลอดเวลา + รูปแบบ JSON จะช่วยให้ไฟล์เล็กที่สุดและเสร็จไวขึ้นครับ',
      'Instagram builds the export for you. It can take anywhere from a few minutes to several hours. To keep it small, select only Followers and following, set the date range to All time, and choose JSON.',
    ),
  },
];

export function LandingScreen({ demo, onNavigate, onOpenDemo }: LandingScreenProps) {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const useCasesReveal = useRevealOnScroll<HTMLUListElement>();
  const stepsReveal = useRevealOnScroll<HTMLOListElement>();
  const statsReveal = useRevealOnScroll<HTMLDivElement>();
  const closingReveal = useRevealOnScroll<HTMLDivElement>();

  const go = (id: PageId) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(id);
  };

  return (
    <>
      {/* 1. Hero Stage */}
      <section className="landing-hero" aria-labelledby="hero-h">
        <div className="product-wrap">
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <h1 id="hero-h">
                {t('วิเคราะห์ผู้ติดตาม ', 'Analyze ')}
                <span className="inline-flex items-center gap-2.5 align-baseline">
                  <span>Instagram</span>
                  <svg
                    viewBox="0 0 48 48"
                    className="landing-hero__brand-badge"
                    fill="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="hero-badge-ring"
                        x1="4"
                        y1="44"
                        x2="40"
                        y2="8"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor="var(--color-ig-gold)" />
                        <stop offset="52%" stopColor="var(--color-ig-coral)" />
                        <stop offset="100%" stopColor="var(--color-ig-rose)" />
                      </linearGradient>
                    </defs>
                    {/* Decorative spark accent lines above top-right corner */}
                    <g
                      className="landing-hero__brand-spark"
                      stroke="url(#hero-badge-ring)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    >
                      <path d="M35 5.5L36.5 2" />
                      <path d="M40.5 9.5L44.5 6.5" />
                      <path d="M42.5 15.5L46 14.5" />
                    </g>
                    {/* Brand rounded badge */}
                    <rect
                      x="4"
                      y="9"
                      width="35"
                      height="35"
                      rx="10"
                      fill="var(--color-paper-2)"
                      stroke="url(#hero-badge-ring)"
                      strokeWidth="2.4"
                    />
                    {/* Top right-pointing follow arrow */}
                    <path
                      d="M12.5 22H28.5M24.5 18L29 22L24.5 26"
                      stroke="var(--color-ig-gold)"
                      strokeWidth="2.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Bottom left-pointing follow-back arrow */}
                    <path
                      d="M30.5 31H14.5M18.5 27L14 31L18.5 35"
                      stroke="var(--color-cool)"
                      strokeWidth="2.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {t('', ' followers')}
                <br />
                <span className="landing-hero__accent-wrap">
                  <span className="landing-hero__accent-text">
                    {t('รู้ว่าใครไม่ติดตามกลับ', 'See who doesn’t follow you back')}
                  </span>
                  <svg
                    className="landing-hero__ig-wave"
                    viewBox="0 0 360 14"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      className="landing-hero__ig-wave-runner"
                      d="M 4 8 C 46 2, 88 13, 134 7 C 180 1, 224 13, 270 7 C 304 3, 332 9, 356 6"
                      pathLength={100}
                    />
                  </svg>
                </span>
              </h1>
              <p className="landing-hero__lead">
                {t(
                  'เลือกไฟล์ .zip ที่ดาวน์โหลดจาก Instagram เพื่อเทียบรายชื่อผู้ติดตามกับบัญชีที่คุณกำลังติดตาม',
                  'Use your Instagram ZIP export to compare your followers with the accounts you follow.',
                )}
              </p>

              <div className="landing-hero__actions">
                <a className="btn btn--primary" href={pageHref('upload')} onClick={go('upload')}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>{t('เริ่มวิเคราะห์เลย', 'Start analysis')}</span>
                </a>
                <a
                  className="btn btn--secondary"
                  href={pageHref('how-it-works')}
                  onClick={go('how-it-works')}
                >
                  {t('ดูวิธีขอไฟล์พร้อมภาพ', 'View the illustrated guide')}
                </a>
              </div>

              <aside className="landing-hero__proof" aria-labelledby="hero-privacy-h">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-cool" aria-hidden="true" />
                <div>
                  <h2 id="hero-privacy-h">{t('วิเคราะห์บนเครื่องคุณ', 'Analysis on your device')}</h2>
                  <p>
                    {t(
                      'อ่านไฟล์ในเบราว์เซอร์โดยไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์',
                      'Your browser reads the file locally. It never goes to a server.',
                    )}
                  </p>
                  <p>
                    {t(
                      'ไม่ต้องล็อกอินหรือให้รหัสผ่าน และไม่ใช้ Instagram API',
                      'No login, password, or Instagram API access required.',
                    )}
                  </p>
                </div>
              </aside>
            </div>

            <LandingPreview demo={demo} onOpen={onOpenDemo} />
          </div>
        </div>
      </section>

      {/* 2. Relatable Use Cases */}
      <section className="landing-section landing-section--step" aria-labelledby="use-cases-h">
        <div className="product-wrap">
          <div className="landing-section__head">
            <h2 id="use-cases-h">
              {t('เคยสงสัยเรื่องพวกนี้บน Instagram ไหม?', 'Ever wondered about your Instagram list?')}
            </h2>
            <p>
              {t(
                'เครื่องมือนี้ช่วยจัดระเบียบและดูภาพรวมการติดตามของคุณให้ชัดขึ้น โดยไม่ต้องเสี่ยงใช้แอปที่ขอรหัสผ่าน',
                'See the full picture of your follower relationships clearly, without risking third-party login apps.',
              )}
            </p>
          </div>

          <ul
            ref={useCasesReveal.ref}
            className={`mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 scroll-reveal ${useCasesReveal.visible ? 'scroll-reveal--in' : ''}`}
          >
            {[
              {
                icon: UserMinus,
                tone: 'text-bad',
                title: t('ยอดผู้ติดตามลด แต่ไม่รู้ว่าใครหายไป', 'Follower count dropped, but who left?'),
                body: t(
                  'เมื่อเปิดประวัติบนเครื่องไว้ แล้วกลับมาอัปโหลดไฟล์รอบใหม่ ระบบจะเทียบกับรอบก่อนและชี้ชื่อบัญชีที่เพิ่งเลิกติดตามให้ทันที',
                  'Turn on local history and compare your next export to spot who unfollowed you since last time.',
                ),
              },
              {
                icon: ListChecks,
                tone: 'text-accent',
                title: t('อยากเคลียร์รายชื่อคนที่กำลังติดตาม', 'Want to tidy up who you follow'),
                body: t(
                  'แยกให้เห็นชัดว่าใครไม่ติดตามคุณกลับ ใครติดตามกันทั้งสองฝ่าย พร้อมวันที่เริ่มติดตาม และกดเปิดโปรไฟล์บน IG ไปจัดการเองได้ทันที',
                  'Separate accounts that don’t follow back from mutual follows, check follow dates, and jump straight to each profile.',
                ),
              },
              {
                icon: ShieldCheck,
                tone: 'text-cool',
                title: t(
                  'อยากเช็ก แต่กลัวโดนแบนจากแอปล็อกอิน',
                  'Want to check without risking your account',
                ),
                body: t(
                  'ใช้เพียงไฟล์ .zip ทางการที่คุณขอจากศูนย์บัญชี Instagram เอง ไม่ต้องกรอกรหัสผ่าน ไม่ใช้ Instagram API และไฟล์ไม่ออกจากเครื่องคุณ',
                  'Works strictly from your official Instagram ZIP export—no password, no Instagram API, and nothing leaves your browser.',
                ),
              },
              {
                icon: FileText,
                tone: 'text-ok',
                title: t('อยากเก็บภาพรวมไว้ดูย้อนหลังหรือส่งต่อ', 'Keep a clean snapshot for later'),
                body: t(
                  'สร้างรายงาน PDF (ไทย / อังกฤษ) พร้อมกราฟสัดส่วนและตารางรายชื่อ ดาวน์โหลดเก็บลงเครื่องได้ทันทีในคลิกเดียว',
                  'Export a structured A4 PDF report with summary charts and account tables directly to your device.',
                ),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="rounded-[10px] border border-rule bg-paper-2 p-5">
                  <div className="flex items-start gap-3.5">
                    <Icon
                      className={`mt-0.5 h-7 w-7 shrink-0 ${item.tone}`}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{item.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            <AddToHomeGuide />
          </div>
        </div>
      </section>

      {/* Local history preview */}
      <section className="landing-section landing-section--deep" aria-labelledby="diff-h">
        <div className="product-wrap">
          <div className="landing-section__head">
            <h2 id="diff-h">{t('ดูว่าใครเพิ่งเลิกติดตาม', 'See who recently unfollowed you')}</h2>
          </div>
          <LocalHistoryPreview onOpenHistory={go('history')} />
        </div>
      </section>

      {/* 3. Three-Step Workflow Strip */}
      <section className="landing-section" aria-labelledby="steps-h">
        <div className="product-wrap">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="landing-section__head">
              <h2 id="steps-h">{t('ขั้นตอนทำงานตั้งแต่ขอไฟล์จนได้รายงาน', 'From export to report')}</h2>
              <p>
                {t(
                  'ทำตามขั้นตอนจริงจากศูนย์บัญชี Instagram ทั้งบนมือถือและคอมพิวเตอร์ โดยไม่ต้องใช้รหัสผ่าน',
                  'Follow the Instagram Accounts Center steps on mobile or desktop to request your export.',
                )}
              </p>
            </div>
            <a
              className="btn btn--secondary shrink-0"
              href={pageHref('how-it-works')}
              onClick={go('how-it-works')}
            >
              {t('ดูคู่มือภาพทีละขั้นตอน', 'View the step-by-step guide')}
            </a>
          </div>

          <ol
            ref={stepsReveal.ref}
            className={`panels mt-7 scroll-reveal ${stepsReveal.visible ? 'scroll-reveal--in' : ''}`}
            role="list"
          >
            <li className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-3">
                <span className="measured text-xs font-medium text-accent">
                  {t('ขั้นที่ 01', 'STEP 01')}
                </span>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {t('ขอไฟล์จากศูนย์บัญชี Instagram', 'Request your Instagram export')}
                </p>
              </div>
              <div className="md:col-span-4">
                <span className="text-xs font-medium text-cool">
                  {t('เฉพาะหมวดผู้ติดตามและกำลังติดตาม', 'Followers and following only')}
                </span>
              </div>
              <p className="text-sm text-muted md:col-span-5">
                {t(
                  'เลือกเฉพาะผู้ติดตามและกำลังติดตาม ตั้งช่วงวันที่ ตลอดเวลา (All time) และรูปแบบ JSON แล้วดาวน์โหลดไฟล์ .zip',
                  'Select Followers and following, set the date range to All time, and choose JSON. Download the ZIP when it’s ready.',
                )}
              </p>
            </li>

            <li className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-3">
                <span className="measured text-xs font-medium text-accent">
                  {t('ขั้นที่ 02', 'STEP 02')}
                </span>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {t('อัปโหลดไฟล์ .zip เข้าเว็บไซต์', 'Choose the ZIP you downloaded')}
                </p>
              </div>
              <div className="md:col-span-4">
                <span className="text-xs font-medium text-cool">
                  {t('ประมวลผลในเบราว์เซอร์ 100%', 'Processed in your browser')}
                </span>
              </div>
              <p className="text-sm text-muted md:col-span-5">
                {t(
                  'เลือกไฟล์ .zip ที่โหลดมาได้เลยโดยไม่ต้องแตกไฟล์ เว็บจะอ่านและคำนวณให้บนเครื่องของคุณทันที',
                  'Select the ZIP as downloaded. Your browser reads the lists and compares them on your device.',
                )}
              </p>
            </li>

            <li className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-3">
                <span className="measured text-xs font-medium text-accent">
                  {t('ขั้นที่ 03', 'STEP 03')}
                </span>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {t('ดูรายชื่อและส่งออกรายงาน PDF', 'Explore the results and export a PDF')}
                </p>
              </div>
              <div className="md:col-span-4">
                <span className="text-xs font-medium text-cool">
                  {t('ดูผลทันทีหรือโหลดเก็บเป็น PDF', 'View results or save a PDF')}
                </span>
              </div>
              <p className="text-sm text-muted md:col-span-5">
                {t(
                  'เห็นชัดว่าใครไม่ติดตามกลับ ค้นหาชื่อ กดเปิดโปรไฟล์ IG หรือบันทึกรายงาน PDF (ไทย / อังกฤษ) เก็บไว้ดูง่ายๆ',
                  'See who doesn’t follow you back, search for usernames, open Instagram profiles, or save a Thai or English PDF report.',
                )}
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* 4. Measured Readings + Privacy Table + FAQ */}
      <section className="landing-section landing-section--step" aria-labelledby="readings-h">
        <div className="product-wrap">
          <div className="landing-section__head">
            <h2 id="readings-h">
              {t('ข้อมูลอยู่บนเครื่องของคุณตั้งแต่ต้นจนจบ', 'Your data stays on your device')}
            </h2>
            <p>
              {t(
                'ออกแบบให้ตรวจสอบได้จริงทุกส่วน ไม่มีบัญชีผู้ใช้ ไม่มีระบบส่งไฟล์ออกนอกเบราว์เซอร์',
                'You can use every core feature without signing in or sending your file outside your browser.',
              )}
            </p>
          </div>

          <div ref={statsReveal.ref} className="panels mt-7 md:grid-cols-3">
            <div className={`p-6 scroll-reveal ${statsReveal.visible ? 'scroll-reveal--in' : ''}`}>
              <p className="reading text-4xl text-accent sm:text-5xl">
                <AnimatedStatNumber target={0} visible={statsReveal.visible} />
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {t('รหัสผ่านที่ต้องกรอก', 'Passwords required')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t(
                  'ใช้เฉพาะไฟล์ .zip จากศูนย์บัญชี ไม่ต้องล็อกอินหรือเชื่อมบัญชี',
                  'Use the ZIP from Accounts Center without connecting your account.',
                )}
              </p>
            </div>
            <div
              className={`p-6 scroll-reveal scroll-reveal--delay-1 ${statsReveal.visible ? 'scroll-reveal--in' : ''}`}
            >
              <p className="reading text-4xl text-cool sm:text-5xl">
                <AnimatedStatNumber target={100} suffix="%" visible={statsReveal.visible} />
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {t('คำนวณในเบราว์เซอร์', 'In-browser processing')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t('ไม่ส่งรายชื่อผู้ติดตามเข้าเซิร์ฟเวอร์ภายนอก', 'Follower lists stay off external servers.')}
              </p>
            </div>
            <div
              className={`p-6 scroll-reveal scroll-reveal--delay-2 ${statsReveal.visible ? 'scroll-reveal--in' : ''}`}
            >
              <p className="reading text-4xl text-ok sm:text-5xl">
                <AnimatedStatNumber target={200} suffix=" MB" visible={statsReveal.visible} />
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {t('รองรับขนาดไฟล์สูงสุด', 'Maximum file size')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t(
                  'ข้ามรูปและวิดีโออัตโนมัติ อ่านเฉพาะไฟล์รายชื่อ',
                  'The app reads only the account lists and skips photos and videos.',
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="panels lg:col-span-7">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-rule bg-paper-3 text-xs font-medium text-muted">
                    <th className="px-4 py-3">{t('เปรียบเทียบการทำงาน', 'How it works')}</th>
                    <th className="px-4 py-3">
                      {t('แอปที่ขอรหัสผ่าน IG', 'Apps that ask for your IG password')}
                    </th>
                    <th className="px-4 py-3 text-accent">IG Follow Analyzer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule bg-paper-2">
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      {t('การเข้าถึงบัญชี', 'Account access')}
                    </th>
                    <td className="px-4 py-3 text-bad">
                      {t('ขอรหัสผ่านหรือ Cookie', 'Ask for a password or cookie')}
                    </td>
                    <td className="px-4 py-3 text-ok">
                      {t('ใช้ไฟล์ ZIP ทางการเท่านั้น', 'Uses the official ZIP export')}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      {t('ประวัติย้อนหลัง', 'History')}
                    </th>
                    <td className="px-4 py-3 text-muted">
                      {t('เก็บไว้บนเซิร์ฟเวอร์ผู้พัฒนา', 'Stored on the developer’s server')}
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {t('ปิดเป็นค่าเริ่มต้น (เลือกเก็บในเครื่องได้)', 'Optional and stored on this device')}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      {t('การสั่งอันฟอลอัตโนมัติ', 'Automatic unfollowing')}
                    </th>
                    <td className="px-4 py-3 text-bad">
                      {t('เสี่ยงถูกจำกัดสิทธิ์หรือระงับบัญชี', 'May lead to account restrictions')}
                    </td>
                    <td className="px-4 py-3 text-ok">
                      {t('ไม่มีระบบกดแทนผู้ใช้', 'You manage follows on Instagram')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="panels lg:col-span-5">
              <div className="bg-paper-3 px-5 py-3">
                <h3 className="text-base font-semibold text-ink">
                  {t('คำถามที่พบบ่อย', 'Frequently asked questions')}
                </h3>
              </div>
              <div className="divide-y divide-rule bg-paper-2 px-5">
                {getLandingFaqs(t).map((item, idx) => {
                  const expanded = openFaq === idx;
                  return (
                    <div key={item.q} className="py-1">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpenFaq(expanded ? null : idx)}
                        className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 py-2 text-left text-sm font-medium text-ink"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                            expanded ? 'rotate-180 text-accent' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                      {expanded && (
                        <p className="pb-3 text-sm leading-relaxed text-muted">{item.a}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Closing Band */}
      <section className="landing-section landing-section--deep" aria-labelledby="closing-h">
        <div
          ref={closingReveal.ref}
          className={`product-wrap flex flex-col items-start justify-between gap-6 rounded-[var(--radius-card)] border border-rule bg-paper-2 p-7 scroll-reveal sm:p-10 lg:flex-row lg:items-center ${
            closingReveal.visible ? 'scroll-reveal--in' : ''
          }`}
        >
          <div>
            <h2 id="closing-h" className="text-2xl font-semibold text-ink sm:text-3xl">
              {t('พร้อมตรวจสอบรายชื่อผู้ติดตามจากไฟล์ของคุณแล้วหรือยัง', 'Ready to check your follower list?')}
            </h2>
            <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted sm:text-base">
              {t(
                'หากมีไฟล์ .zip จาก Instagram แล้วสามารถอัปโหลดได้ทันที หรือดูคู่มือภาพทีละขั้นตอนจากหน้าจอจริง',
                'Select your Instagram ZIP if you have it, or follow the illustrated guide to request one.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="btn btn--primary" href={pageHref('upload')} onClick={go('upload')}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{t('เริ่มวิเคราะห์เลย', 'Start analysis')}</span>
            </a>
            <a
              className="btn btn--secondary"
              href={pageHref('how-it-works')}
              onClick={go('how-it-works')}
            >
              {t('ดูวิธีขอไฟล์พร้อมภาพ', 'View the illustrated guide')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
