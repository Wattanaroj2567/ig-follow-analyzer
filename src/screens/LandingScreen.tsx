import {
  ArrowRight,
  ChevronDown,
  FileText,
  ListChecks,
  ShieldCheck,
  Upload,
  UserMinus,
} from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { AddToHomeGuide } from '../components/AddToHomeGuide';
import { LandingReviews } from '../components/LandingReviews';
import type { PageId } from '../components/AppShell';
import { type FaqItem, getComparisonFaqs } from '../data/comparisonFaqs';
import { pageHref } from '../lib/routes';
import type { AnalysisResult } from '../types/analyzer';
import { type Translator, useLanguage } from '../lib/language';
import { LandingPreview } from './LandingPreview';
import { LocalHistoryPreview } from './LocalHistoryPreview';

interface LandingScreenProps {
  demo: AnalysisResult;
  previousDemo: AnalysisResult;
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

function useInViewOnce<T extends HTMLElement>() {
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
      { threshold: 0.05 },
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
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      setValue(target);
      return;
    }

    let frameId = 0;
    const duration = 900;
    let start: number | null = null;

    const tick = (now: number) => {
      start ??= now;
      const progress = Math.max(0, Math.min(1, (now - start) / duration));
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

const getLandingFaqs = (t: Translator): FaqItem[] => [
  ...getComparisonFaqs(t),
  {
    q: t(
      'ทำไมยอดในไฟล์ ZIP อาจมากกว่าหรือต่างจากหน้าโปรไฟล์ Instagram?',
      'Why can counts in the ZIP differ from my Instagram profile?',
    ),
    a: t(
      'หากยอดใน ZIP มากกว่าหน้าโปรไฟล์ เป็นเพราะไฟล์ที่ส่งออกจาก Instagram ยังคงมีรายชื่อ “บัญชีที่ถูกปิดใช้งาน” (Deactivated) และบัญชีที่ถูกลบ (เช่น __deleted__*) รวมอยู่ด้วย ในขณะที่แอป Instagram หักบัญชีเหล่านี้ออกจากยอดบนหน้าโปรไฟล์แล้วแต่ไม่ได้ระบุสถานะแยกไว้ในไฟล์ ZIP ส่วนถ้ายอดใน ZIP น้อยกว่า อาจเกิดจากเลือกช่วงวันที่จำกัดตอนขอไฟล์แทน “ตลอดเวลา (All time)”',
      'If the ZIP count is higher than on your profile, Instagram exports still include deactivated accounts and deleted placeholders (such as __deleted__*) that the app subtracts from your profile total without marking their status in the ZIP. If the count is lower, the export may have used a limited date range instead of “All time.”',
    ),
    link: {
      page: 'how-it-works',
      label: t('ดูวิธีเลือกช่วงเวลา “ตลอดเวลา”', 'See how to select “All time”'),
    },
  },
  {
    q: t('ทำไมไม่แสดงรูปโปรไฟล์ของแต่ละบัญชี?', 'Why are profile pictures missing?'),
    a: t(
      'ไฟล์ ZIP ที่ส่งออกจาก Instagram มีชื่อบัญชีและอาจมีวันที่ติดตาม เว็บนี้วิเคราะห์ไฟล์บนเครื่องคุณและไม่เรียกดึงรูปโปรไฟล์จากภายนอก คุณกดชื่อบัญชีในตารางเพื่อเปิดโปรไฟล์บน Instagram ได้',
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
    q: t('ทำไมต้องขอไฟล์เองและรอให้พร้อม?', 'Why do I need to request an export and wait?'),
    a: t(
      'Instagram ต้องเตรียมไฟล์ให้หลังจากที่คุณขอในศูนย์บัญชี คุณกลับไปดูความคืบหน้าได้ที่แท็บกิจกรรมปัจจุบัน',
      'Once you request an export in Accounts Center, Instagram prepares the file. You can check its progress under Current activity.',
    ),
  },
];

export function LandingScreen({ demo, previousDemo, onNavigate, onOpenDemo }: LandingScreenProps) {
  const { t } = useLanguage();
  const [openFaqs, setOpenFaqs] = useState(() => new Set([0]));
  const statsInView = useInViewOnce<HTMLDivElement>();

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
              <h1 id="hero-h" className="page-heading">
                {t('วิเคราะห์', 'Analyze ')}
                <span className="whitespace-nowrap">{t('ผู้ติดตาม', '')}</span>{' '}
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
                    <defs>
                      <linearGradient
                        id="hero-wave-gradient"
                        x1="4"
                        y1="7"
                        x2="356"
                        y2="7"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor="var(--color-ig-gold)" />
                        <stop offset="48%" stopColor="var(--color-ig-coral)" />
                        <stop offset="100%" stopColor="var(--color-ig-rose)" />
                      </linearGradient>
                      <filter
                        id="hero-crayon"
                        filterUnits="userSpaceOnUse"
                        x="-3"
                        y="-3"
                        width="366"
                        height="20"
                      >
                        <feTurbulence
                          type="fractalNoise"
                          baseFrequency="0.72 0.86"
                          numOctaves={2}
                          seed={9}
                          result="paperGrain"
                        />
                        <feDisplacementMap
                          in="SourceGraphic"
                          in2="paperGrain"
                          scale={4}
                          xChannelSelector="R"
                          yChannelSelector="G"
                          result="roughStroke"
                        />
                        <feColorMatrix
                          in="paperGrain"
                          type="matrix"
                          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -1.8"
                          result="grainOpacity"
                        />
                        <feComposite in="roughStroke" in2="grainOpacity" operator="in" />
                      </filter>
                    </defs>
                    <path
                      className="landing-hero__ig-wave-runner"
                      stroke="url(#hero-wave-gradient)"
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

              <aside className="landing-hero__proof" aria-labelledby="hero-export-h">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-cool" aria-hidden="true" />
                <div>
                  <h2 id="hero-export-h">
                    {t(
                      'ก่อนเริ่ม ต้องขอไฟล์จาก Instagram',
                      'Before you start, request your Instagram export',
                    )}
                  </h2>
                  <p>
                    {t(
                      'ขอ ZIP จากศูนย์บัญชี แล้วรอให้ Instagram เตรียมไฟล์',
                      'Request a ZIP in Accounts Center and wait for Instagram to prepare it.',
                    )}
                  </p>
                  <a
                    href={pageHref('export-comparison')}
                    onClick={go('export-comparison')}
                    className="mt-2 inline-flex min-h-6 items-center gap-1 font-semibold text-cool underline underline-offset-4"
                  >
                    {t('ทำไมต้องใช้ไฟล์ ZIP?', 'Why use a ZIP?')}
                    <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </aside>

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
                  {t('ดูวิธีขอไฟล์', 'View export guide')}
                </a>
              </div>
            </div>

            <LandingPreview demo={demo} previousDemo={previousDemo} />
          </div>
        </div>
      </section>

      {/* 2. Relatable Use Cases */}
      <section className="landing-section" aria-labelledby="use-cases-h">
        <div className="product-wrap">
          <div className="landing-section__head">
            <h2 id="use-cases-h">
              {t('สิ่งที่ทำได้ด้วยไฟล์ ZIP จาก Instagram', 'What you can do with an Instagram ZIP')}
            </h2>
            <p>
              {t(
                'เริ่มจากไฟล์ ZIP ที่ขอในศูนย์บัญชี Instagram',
                'Start with the ZIP you request from Instagram Accounts Center.',
              )}
            </p>
          </div>

          <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: ListChecks,
                tone: 'text-accent',
                title: t('ดูว่าใครไม่ติดตามคุณกลับ', 'See who doesn’t follow you back'),
                body: t(
                  'เปิดหมวด “ไม่ติดตามคุณกลับ” เพื่อดูบัญชีที่คุณติดตามอยู่ แต่เขาไม่ได้ติดตามคุณ',
                  'Open “Not following you back” to see accounts you follow that don’t follow you.',
                ),
              },
              {
                icon: UserMinus,
                tone: 'text-bad',
                title: t('เทียบรายชื่อผู้ติดตามสองรอบ', 'Compare follower lists across two exports'),
                body: t(
                  'เปิดประวัติและเลือกเก็บรายชื่อ แล้วเทียบ ZIP สองรอบของบัญชีเดียวกันเพื่อดูว่าใครเพิ่มหรือหายไป',
                  'Turn on history and choose to save account lists. Compare two ZIPs for the same account to see who’s new or missing.',
                ),
              },
              {
                icon: ShieldCheck,
                tone: 'text-cool',
                title: t('วิเคราะห์ ZIP บนเครื่องคุณ', 'Analyze the ZIP on your device'),
                body: t(
                  'เว็บประมวลผลไฟล์ทั้งหมดในเบราว์เซอร์ ใช้ได้โดยไม่ต้องเชื่อมบัญชี Instagram หรือกรอกรหัสผ่าน',
                  'Your browser processes the entire ZIP locally. There’s no need to connect an Instagram account or enter a password.',
                ),
              },
              {
                icon: FileText,
                tone: 'text-ok',
                title: t('ดาวน์โหลดรายงาน PDF', 'Download a PDF report'),
                body: t(
                  'เลือกกราฟสรุปและรายชื่อที่จะใส่ แล้วดาวน์โหลด PDF ขนาด A4 เป็นภาษาไทยหรืออังกฤษ',
                  'Choose which sections to include, then download an A4 PDF in Thai or English.',
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
      <section className="landing-section landing-section--history" aria-labelledby="diff-h">
        <div className="product-wrap">
          <div className="landing-section__head">
            <h2 id="diff-h">{t('ดูว่าใครเพิ่งเลิกติดตาม', 'See who recently unfollowed you')}</h2>
          </div>
          <LocalHistoryPreview onOpenDemo={onOpenDemo} onOpenHistory={go('history')} />
        </div>
      </section>

      {/* 4. Measured Readings + FAQ */}
      <section className="landing-section" aria-labelledby="readings-h">
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

          <div ref={statsInView.ref} className="panels mt-7 md:grid-cols-3">
            <div className="p-6">
              <p className="reading text-4xl text-accent sm:text-5xl">
                <AnimatedStatNumber target={0} visible={statsInView.visible} />
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
            <div className="p-6">
              <p className="reading text-4xl text-cool sm:text-5xl">
                <AnimatedStatNumber target={100} suffix="%" visible={statsInView.visible} />
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {t('คำนวณในเบราว์เซอร์', 'In-browser processing')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t('ไม่ส่งรายชื่อผู้ติดตามเข้าเซิร์ฟเวอร์ภายนอก', 'Follower lists stay off external servers.')}
              </p>
            </div>
            <div className="p-6">
              <p className="reading text-4xl text-ok sm:text-5xl">
                <AnimatedStatNumber target={200} suffix=" MB" visible={statsInView.visible} />
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

          <section
            aria-labelledby="landing-faq-heading"
            className="mt-8 overflow-hidden rounded-[10px] border border-rule bg-paper-2"
          >
            <h3
              id="landing-faq-heading"
              className="border-b border-rule bg-paper-3 px-5 py-3 text-base font-semibold text-ink"
            >
              {t('คำถามที่พบบ่อย', 'Frequently asked questions')}
            </h3>
            <div className="divide-y divide-rule px-5">
              {getLandingFaqs(t).map((item, idx) => {
                const expanded = openFaqs.has(idx);
                const answerId = `landing-faq-answer-${idx}`;
                return (
                  <div key={item.q} className="py-1">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={answerId}
                      onClick={() =>
                        setOpenFaqs((current) => {
                          const next = new Set(current);
                          if (next.has(idx)) next.delete(idx);
                          else next.add(idx);
                          return next;
                        })
                      }
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 py-2 text-left text-sm font-medium text-ink active:transform-none"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted ${
                          expanded ? 'rotate-180 text-accent' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={answerId}
                      hidden={!expanded}
                      className="max-w-[72ch] pb-3 text-sm leading-relaxed text-muted"
                    >
                      <p>{item.a}</p>
                      {item.link && (
                        <a
                          href={pageHref(item.link.page)}
                          onClick={go(item.link.page)}
                          className="mt-2 inline-block font-medium text-accent underline underline-offset-4"
                        >
                          {item.link.label}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      {/* 5. Closing Band */}
      <section className="landing-section landing-section--closing" aria-labelledby="closing-h">
        <div className="product-wrap flex flex-col items-start justify-between gap-4 rounded-(--radius-card) border border-rule bg-paper-2 p-5 sm:p-6 lg:flex-row lg:items-center">
          <h2 id="closing-h" className="text-2xl font-semibold text-ink sm:text-3xl">
            {t('มีไฟล์ ZIP แล้วใช่ไหม?', 'Have your ZIP file?')}
          </h2>
          <a className="btn btn--primary" href={pageHref('upload')} onClick={go('upload')}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{t('เริ่มวิเคราะห์เลย', 'Start analysis')}</span>
          </a>
        </div>
      </section>

      <LandingReviews />
    </>
  );
}
