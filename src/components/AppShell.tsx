import { ArrowUp, Menu, Monitor, Moon, Sun, X } from 'lucide-react';
import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type Translator, useLanguage } from '../lib/language';
import { pageHref } from '../lib/routes';
import { type ThemePreference, useThemePreference } from '../lib/theme';

export type PageId =
  | 'landing'
  | 'how-it-works'
  | 'export-comparison'
  | 'upload'
  | 'results'
  | 'pdf'
  | 'history'
  | 'terms'
  | 'about';

interface AppShellProps {
  activePage: PageId;
  contentRef: RefObject<HTMLDivElement | null>;
  onNavigate: (id: PageId) => void;
  hasAnalysis: boolean;
  children: ReactNode;
}

const getNavItems = (t: Translator): { id: PageId; label: string; activeFor: PageId[] }[] => [
  { id: 'landing', label: t('หน้าแรก', 'Home'), activeFor: ['landing'] },
  { id: 'how-it-works', label: t('วิธีขอไฟล์', 'Export guide'), activeFor: ['how-it-works'] },
  { id: 'upload', label: t('วิเคราะห์ไฟล์', 'Analyze ZIP'), activeFor: ['upload', 'results', 'pdf'] },
  { id: 'history', label: t('ประวัติบนเครื่อง', 'History'), activeFor: ['history'] },
  { id: 'about', label: t('เกี่ยวกับเรา', 'About'), activeFor: ['about'] },
];

function ThemeSwitcher({
  preference,
  setPreference,
}: {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}) {
  const { t } = useLanguage();
  const options = [
    { id: 'system', label: t('ตามระบบ', 'System'), Icon: Monitor },
    { id: 'light', label: t('สว่าง', 'Light'), Icon: Sun },
    { id: 'dark', label: t('มืด', 'Dark'), Icon: Moon },
  ] as const;

  return (
    <div
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-rule bg-paper-2 p-1"
      role="group"
      aria-label={t('เลือกธีมสี', 'Color theme')}
    >
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={preference === id}
          title={label}
          onClick={() => setPreference(id)}
          className="nav__theme-button inline-flex items-center justify-center lg:size-8"
        >
          <Icon className="size-4" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="inline-flex shrink-0 gap-0.5 rounded-lg border border-rule bg-paper-2 p-1"
      role="group"
      aria-label={t('ภาษา', 'Language')}
    >
      <button
        type="button"
        lang="th"
        aria-pressed={language === 'th'}
        className="nav__language-button"
        onClick={() => setLanguage('th')}
      >
        ไทย
      </button>
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={language === 'en'}
        className="nav__language-button"
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}

export function AppShell({
  activePage,
  contentRef,
  onNavigate,
  hasAnalysis,
  children,
}: AppShellProps) {
  const { t } = useLanguage();
  const navItems = getNavItems(t);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const theme = useThemePreference();
  const showLatestAnalysis = hasAnalysis && activePage !== 'results';
  const getNavigationTarget = (id: PageId) => (id === 'upload' && hasAnalysis ? 'results' : id);

  const link = (id: PageId) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setDrawerOpen(false);
    onNavigate(getNavigationTarget(id));
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [activePage]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        drawerToggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const scrollToTop = () => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    contentRef.current?.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  const current = (ids: PageId[]) => (ids.includes(activePage) ? 'page' : undefined);

  return (
    <div className="app-frame flex h-dvh flex-col">
      <header className="nav mobile-top-bar shrink-0">
        <div className="product-wrap nav__bar">
          <a
            className="skip-link"
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              mainRef.current?.focus({ preventScroll: true });
              contentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
            }}
          >
            {t('ข้ามไปที่เนื้อหาหลัก', 'Skip to main content')}
          </a>

          <div className="flex min-w-0 items-center gap-1">
            <a className="nav__logo" href={pageHref('landing')} onClick={link('landing')}>
              <span>IG Follow Analyzer</span>
            </a>
          </div>

          <nav id="main-nav" className="nav__links" aria-label={t('เมนูหลัก', 'Main navigation')}>
            {navItems.map((item) => (
              <a
                key={item.id}
                className="nav__link"
                href={pageHref(getNavigationTarget(item.id))}
                aria-current={current(item.activeFor)}
                onClick={link(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <a
              className={`btn btn--ghost px-3 py-2 text-sm ${showLatestAnalysis ? '' : 'invisible'}`}
              href={showLatestAnalysis ? pageHref('results') : undefined}
              onClick={showLatestAnalysis ? link('results') : undefined}
            >
              {t('ผลวิเคราะห์ล่าสุด', 'Latest results')}
            </a>

            <ThemeSwitcher {...theme} />
            <LanguageSwitcher />
          </div>

          <div className="lg:hidden">
            <button
              ref={drawerToggleRef}
              className="nav__toggle mobile-top-bar__action"
              type="button"
              aria-expanded={drawerOpen}
              aria-label={
                drawerOpen ? t('ปิดเมนูหลัก', 'Close navigation') : t('เปิดเมนูหลัก', 'Open navigation')
              }
              aria-controls="mobile-nav-drawer"
              onClick={() => setDrawerOpen((prev) => !prev)}
            >
              {drawerOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {drawerOpen && (
          <nav
            id="mobile-nav-drawer"
            className="nav__drawer lg:hidden"
            aria-label={t('เมนูหลักบนมือถือ', 'Mobile navigation')}
          >
            <div className="nav__drawer-list">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  className="nav__drawer-link"
                  href={pageHref(getNavigationTarget(item.id))}
                  aria-current={current(item.activeFor)}
                  onClick={link(item.id)}
                >
                  <span>{item.label}</span>
                </a>
              ))}
              {showLatestAnalysis && (
                <a
                  className="nav__drawer-link"
                  href={pageHref('results')}
                  onClick={link('results')}
                >
                  <span>{t('ผลวิเคราะห์ล่าสุด', 'Latest results')}</span>
                </a>
              )}
            </div>
            <div className="mt-3 grid gap-2 border-t border-rule px-3 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted">{t('ธีม', 'Theme')}</span>
                <ThemeSwitcher {...theme} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted">{t('ภาษา', 'Language')}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={contentRef}
          role="region"
          aria-label={t('พื้นที่เนื้อหา', 'Page content')}
          tabIndex={0}
          className="app-content relative flex h-full flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain"
          onScroll={(event) => setShowBackToTop(event.currentTarget.scrollTop > 480)}
        >
          <main id="top" ref={mainRef} tabIndex={-1} className="relative flex-1">
            {children}
          </main>
          <footer role="contentinfo" className="app-subfooter shrink-0">
            <div className="product-wrap app-subfooter__inner">
              <div>
                <p className="app-subfooter__copy">© 2026 IG Follow Analyzer</p>
                <p>
                  {t(
                    'เครื่องมืออิสระ ไม่เกี่ยวข้องกับ Instagram หรือ Meta',
                    'An independent tool with no affiliation with Instagram or Meta.',
                  )}
                </p>
              </div>
              <nav
                className="app-subfooter__links"
                aria-label={t('ข้อมูลเว็บไซต์', 'Site information')}
              >
                <a href={pageHref('terms')} onClick={link('terms')}>
                  {t('เงื่อนไขและความเป็นส่วนตัว', 'Terms and privacy')}
                </a>
                <a href={pageHref('about')} onClick={link('about')}>
                  {t('เกี่ยวกับเรา', 'About')}
                </a>
              </nav>
            </div>
          </footer>
        </div>
        {showBackToTop && !drawerOpen && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={t('กลับขึ้นด้านบน', 'Back to top')}
            title={t('กลับขึ้นด้านบน', 'Back to top')}
            className="absolute right-5 bottom-4 z-30 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-rule-2 bg-paper-2/95 text-ink shadow-md backdrop-blur-xs transition-colors hover:border-accent hover:text-accent sm:right-7 sm:bottom-6"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
