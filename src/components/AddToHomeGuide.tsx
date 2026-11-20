import { ChevronDown, Download, Laptop, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/language';
import { NormalButton } from './NormalButton';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeGuide() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    if (standaloneQuery?.matches) {
      setIsStandalone(true);
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <details className="group rounded-[10px] border border-rule bg-paper-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-ink transition-colors hover:text-accent">
        <span className="flex items-center gap-2.5">
          <Smartphone className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <span>
            {t(
              'เพิ่มไว้หน้าโฮมมือถือ ใช้งานได้เหมือนแอปติดเครื่อง (ไม่ต้องโหลดแอป)',
              'Add to your Home Screen — use it like an app, no store download needed',
            )}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-rule px-5 py-4 text-sm leading-relaxed text-ink-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[54ch] text-xs leading-relaxed text-muted">
            {t(
              'ปักหมุดไว้บนหน้าจอมือถือหรือคอมพิวเตอร์เพื่อเปิดกลับมาเช็กใน 1 แตะ เต็มหน้าจอ ไม่เปลืองพื้นที่เครื่อง และไม่ต้องดาวน์โหลดจาก App Store หรือ Play Store',
              'Pin this site to your phone’s Home Screen or desktop for 1-tap access—lightweight, full-screen, and no App Store or Play Store download required.',
            )}
          </p>

          {/* Visual preview of the app icon on iOS & Android Home Screens */}
          <div
            className="flex shrink-0 items-center justify-center gap-5 rounded-lg border border-rule bg-paper-3 px-4 py-3"
            aria-label={t('ตัวอย่างไอคอนบนหน้าโฮมมือถือ', 'Home Screen app icon preview')}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[12px] border border-[#2D323E] bg-[#14161D] shadow-sm">
                <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
                  <path
                    d="M11 15.5H27.5M23.5 11.5L28 15.5L23.5 19.5"
                    stroke="#F2B94B"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M29 24.5H12.5M16.5 20.5L12 24.5L16.5 28.5"
                    stroke="#63B3F9"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-ink">IG Analyzer</span>
              <span className="text-[9px] text-muted">iOS</span>
            </div>

            <div className="h-12 w-px bg-rule" aria-hidden="true" />

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#2D323E] bg-[#14161D] shadow-sm">
                <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" aria-hidden="true">
                  <path
                    d="M11 15.5H27.5M23.5 11.5L28 15.5L23.5 19.5"
                    stroke="#F2B94B"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M29 24.5H12.5M16.5 20.5L12 24.5L16.5 28.5"
                    stroke="#63B3F9"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-ink">IG Analyzer</span>
              <span className="text-[9px] text-muted">Android</span>
            </div>
          </div>
        </div>

        {deferredPrompt && (
          <div className="mt-3">
            <NormalButton variant="primary" onClick={() => void handleInstallClick()}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t('ติดตั้งทางลัดลงเครื่องทันที (1 คลิก)', 'Install app shortcut (1 click)')}
            </NormalButton>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-rule bg-paper-3 p-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Smartphone className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {t('มือถือและแท็บเล็ต (iOS / Android)', 'Mobile & Tablet (iOS / Android)')}
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-ink-2 marker:text-accent">
              <li>
                <strong className="text-ink">Safari / Chrome (iPhone & iPad):</strong>{' '}
                {t(
                  'แตะปุ่ม แชร์ (Share) แล้วเลือก เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)',
                  'Tap Share, then select Add to Home Screen.',
                )}
              </li>
              <li>
                <strong className="text-ink">Chrome / Edge / Brave (Android):</strong>{' '}
                {t(
                  'แตะเมนู ⋮ มุมขวาบน แล้วเลือก เพิ่มลงในหน้าจอหลัก หรือ ติดตั้งแอป',
                  'Tap the ⋮ menu at the top right, then select Add to Home screen or Install app.',
                )}
              </li>
              <li>
                <strong className="text-ink">Samsung Internet / Firefox / LINE:</strong>{' '}
                {t(
                  'แตะเมนู ≡ หรือ ⋮ แล้วเลือก เพิ่มไปยังหน้าจอหลัก (หากเปิดในแอป LINE/IG แนะนำให้กด เปิดในเบราว์เซอร์เริ่มต้น ก่อน)',
                  'Open the browser menu and select Add to Home screen (if inside an in-app browser, open in Safari or Chrome first).',
                )}
              </li>
            </ul>
          </div>

          <div className="rounded-md border border-rule bg-paper-3 p-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Laptop className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {t('คอมพิวเตอร์ (Windows / Mac)', 'Desktop (Windows / Mac)')}
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-ink-2 marker:text-accent">
              <li>
                <strong className="text-ink">Chrome / Microsoft Edge / Brave:</strong>{' '}
                {t(
                  'คลิกไอคอน ติดตั้ง (Install) ด้านขวาของแถบ URL หรือเมนู ⋮ → บันทึกและแชร์ → ติดตั้งหน้านี้เป็นแอป',
                  'Click the Install icon on the right side of the address bar, or open ⋮ → Save and share → Install page as app.',
                )}
              </li>
              <li>
                <strong className="text-ink">Safari (Mac):</strong>{' '}
                {t(
                  'คลิกปุ่ม แชร์ (Share) มุมขวาบน แล้วเลือก เพิ่มไปยัง Dock (Add to Dock…)',
                  'Click Share at the top right, then choose Add to Dock…',
                )}
              </li>
              <li>
                <strong className="text-ink">Firefox / ทุกเบราว์เซอร์:</strong>{' '}
                {t(
                  'กด Ctrl + D (Windows) หรือ ⌘ + D (Mac) เพื่อปักหมุดไว้ในแถบบุ๊กมาร์ก',
                  'Press Ctrl + D (Windows) or ⌘ + D (Mac) to bookmark the page.',
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </details>
  );
}
