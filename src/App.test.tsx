import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { buildDemoAnalysisResult } from './data/demoAnalysis';
import { verifyFollowSetInvariants } from './data/mockFixture';
import { THEME_STORAGE_KEY } from './lib/theme';
import { HistoryScreen } from './screens/HistoryScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import type { HistoryRecord } from './types/analyzer';

function stubZipReaders() {
  const readers: TestFileReader[] = [];
  class TestFileReader {
    result: ArrayBuffer | null = null;
    onload?: () => void;
    onabort?: () => void;
    onerror?: () => void;
    readAsArrayBuffer = vi.fn();
    abort = vi.fn(() => this.onabort?.());

    constructor() {
      readers.push(this);
    }

    finish() {
      this.result = new ArrayBuffer(4);
      this.onload?.();
    }
  }
  vi.stubGlobal('FileReader', TestFileReader);
  return readers;
}

describe('IG Follow Analyzer — Real Client-Side Application', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    vi.stubEnv('VITE_REVIEW_ENDPOINT', '');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each(['/#/', '/#/terms'])('toggles each FAQ answer independently on %s', async (route) => {
    window.history.replaceState(null, '', route);
    render(<App />);

    const faqRegion = await screen.findByRole('region', { name: 'คำถามที่พบบ่อย' });
    const faq = within(faqRegion);
    expect(faqRegion.querySelector('.divide-y.divide-rule')).not.toBeNull();
    const [first, second] = faq.getAllByRole('button');
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(first).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(first).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(faq.getByRole('button', { name: 'เคยเก็บรายชื่อไว้แล้ว จะเทียบกับ ZIP รอบใหม่ยังไง?' }));
    expect(faq.getByRole('link', { name: 'ไปหน้าประวัติบนเครื่อง' })).toHaveAttribute(
      'href',
      '#/history',
    );
    fireEvent.click(faq.getByRole('button', { name: 'ยอดผู้ติดตามเท่าเดิม รายชื่อเปลี่ยนได้ไหม?' }));
    expect(faq.getByText(/ติดตามใหม่ 1.*หายจากรายชื่อผู้ติดตาม 1/)).toBeVisible();
  });

  it('keeps the feedback draft when hiding and reopening the form', async () => {
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    const feedback = within(await screen.findByRole('region', { name: 'แจ้งปัญหาหรือเสนอแนะฟีเจอร์' }));
    const toggle = feedback.getByRole('button', { name: 'เปิดแบบฟอร์มแจ้งปัญหา' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(feedback.queryByRole('form')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    const form = within(feedback.getByRole('form'));
    expect(form.getByRole('link', { name: 'อ่านวิธีที่เราใช้ข้อมูลข้อเสนอแนะ' })).toHaveAttribute(
      'href',
      '#/terms?section=feedback-data',
    );
    const details = form.getByRole('textbox', { name: '2. รายละเอียด' });
    const suggestion = form.getByRole('button', { name: 'เสนอฟีเจอร์' });
    fireEvent.click(suggestion);
    fireEvent.change(details, { target: { value: 'เพิ่มตัวกรอง' } });
    fireEvent.click(feedback.getByRole('button', { name: 'ซ่อนแบบฟอร์มแจ้งปัญหา' }));
    expect(details).not.toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(details).toBeVisible();
    expect(details).toHaveValue('เพิ่มตัวกรอง');
    expect(suggestion).toHaveAttribute('aria-pressed', 'true');
    const nativeForm = feedback.getByRole<HTMLFormElement>('form');
    expect(nativeForm).toHaveAttribute('method', 'post');
    expect(nativeForm).toHaveAttribute('target', '_blank');
    expect(nativeForm.action).toMatch(/^https:\/\/docs\.google\.com\/forms\/.*\/formResponse$/);
    expect(fireEvent.submit(nativeForm)).toBe(true);
    expect([...new FormData(nativeForm).values()]).toEqual([
      'เสนอฟีเจอร์',
      'เพิ่มตัวกรอง',
      expect.stringMatching(/\d+×\d+$/),
    ]);
    expect(await form.findByRole('status')).toHaveTextContent(/ตรวจผลการส่งในแท็บ Google Forms/);
    expect(details).toHaveValue('เพิ่มตัวกรอง');
  });

  it('keeps a review draft when changing theme or hiding the form', async () => {
    vi.stubEnv('VITE_REVIEW_ENDPOINT', 'https://script.google.com/macros/s/test-review/exec');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ acceptingReviews: true }) }),
    );
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    const openReview = await screen.findByRole('button', { name: 'เขียนรีวิว' });
    expect(screen.queryByRole('form', { name: 'รีวิวการใช้งาน' })).not.toBeInTheDocument();
    fireEvent.click(openReview);
    const form = screen.getByRole('form', { name: 'รีวิวการใช้งาน' });
    const publication = within(form).getByRole('checkbox');
    expect(publication).not.toBeChecked();
    expect(publication).toHaveAccessibleDescription(
      'หากเว้นช่องนี้ไว้ เราจะเก็บชื่อและข้อความโดยไม่แสดงบนหน้าแรก ส่วนคะแนนอาจนับรวมในคะแนนเฉลี่ย',
    );
    const comment = within(form).getByRole('textbox', { name: 'เล่าประสบการณ์สั้น ๆ' });
    fireEvent.change(comment, { target: { value: 'เทียบไฟล์ได้ง่าย' } });
    fireEvent.click(screen.getByRole('button', { name: 'สว่าง' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'มืด' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.location.hash).toBe('#/about');
    fireEvent.click(screen.getByRole('button', { name: 'ซ่อนแบบฟอร์ม' }));
    expect(form).not.toBeVisible();
    fireEvent.click(openReview);
    expect(comment).toBeVisible();
    expect(comment).toHaveValue('เทียบไฟล์ได้ง่าย');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('textbox', { name: 'Tell us about your experience' })).toBe(comment);
  });

  it('clears the rating when the same star is selected again', async () => {
    vi.stubEnv('VITE_REVIEW_ENDPOINT', 'https://script.google.com/macros/s/test-review/exec');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ acceptingReviews: true }) }),
    );
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'เขียนรีวิว' }));
    const form = within(screen.getByRole('form', { name: 'รีวิวการใช้งาน' }));
    const name = form.getByRole('textbox', { name: /ชื่อที่ต้องการให้แสดง/ });
    const comment = form.getByRole('textbox', { name: 'เล่าประสบการณ์สั้น ๆ' });
    const submit = form.getByRole('button', { name: 'ส่งรีวิว' });
    const four = form.getByRole('radio', { name: '4 ดาว' });
    const five = form.getByRole('radio', { name: '5 ดาว' });
    fireEvent.change(name, { target: { value: 'ผู้ทดสอบ' } });
    fireEvent.change(comment, { target: { value: 'เทียบไฟล์ได้ง่าย' } });

    fireEvent.click(four);
    expect(four).toBeChecked();
    expect(submit).toBeEnabled();
    fireEvent.click(four);
    expect(form.queryByRole('radio', { checked: true })).toBeNull();
    expect(submit).toBeDisabled();
    expect(name).toHaveValue('ผู้ทดสอบ');
    expect(comment).toHaveValue('เทียบไฟล์ได้ง่าย');

    fireEvent.click(four);
    fireEvent.click(five);
    expect(five).toBeChecked();
    expect(four).not.toBeChecked();
    expect(submit).toBeEnabled();
    fireEvent.keyDown(five, { key: ' ' });
    expect(five).not.toBeChecked();
    expect(submit).toBeDisabled();
  });

  it('hides the review form when intake is paused while keeping feedback available', async () => {
    const endpoint = 'https://script.google.com/macros/s/test-review/exec';
    vi.stubEnv('VITE_REVIEW_ENDPOINT', endpoint);
    let resolveStatus!: (status: { acceptingReviews: boolean }) => void;
    const status = new Promise<{ acceptingReviews: boolean }>((resolve) => {
      resolveStatus = resolve;
    });
    const fetchReview = vi.fn().mockResolvedValue({
      ok: true,
      json: () => status,
    });
    vi.stubGlobal('fetch', fetchReview);
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'รีวิวการใช้งาน' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'เขียนรีวิว' })).not.toBeInTheDocument();
    expect(screen.getByText('กำลังตรวจสอบสถานะการรับรีวิว…')).toBeVisible();
    expect(screen.getByRole('button', { name: 'เปิดแบบฟอร์มแจ้งปัญหา' })).toBeEnabled();

    resolveStatus({ acceptingReviews: false });
    expect(await screen.findByText('ขณะนี้ปิดรับรีวิวใหม่ชั่วคราว')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'เขียนรีวิว' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เปิดแบบฟอร์มแจ้งปัญหา' })).toBeEnabled();
    expect(fetchReview).toHaveBeenCalledWith(`${endpoint}?status=1`, expect.anything());
  });

  it('shows a reload hint when the review status cannot be checked', async () => {
    vi.stubEnv('VITE_REVIEW_ENDPOINT', 'https://script.google.com/macros/s/test-review/exec');
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    expect(await screen.findByText('ตรวจสอบสถานะการรับรีวิวไม่ได้ ลองโหลดหน้านี้ใหม่')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'เขียนรีวิว' })).not.toBeInTheDocument();
  });

  it('shows the paused message when intake closes after the form was loaded', async () => {
    const endpoint = 'https://script.google.com/macros/s/test-review/exec';
    vi.stubEnv('VITE_REVIEW_ENDPOINT', endpoint);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ acceptingReviews: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: false, paused: true }) }),
    );
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'เขียนรีวิว' }));
    fireEvent.click(screen.getByRole('radio', { name: '4 ดาว' }));
    fireEvent.change(screen.getByRole('textbox', { name: /ชื่อที่ต้องการให้แสดง/ }), {
      target: { value: 'ผู้ทดสอบ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    expect(await screen.findByText('ขณะนี้ปิดรับรีวิวใหม่ชั่วคราว')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'ส่งรีวิว' })).not.toBeInTheDocument();
  });

  it('preserves a review after a failed save and confirms only an acknowledged submission', async () => {
    const endpoint = 'https://script.google.com/macros/s/test-review/exec';
    vi.stubEnv('VITE_REVIEW_ENDPOINT', endpoint);
    const fetchReview = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ acceptingReviews: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: false }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          editUrl: 'https://docs.google.com/forms/d/e/example/viewform?edit2=example',
        }),
      });
    vi.stubGlobal('fetch', fetchReview);
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    const review = within(await screen.findByRole('region', { name: 'รีวิวการใช้งาน' }));
    fireEvent.click(await review.findByRole('button', { name: 'เขียนรีวิว' }));
    expect(review.getByRole('link', { name: 'อ่านวิธีที่เราใช้ข้อมูลรีวิว' })).toHaveAttribute(
      'href',
      '#/terms?section=review-data',
    );
    const submit = review.getByRole('button', { name: 'ส่งรีวิว' });
    expect(submit).toBeDisabled();
    fireEvent.click(review.getByRole('radio', { name: '4 ดาว' }));
    const name = review.getByRole('textbox', { name: /ชื่อที่ต้องการให้แสดง/ });
    expect(name).toBeRequired();
    expect(submit).toBeDisabled();
    fireEvent.change(name, { target: { value: '   ' } });
    expect(submit).toBeDisabled();
    fireEvent.change(name, { target: { value: ' ผู้ทดสอบ ' } });
    expect(submit).toBeEnabled();
    const comment = review.getByRole('textbox', { name: 'เล่าประสบการณ์สั้น ๆ' });
    fireEvent.change(comment, { target: { value: 'เทียบไฟล์ได้ง่าย' } });
    const consent = review.getByRole('checkbox');
    expect(consent).not.toBeChecked();
    fireEvent.click(submit);
    expect(await review.findByRole('alert')).toBeVisible();
    expect(comment).toHaveValue('เทียบไฟล์ได้ง่าย');
    expect(fetchReview.mock.calls[1][0]).toBe(endpoint);
    expect(Object.fromEntries(fetchReview.mock.calls[1][1].body)).toEqual({
      rating: '4',
      comment: 'เทียบไฟล์ได้ง่าย',
      displayName: 'ผู้ทดสอบ',
      mayPublish: 'false',
      browserId: expect.stringMatching(/^[a-f0-9-]{36}$/),
    });

    fireEvent.click(consent);
    fireEvent.click(submit);
    expect(await review.findByRole('status')).toHaveTextContent('บันทึกรีวิวแล้ว');
    expect(fetchReview.mock.calls[2][1].body.get('mayPublish')).toBe('true');
    expect(fetchReview.mock.calls[2][1].body.get('browserId')).toBe(
      fetchReview.mock.calls[1][1].body.get('browserId'),
    );
    expect(review.getByRole('link', { name: 'แก้รีวิวใน Google Forms' })).toHaveAttribute(
      'href',
      'https://docs.google.com/forms/d/e/example/viewform?edit2=example',
    );
    expect(review.queryByRole('form')).not.toBeInTheDocument();
  });

  it('shows the current app version and changelog link on the About page', async () => {
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    expect(await screen.findByText(`เวอร์ชัน ${__APP_VERSION__}`)).toBeVisible();
    expect(screen.getByRole('link', { name: 'ดูบันทึกการอัปเดต (GitHub)' })).toHaveAttribute(
      'href',
      'https://github.com/Wattanaroj2567/ig-follow-analyzer/blob/main/CHANGELOG.md',
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByText(`Version ${__APP_VERSION__}`)).toBeVisible();
    expect(screen.getByRole('link', { name: 'View changelog (GitHub)' })).toHaveAttribute(
      'href',
      'https://github.com/Wattanaroj2567/ig-follow-analyzer/blob/main/CHANGELOG.md',
    );
  });

  it('shows the rating total and up to six public comments on the landing page', async () => {
    vi.stubGlobal('AbortSignal', undefined);
    vi.stubEnv('VITE_REVIEW_ENDPOINT', 'https://script.google.com/macros/s/test-review/exec');
    const fetchReview = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scoreCount: 9,
        average: 4.2,
        reviews: Array.from({ length: 7 }, (_, index) => ({
          displayName: 'แก้ว',
          rating: 4,
          comment: `ข้อความทดสอบ ${index + 1}`,
        })),
      }),
    });
    vi.stubGlobal('fetch', fetchReview);
    const { unmount } = render(<App />);

    expect(screen.getByText('กำลังโหลดรีวิว…')).toBeVisible();
    const summary = within(await screen.findByRole('region', { name: 'รีวิวจากผู้ใช้' }));
    expect(summary.getByText('4.2 / 5')).toBeVisible();
    expect(summary.getByText('จาก 9 คะแนน')).toBeVisible();
    expect(summary.getAllByRole('listitem')).toHaveLength(6);
    expect(summary.getAllByText('ก')).toHaveLength(6);
    expect(summary.queryByText('ข้อความทดสอบ 7')).not.toBeInTheDocument();

    unmount();
    let finishRefresh!: (response: unknown) => void;
    fetchReview.mockReturnValueOnce(
      new Promise((resolve) => {
        finishRefresh = resolve;
      }),
    );
    render(<App />);
    expect(screen.getByText('4.2 / 5')).toBeVisible();

    await act(async () => {
      finishRefresh({
        ok: true,
        json: async () => ({ scoreCount: 0, average: null, reviews: [] }),
      });
    });
    expect(screen.queryByRole('region', { name: 'รีวิวจากผู้ใช้' })).not.toBeInTheDocument();
  });

  it.each(['cancel', 'navigate'])('discards a pending ZIP read on %s', async (action) => {
    window.history.replaceState(null, '', '/#/upload');
    const createWorker = vi.fn();
    vi.stubGlobal('Worker', createWorker);
    const readers = stubZipReaders();
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['test'], 'test.zip');
    fireEvent.change(input, { target: { files: [file] } });

    if (action === 'cancel') {
      fireEvent.click(screen.getByRole('button', { name: 'ยกเลิกการวิเคราะห์' }));
    } else {
      act(() => {
        window.history.replaceState(null, '', '/#/about');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }
    expect(readers[0].abort).toHaveBeenCalledOnce();
    await act(async () => readers[0].finish());
    expect(createWorker).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(action === 'cancel' ? '#/upload' : '#/about');
  });

  it('ignores a cancelled worker callback when the next upload has started', async () => {
    window.history.replaceState(null, '', '/#/upload');
    const readers = stubZipReaders();
    const workers: TestWorker[] = [];
    class TestWorker {
      onmessage?: (event: {
        data: { type: string; result: ReturnType<typeof buildDemoAnalysisResult> };
      }) => void;
      terminate = vi.fn();
      postMessage = vi.fn();

      constructor() {
        workers.push(this);
      }
    }
    vi.stubGlobal('Worker', TestWorker);
    const { container } = render(<App />);
    const choose = async (name: string) => {
      await act(async () => {
        fireEvent.change(container.querySelector('input[type="file"]')!, {
          target: { files: [new File(['test'], name)] },
        });
        readers.at(-1)?.finish();
      });
    };

    await choose('first.zip');
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิกการวิเคราะห์' }));
    await choose('second.zip');
    expect(workers).toHaveLength(2);
    const result = { ...buildDemoAnalysisResult(), isDemoData: false };
    act(() => workers[0].onmessage?.({ data: { type: 'success', result } }));
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(workers[1].terminate).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/upload');
    await act(async () => workers[1].onmessage?.({ data: { type: 'success', result } }));
    expect(window.location.hash).toBe('#/results');
  });

  it('rejects empty and multiple ZIP selections before reading any files', async () => {
    window.history.replaceState(null, '', '/#/upload');
    const readers = stubZipReaders();
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]')!;
    const dropZone = input.parentElement!;
    const empty = new File([], 'empty.zip');
    await act(async () => {
      fireEvent.change(input, { target: { files: [empty] } });
    });
    expect(screen.getByRole('alert')).toHaveTextContent('ขนาด 0 ไบต์');
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [empty, new File(['test'], 'second.zip')] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('เลือกไฟล์ ZIP ทีละไฟล์');
    expect(readers).toHaveLength(0);
  });

  it('distinguishes worker startup failure from a file read error', async () => {
    window.history.replaceState(null, '', '/#/upload');
    const readers = stubZipReaders();
    vi.stubGlobal(
      'Worker',
      class FailingWorker {
        constructor() {
          throw new Error('Worker unavailable');
        }
      },
    );
    const { container } = render(<App />);
    const choose = () =>
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [new File(['test'], 'test.zip')] },
      });
    choose();
    await act(async () => readers[0].onerror?.());
    expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถอ่านไฟล์จากอุปกรณ์');
    choose();
    await act(async () => readers[1].finish());
    expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถเริ่มตัวประมวลผลไฟล์');
  });

  it('keeps the review form on the About page while the receiver is unavailable', async () => {
    vi.stubEnv('VITE_REVIEW_ENDPOINT', 'https://example.com/exec');
    window.history.replaceState(null, '', '/#/about');
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'เขียนรีวิว' }));
    const review = within(screen.getByRole('region', { name: 'รีวิวการใช้งาน' }));
    expect(review.queryByRole('link')).not.toBeInTheDocument();
    fireEvent.click(review.getByRole('radio', { name: '4 ดาว' }));
    fireEvent.change(review.getByRole('textbox', { name: /ชื่อที่ต้องการให้แสดง/ }), {
      target: { value: 'ผู้ทดสอบ' },
    });
    expect(review.getByRole('button', { name: 'ส่งรีวิว' })).toBeDisabled();
    expect(review.getByText('ยังไม่เปิดรับรีวิวในขณะนี้')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'แจ้งปัญหาหรือเสนอแนะฟีเจอร์' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    const termsLink = screen.getByRole('link', { name: 'Read Terms and Privacy' });
    expect(termsLink).toHaveAttribute('href', '#/terms');
    fireEvent.click(termsLink);
    expect(await screen.findByText('Ratings and review comments')).toBeVisible();
  });

  it('switches the current results in place and restores English after reopening the app', async () => {
    window.history.replaceState(null, '', '/#/results?demo');
    const app = render(<App />);
    const metrics = await screen.findByRole('group', { name: 'เลือกหมวดรายชื่อจากการ์ด' });
    fireEvent.click(within(metrics).getByRole('button', { name: /ไม่ติดตามคุณกลับ/ }));
    const search = screen.getByRole('searchbox', { name: 'ค้นหาชื่อบัญชี' });
    fireEvent.change(search, { target: { value: 'bkk.cafe.hopper' } });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('searchbox', { name: 'Search by username' })).toBe(search);
    expect(search).toHaveValue('bkk.cafe.hopper');
    const exportDates = within(
      screen.getByRole('region', { name: 'How did your follower list change?' }),
    );
    expect(exportDates.getByText('ZIP you’re viewing')).toBeVisible();
    expect(exportDates.getByText('Comparison ZIP')).toBeVisible();
    expect(exportDates.getByRole('status', { name: 'Comparison ZIP' })).toHaveTextContent(
      '19 Oct 2026',
    );
    expect(exportDates.getByText('19 Nov 2026')).toBeVisible();
    expect(window.location.hash).toBe('#/results?demo');

    app.unmount();
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Sample follower analysis' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('translates an upload error already on the page', async () => {
    window.history.replaceState(null, '', '/#/upload');
    render(<App />);
    const input = await screen.findByLabelText('เลือกไฟล์ ZIP จาก Instagram');
    fireEvent.change(input, { target: { files: [new File(['example'], 'example.txt')] } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'กรุณาเลือกไฟล์นามสกุล .zip ที่ดาวน์โหลดจาก Instagram',
    );
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose the .zip file you downloaded from Instagram.',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('example.txt');
  });

  it('switches all illustrated export steps to the selected language', async () => {
    window.history.replaceState(null, '', '/#/how-it-works');
    const { container } = render(<App />);
    await screen.findByRole('button', { name: 'มือถือ (แอป IG)' });
    const illustrations = () => Array.from(container.querySelectorAll('#export-steps figure'));
    const formatButton = () => container.querySelector('#m-11 .guide-highlight-btn');
    const startButton = () => container.querySelector('#m-12 .guide-highlight-btn');
    const downloadPrompt = () => container.querySelectorAll('#m-16 figure')[1];
    const downloadComplete = () => container.querySelector('#m-17 figure');
    illustrations()
      .slice(4, 15)
      .forEach((figure) => expect(figure).not.toHaveTextContent('accountscenter.instagram.com'));
    expect(illustrations()[9]).toHaveTextContent('6 เดือนที่ผ่านมา');
    expect(illustrations()[9]).toHaveTextContent('ตั้งแต่ต้น');
    expect(illustrations()[9]).toHaveTextContent('กำหนดเอง');
    expect(formatButton()).toHaveTextContent('บันทึก');
    expect(startButton()).toHaveTextContent('เริ่มส่งออก');
    expect(illustrations()[11]).toHaveTextContent(/ยืนยันการส่งออกของคุณ.*ตั้งแต่ต้น.*JSON/);
    expect(illustrations()[12]).toHaveTextContent('ส่งคำขอแล้ว');
    expect(illustrations()[12]).toHaveTextContent('กิจกรรมปัจจุบัน');
    expect(illustrations()[13]).toHaveTextContent('ไฟล์ที่พร้อมให้ดาวน์โหลด');
    expect(illustrations()[14]).toHaveTextContent('ดาวน์โหลดไฟล์ของคุณ');
    expect(illustrations()[14].querySelector('.guide-highlight-btn')).toHaveTextContent('ดาวน์โหลด');
    expect(illustrations()[15]).toHaveTextContent('โปรดป้อนรหัสผ่านของคุณอีกครั้ง');
    expect(illustrations()[15]).toHaveTextContent('ดำเนินการต่อ');
    expect(illustrations()[15].querySelector('input, form')).toBeNull();
    expect(downloadPrompt()).toHaveTextContent('บันทึก…');
    expect(downloadPrompt()).not.toHaveTextContent('ดาวน์โหลดเสร็จสมบูรณ์');
    expect(container.querySelector('#m-16')).toHaveTextContent(/Android.*ข้ามขั้นที่ 17–18.*ขั้นที่ 19/);
    expect(screen.getByRole('button', { name: 'Android · ไปขั้นที่ 19 เพื่อหาไฟล์ ZIP' })).toBeVisible();
    expect(screen.getAllByRole('heading', { name: /^สำหรับ iPhone เท่านั้น/ })).toHaveLength(2);
    expect(downloadComplete()).toHaveTextContent('ดาวน์โหลดเสร็จสมบูรณ์');
    expect(downloadComplete()).toHaveTextContent('เปิดใน…');
    expect(illustrations().at(-2)).toHaveTextContent('บันทึกไปยัง แอปไฟล์');
    expect(illustrations().at(-1)).toHaveTextContent('รายการดาวน์โหลด');
    expect(illustrations().at(-1)).toHaveTextContent('บันทึกเป็น');
    expect(container.querySelector('#m-19')).toHaveTextContent('Chrome → เมนู ⋮ → ดาวน์โหลด');
    illustrations().forEach((figure) =>
      expect(figure.querySelector('.guide-device-phone__status')).toHaveTextContent('08:075G76'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(container.querySelectorAll('#export-steps > li')).toHaveLength(19);
    expect(illustrations()[9]).toHaveTextContent('Last 6 months');
    expect(formatButton()).toHaveTextContent('Save');
    expect(startButton()).toHaveTextContent('Start export');
    expect(illustrations()[11]).toHaveTextContent(/Confirm your export.*All time.*JSON/);
    expect(illustrations()[12]).toHaveTextContent('Request submitted');
    expect(illustrations()[13]).toHaveTextContent('Available downloads');
    expect(illustrations()[14]).toHaveTextContent('Download your files');
    expect(illustrations()[14].querySelector('.guide-highlight-btn')).toHaveTextContent('Download');
    expect(illustrations()[15]).toHaveTextContent('please enter your password again');
    expect(illustrations()[15]).toHaveTextContent('Continue');
    expect(downloadPrompt()).toHaveTextContent('Save…');
    expect(downloadPrompt()).not.toHaveTextContent('Download complete');
    expect(container.querySelector('#m-16')).toHaveTextContent(
      /Android.*skip steps 17–18.*step 19/,
    );
    expect(screen.getAllByRole('heading', { name: /^iPhone only/ })).toHaveLength(2);
    expect(downloadComplete()).toHaveTextContent('Download complete');
    expect(downloadComplete()).toHaveTextContent('Open in…');
    expect(illustrations().at(-2)).toHaveTextContent('Save to Files');
    expect(illustrations().at(-1)).toHaveTextContent('Downloads');
    expect(illustrations().at(-1)).toHaveTextContent('Save as');
    expect(container.querySelector('#m-19')).toHaveTextContent('Chrome → ⋮ menu → Downloads');
    expect(
      within(document.getElementById('m-19')!).getByRole('button', {
        name: 'Choose your ZIP file',
      }),
    ).toBeVisible();
    const officialGuide = within(screen.getByRole('region', { name: 'Official Instagram guide' }));
    expect(officialGuide.getByRole('link', { name: 'Read Instagram Help Center' })).toBeVisible();
    expect(officialGuide.queryByRole('button')).not.toBeInTheDocument();
    illustrations().forEach((figure) => expect(figure).not.toHaveTextContent(/[\u0e00-\u0e7f]/));

    fireEvent.click(screen.getByRole('button', { name: 'Desktop web' }));
    expect(illustrations()).toHaveLength(15);
    expect(illustrations()[3]).toHaveTextContent('accountscenter.instagram.com');
    expect(illustrations()[8]).toHaveTextContent('All time');
    expect(illustrations()[9].querySelector('.guide-highlight-btn')).toHaveTextContent('Save');
    expect(illustrations()[10].querySelector('.guide-highlight-btn')).toHaveTextContent(
      'Start export',
    );
    expect(illustrations()[11]).toHaveTextContent('Available downloads');
    expect(illustrations()[12]).toHaveTextContent('Download your files');
    expect(illustrations()[13]).toHaveTextContent('please enter your password again');
    expect(illustrations()[13].querySelector('input, form')).toBeNull();
    illustrations().forEach((figure) => expect(figure).not.toHaveTextContent(/[\u0e00-\u0e7f]/));
    const finalDesktopStep = within(document.getElementById('w-15')!);
    expect(finalDesktopStep.getByText('Save as', { selector: 'mark' })).toBeVisible();
    expect(finalDesktopStep.getByText('Show in folder', { selector: 'mark' })).toBeVisible();
    expect(finalDesktopStep.getByText(/select the original \.zip file/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'ไทย' }));
    expect(illustrations()[8]).toHaveTextContent('ตลอดเวลา');
    expect(illustrations()[10]).toHaveTextContent('ตลอดเวลา');
    expect(illustrations()[11]).toHaveTextContent('ไฟล์ที่พร้อมให้ดาวน์โหลด');
    expect(illustrations()[13]).toHaveTextContent('โปรดป้อนรหัสผ่านของคุณอีกครั้ง');
    expect(finalDesktopStep.getByText('บันทึกเป็น', { selector: 'mark' })).toBeVisible();
    expect(finalDesktopStep.getByText('แสดงในโฟลเดอร์', { selector: 'mark' })).toBeVisible();
    expect(finalDesktopStep.getByText(/เลือกไฟล์ \.zip ที่เพิ่งดาวน์โหลดทั้งไฟล์/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'คอมพิวเตอร์ (Web)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('localizes the sample A4 report in place, including the account list', async () => {
    window.history.replaceState(null, '', '/#/pdf?demo');
    render(<App />);
    const title = await screen.findByRole('heading', {
      name: 'รายงานสรุปความสัมพันธ์ผู้ติดตาม Instagram',
    });
    const sheet = title.closest('[lang]');
    expect(sheet).toHaveAttribute('lang', 'th');
    expect(sheet).not.toHaveTextContent(/1,398|บัญชีทั้งหมด/);
    expect(sheet).toHaveTextContent('1,212 (86.7%)');
    expect(sheet).toHaveTextContent('150 (10.7%)');
    expect(sheet).toHaveTextContent('36 (2.6%)');
    expect(screen.queryByText(/TH Sarabun New|สารบัญหัวข้อในรายงาน/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(sheet).toHaveAttribute('lang', 'en');
    expect(sheet).toHaveTextContent('Instagram follower report');
    expect(sheet).toHaveTextContent('19 Nov 2026');
    expect(sheet).not.toHaveTextContent(/1,398|Total accounts/);
    expect(sheet).toHaveTextContent('Mutual follows');
    expect(screen.queryByText(/TH Sarabun New|Report contents/)).not.toBeInTheDocument();
    expect(sheet).not.toHaveTextContent(/[\u0e00-\u0e7f]/);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('columnheader', { name: 'Profile link' })).toBeVisible();
    expect(screen.getByRole('table')).not.toHaveTextContent(/[\u0e00-\u0e7f]/);

    fireEvent.click(screen.getByRole('button', { name: 'ไทย' }));
    expect(screen.getByRole('columnheader', { name: 'ลิงก์โปรไฟล์' })).toBeVisible();
    expect(window.location.hash).toBe('#/pdf?demo');
  });

  it('renders clickable Instagram profile links and windows lightbox pages in PDF preview', async () => {
    window.history.replaceState(null, '', '/#/pdf?demo');
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: 'รายงานสรุปความสัมพันธ์ผู้ติดตาม Instagram' });

    // Enable all followers so the report spans many A4 pages
    fireEvent.click(screen.getByRole('checkbox', { name: /รายชื่อผู้ติดตามทั้งหมด/ }));
    fireEvent.click(screen.getByRole('button', { name: 'หน้าถัดไป' }));

    const profileLinks = screen.getAllByRole('link', { name: /^instagram\.com\// });
    expect(profileLinks.length).toBeGreaterThan(0);
    expect(profileLinks[0]).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/www\.instagram\.com\/.+\/$/),
    );
    expect(profileLinks[0]).toHaveAttribute('target', '_blank');
    expect(profileLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');

    // Clicking a profile link on the inline sheet should not open the fullscreen lightbox
    fireEvent.click(profileLinks[0]);
    expect(container.querySelector('dialog.pdf-preview-dialog')).toBeNull();

    // Open fullscreen lightbox and confirm pages are windowed (not all rendered at once)
    const openLightbox = screen.getByRole('button', { name: /ขยายดูตัวอย่างเอกสาร A4/ });
    const origShowModal = HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    try {
      fireEvent.click(openLightbox);
      const dialog = container.querySelector('dialog.pdf-preview-dialog');
      expect(dialog).not.toBeNull();
      const renderedSheets = dialog!.querySelectorAll('.pdf-sheet-font');
      expect(renderedSheets.length).toBeGreaterThan(0);
      expect(renderedSheets.length).toBeLessThanOrEqual(5);
      expect(
        within(dialog as HTMLElement).getAllByRole('link', { name: /^instagram\.com\// }).length,
      ).toBeGreaterThan(0);
    } finally {
      HTMLDialogElement.prototype.showModal = origShowModal;
    }
  });

  it('computes mathematically consistent demo fixture counts via real set engine', () => {
    const demo = buildDemoAnalysisResult();
    expect(verifyFollowSetInvariants(demo.counts)).toBe(true);
    expect(demo.counts.followers).toBe(1248);
    expect(demo.counts.following).toBe(1362);
    expect(demo.counts.notFollowingBack).toBe(150);
    expect(demo.counts.notFollowedBack).toBe(36);
    expect(demo.counts.mutual).toBe(1212);
  });

  it('renders clean Top Bar wordmark, Copyright footer, and no login/password prompt', async () => {
    render(<App />);
    expect(await screen.findByText(/© 2026 IG Follow Analyzer/)).toBeInTheDocument();
    expect(screen.getAllByText(/Follow Analyzer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ไม่เกี่ยวข้องกับ Instagram หรือ Meta/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /เข้าสู่ระบบ|Login|Sign in/i })).toBeNull();
  });

  it('shows the full local history workflow at once and links to setup', async () => {
    render(<App />);
    const preview = within(screen.getByRole('region', { name: 'ดูว่าใครเพิ่งเลิกติดตาม' }));
    expect(preview.getByRole('heading', { name: 'เปิดประวัติ แล้วอัปโหลด ZIP 1 ไฟล์' })).toBeVisible();
    expect(preview.getByRole('heading', { name: 'อัปโหลด ZIP ใหม่ 1 ไฟล์' })).toBeVisible();
    expect(preview.getByRole('note')).toHaveTextContent('ลองจดยอดผู้ติดตามบนโปรไฟล์ Instagram');
    expect(preview.getByRole('note')).toHaveTextContent(
      'ถ้าจำยอดเดิมไม่ได้ ก็ใช้ ZIP รอบก่อนที่บันทึกไว้เทียบได้เลย',
    );
    expect(preview.getByRole('note')).toHaveTextContent('ลองขอ ZIP ใหม่วันถัดไปหรือหลังจากนั้น');
    expect(preview.getByText('@demo_account_014')).toBeVisible();
    expect(preview.getByText('ไม่พบในรายชื่อรอบล่าสุด')).toBeVisible();
    expect(preview.getByRole('link', { name: 'ลองดูผลเทียบตัวอย่าง 2 ไฟล์' })).toHaveAttribute(
      'href',
      '#/results?demo',
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    const englishPreview = within(
      screen.getByRole('region', { name: 'See who recently unfollowed you' }),
    );
    expect(englishPreview.getByRole('heading', { name: 'Recently unfollowed' })).toBeVisible();
    expect(englishPreview.getByRole('note')).toHaveTextContent(
      'follower count on your Instagram profile',
    );
    expect(englishPreview.getByRole('note')).toHaveTextContent('a fresh ZIP the next day or later');
    fireEvent.click(englishPreview.getByRole('link', { name: 'Set up local history' }));

    expect(window.location.hash).toBe('#/history');
    const switches = await screen.findAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('opens both sample comparison groups and expands a follower timeline', async () => {
    window.history.replaceState(null, '', '/#/results?demo');
    await act(async () => {
      render(<App />);
    });
    const newFollowers = screen.getByRole('button', { name: /ติดตามใหม่/ });
    fireEvent.click(newFollowers);
    expect(screen.getByRole('heading', { name: 'ติดตามใหม่' })).toBeVisible();

    const missingFollowers = screen.getByRole('button', { name: /หายจากรายชื่อ/ });
    fireEvent.click(missingFollowers);
    const row = screen.getByText('@demo_account_014').closest('details');
    const profile = screen.getByRole('link', {
      name: 'เปิดโปรไฟล์ Instagram ของ @demo_account_014',
    });
    expect(profile).toHaveAttribute('href', 'https://www.instagram.com/demo_account_014/');
    expect(profile).toHaveAttribute('target', '_blank');
    expect(row).not.toHaveAttribute('open');
    fireEvent.click(within(row!).getByText('ดูไทม์ไลน์'));
    expect(row).toHaveAttribute('open');
    expect(within(row!).getByText('พบในรายชื่อรอบก่อน')).toBeVisible();
    expect(within(row!).getByText('ไม่พบในรายชื่อรอบล่าสุด')).toBeVisible();
  });

  it('opens the sample comparison directly and omits the sample-history entry', async () => {
    window.history.replaceState(null, '', '/#/');
    render(<App />);

    const section = await screen.findByRole('region', { name: 'ดูว่าใครเพิ่งเลิกติดตาม' });
    expect(within(section).getByRole('link', { name: 'ลองดูผลเทียบตัวอย่าง 2 ไฟล์' })).toHaveAttribute(
      'href',
      '#/results?demo',
    );
    expect(within(section).queryByRole('link', { name: 'ดูประวัติตัวอย่าง' })).not.toBeInTheDocument();
    fireEvent.click(within(section).getByRole('link', { name: 'ลองดูผลเทียบตัวอย่าง 2 ไฟล์' }));
    expect(await screen.findByRole('heading', { name: 'ตัวอย่างผลการวิเคราะห์ผู้ติดตาม' })).toBeVisible();
  });

  it('changes the sample comparison and timeline while keeping the latest ZIP fixed', async () => {
    const openDatabase = vi.fn();
    vi.stubGlobal('indexedDB', { open: openDatabase });
    window.history.replaceState(null, '', '/#/results?demo');
    render(<App />);

    const comparison = within(
      await screen.findByRole('region', { name: 'รายชื่อผู้ติดตามเปลี่ยนไปยังไง?' }),
    );
    const selectedExport = comparison.getByRole('status', { name: 'ไฟล์ที่ใช้เทียบ' });
    expect(comparison.getByText('รอบก่อนหน้า', { selector: 'dt span' })).toBeVisible();
    expect(comparison.getByText('ไฟล์ที่กำลังดู')).toBeVisible();
    expect(screen.getAllByText('19 พ.ย. 2569')).toHaveLength(1);
    expect(screen.getAllByText('instagram-demo-2026-11-19.zip')).toHaveLength(1);
    expect(selectedExport).not.toHaveTextContent('วิเคราะห์เวลา');
    expect(screen.getByText('ใช้ข้อมูลสมมติและไม่บันทึกลงประวัติ')).toBeVisible();
    expect(screen.queryByText('วิเคราะห์เสร็จสมบูรณ์')).not.toBeInTheDocument();
    expect(comparison.getByRole('button', { name: /ติดตามใหม่ 57/ })).toBeVisible();
    expect(comparison.getByRole('button', { name: /หายจากรายชื่อผู้ติดตาม 1/ })).toBeVisible();
    expect(comparison.getByRole('button', { name: /ติดตามใหม่ 57/ })).toHaveAccessibleDescription(
      'ไฟล์ที่ใช้เทียบไม่มีชื่อ → ไฟล์ที่กำลังดูมีชื่อ',
    );
    expect(
      comparison.getByRole('button', { name: /หายจากรายชื่อผู้ติดตาม 1/ }),
    ).toHaveAccessibleDescription('ไฟล์ที่ใช้เทียบมีชื่อ → ไฟล์ที่กำลังดูไม่มีชื่อ');
    expect(comparison.queryByRole('region', { name: 'ผู้ติดตามทั้งหมด' })).not.toBeInTheDocument();
    expect(comparison.queryByRole('region', { name: 'ไม่ติดตามคุณกลับ' })).not.toBeInTheDocument();
    fireEvent.click(comparison.getByText('เปลี่ยนไฟล์ย้อนหลัง'));
    expect(
      comparison.getByRole('radio', { name: /instagram-demo-2026-10-19.zip.*รอบก่อนหน้า/ }),
    ).toBeChecked();
    fireEvent.click(
      comparison.getByRole('radio', { name: /instagram-demo-2026-09-19.zip.*รอบเก่ากว่า/ }),
    );
    expect(comparison.getByText('เลือกเอง', { selector: 'dt span' })).toBeVisible();
    expect(comparison.getByRole('button', { name: /ติดตามใหม่ 94/ })).toBeVisible();
    expect(comparison.getByRole('button', { name: /หายจากรายชื่อผู้ติดตาม 1/ })).toBeVisible();
    expect(comparison.getByText(/เว็บจะแสดงบัญชี A ในหมวด/)).toBeVisible();
    expect(
      comparison.getByText('instagram-demo-2026-11-19.zip', { selector: 'dd span' }),
    ).toBeVisible();
    expect(selectedExport).toHaveTextContent('19 ก.ย. 2569');
    expect(selectedExport).toHaveTextContent('instagram-demo-2026-09-19.zip');
    expect(comparison.getByText('19 พ.ย. 2569')).toBeVisible();

    fireEvent.click(comparison.getByRole('button', { name: /หายจากรายชื่อ/ }));
    fireEvent.click(screen.getByText('@demo_account_014', { exact: true }));
    expect(screen.getByText('พบในรายชื่อไฟล์ที่เลือกเทียบ')).toBeVisible();
    fireEvent.click(comparison.getByRole('radio', { name: /instagram-demo-2026-08-19.zip/ }));
    expect(comparison.getByRole('button', { name: /หายจากรายชื่อผู้ติดตาม 0/ })).toBeVisible();
    expect(screen.queryByText('@demo_account_014', { exact: true })).not.toBeInTheDocument();

    fireEvent.click(comparison.getByRole('button', { name: 'กลับไปเทียบรอบก่อนหน้า' }));
    expect(comparison.getByText('รอบก่อนหน้า', { selector: 'dt span' })).toBeVisible();
    expect(selectedExport).toHaveTextContent('19 ต.ค. 2569');

    fireEvent.click(comparison.getByRole('radio', { name: /instagram-demo-2026-09-19.zip/ }));
    fireEvent.click(screen.getByRole('button', { name: 'สร้างรายงาน PDF ตัวอย่าง' }));
    const pdfTitle = screen.getByRole('heading', {
      name: 'รายงานสรุปความสัมพันธ์ผู้ติดตาม Instagram',
    });
    const sheet = pdfTitle.closest('[lang]');
    expect(sheet).toHaveTextContent('เทียบกับ instagram-demo-2026-09-19.zip');
    expect(screen.queryByRole('region', { name: 'ไฟล์ที่ใช้เทียบในรายงาน' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'เปลี่ยนไฟล์ย้อนหลัง' })).not.toBeInTheDocument();
    expect(sheet).toHaveTextContent('ติดตามใหม่ 94 บัญชี · หายจากรายชื่อผู้ติดตาม 1 บัญชี');
    expect(sheet).not.toHaveTextContent(/ผู้ติดตามสุทธิ|ส่วนต่าง \(กำลังติดตาม/);
    fireEvent.click(screen.getByRole('button', { name: 'หน้าถัดไป' }));
    expect(screen.getByText(/ติดตามใหม่ \(94 บัญชี\)/)).toBeVisible();
    const includeComparison = screen.getByRole('checkbox', { name: 'สรุปผลเทียบสองไฟล์' });
    expect(includeComparison).toBeChecked();
    fireEvent.click(includeComparison);
    expect(sheet).not.toHaveTextContent('ความเปลี่ยนแปลงระหว่างสองไฟล์');

    const includeSummary = screen.getByRole('checkbox', {
      name: 'หน้าสรุปภาพรวมและกราฟวงกลม 1 หน้า',
    });
    fireEvent.click(includeSummary);
    expect(sheet).not.toHaveTextContent('รายงานสรุปความสัมพันธ์ผู้ติดตาม Instagram');
    fireEvent.click(includeSummary);
    expect(sheet).toHaveTextContent('รายงานสรุปความสัมพันธ์ผู้ติดตาม Instagram');

    const estimateBefore = screen.getByText(/^ทั้งหมด [\d,]+ หน้า$/).textContent;
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /รายชื่อผู้ติดตามทั้งหมด/,
      }),
    );
    const estimateAfter = screen.getByText(/^ทั้งหมด [\d,]+ หน้า$/).textContent;
    expect(estimateAfter).not.toBe(estimateBefore);
    const breadcrumb = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    expect(breadcrumb.getByText('รายงาน PDF ตัวอย่าง').closest('li')).toHaveAttribute(
      'aria-current',
      'page',
    );
    const resultsLink = breadcrumb.getByRole('link', { name: /ผลวิเคราะห์ตัวอย่าง/ });
    expect(resultsLink).toHaveAttribute('href', '#/results?demo');
    fireEvent.click(resultsLink);
    const restoredExport = await screen.findByRole('status', { name: 'ไฟล์ที่ใช้เทียบ' });
    expect(restoredExport).toHaveTextContent('19 ก.ย. 2569');
    expect(restoredExport).toHaveTextContent('instagram-demo-2026-09-19.zip');
    expect(screen.getByText('19 พ.ย. 2569')).toBeVisible();
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('opens the ZIP comparison and export steps on separate pages', async () => {
    await act(async () => {
      render(<App />);
    });
    const comparison = screen.getByRole('link', { name: 'ทำไมต้องใช้ไฟล์ ZIP?' });
    expect(comparison).toHaveAttribute('href', '#/export-comparison');
    expect(screen.queryByRole('table', { name: /ล็อกอิน Instagram/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'ภาพรวม 3 ขั้นตอน: ขอไฟล์จนเลือก ZIP' }),
    ).not.toBeInTheDocument();

    fireEvent.click(comparison);
    expect(window.location.hash).toBe('#/export-comparison');
    expect(screen.getByRole('table', { name: /ล็อกอิน Instagram/ })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'ดูวิธีขอไฟล์ ZIP' }));
    expect(window.location.hash).toBe('#/how-it-works');
    expect(screen.getByRole('heading', { name: 'ภาพรวม 3 ขั้นตอน: ขอไฟล์จนเลือก ZIP' })).toBeVisible();
  });

  it('shows context-aware breadcrumb navigation across flows without looping', async () => {
    const home = render(<App />);
    expect(screen.queryByRole('navigation', { name: 'เส้นทางหน้า' })).not.toBeInTheDocument();
    home.unmount();

    // Direct entry to Upload -> back goes to Home
    window.history.replaceState(null, '', '/#/upload');
    const app = render(<App />);
    const uploadNav = within(await screen.findByRole('navigation', { name: 'เส้นทางหน้า' }));
    const homeLink = uploadNav.getByRole('link', { name: /กลับหน้าแรก/ });
    expect(homeLink).toHaveAttribute('href', '#/');
    fireEvent.click(homeLink);
    expect(window.location.hash).toBe('#/');
    expect(screen.queryByRole('navigation', { name: 'เส้นทางหน้า' })).not.toBeInTheDocument();

    // Landing -> Export comparison -> How it works -> Back -> Export comparison -> Back -> Home
    fireEvent.click(screen.getByRole('link', { name: 'ทำไมต้องใช้ไฟล์ ZIP?' }));
    expect(window.location.hash).toBe('#/export-comparison');
    fireEvent.click(screen.getByRole('button', { name: 'ดูวิธีขอไฟล์ ZIP' }));
    expect(window.location.hash).toBe('#/how-it-works');
    const guideNav = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    const comparisonBack = guideNav.getByRole('link', { name: /ทำไมต้องใช้ไฟล์ ZIP/ });
    expect(comparisonBack).toHaveAttribute('href', '#/export-comparison');
    fireEvent.click(comparisonBack);
    expect(window.location.hash).toBe('#/export-comparison');
    const comparisonNav = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    expect(comparisonNav.queryByRole('link', { name: /วิธีขอไฟล์/ })).not.toBeInTheDocument();
    fireEvent.click(comparisonNav.getByRole('link', { name: /หน้าแรก/ }));
    expect(window.location.hash).toBe('#/');

    // About -> History -> Back -> About, then Top-nav switch resets trail to Home -> About
    fireEvent.click(screen.getAllByRole('link', { name: 'เกี่ยวกับเรา' })[0]);
    expect(window.location.hash).toBe('#/about');
    fireEvent.click(screen.getByRole('button', { name: 'ตั้งค่าประวัติบนเครื่อง' }));
    expect(window.location.hash).toBe('#/history');
    const historyFromAbout = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    expect(historyFromAbout.getByRole('link', { name: /เกี่ยวกับเรา/ })).toHaveAttribute(
      'href',
      '#/about',
    );
    fireEvent.click(historyFromAbout.getByRole('link', { name: /เกี่ยวกับเรา/ }));
    expect(window.location.hash).toBe('#/about');
    expect(
      within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' })).queryByRole('link', {
        name: /ประวัติบนเครื่อง/,
      }),
    ).not.toBeInTheDocument();

    // Real analysis flow: Upload -> Results -> History -> Back returns to Results
    fireEvent.click(screen.getAllByRole('link', { name: 'วิเคราะห์ไฟล์' })[0]);
    const readers = stubZipReaders();
    const workers: {
      onmessage?: (event: {
        data: { type: string; result: ReturnType<typeof buildDemoAnalysisResult> };
      }) => void;
      terminate: ReturnType<typeof vi.fn>;
      postMessage: ReturnType<typeof vi.fn>;
    }[] = [];
    class FlowWorker {
      onmessage?: (event: {
        data: { type: string; result: ReturnType<typeof buildDemoAnalysisResult> };
      }) => void;
      terminate = vi.fn();
      postMessage = vi.fn();
      constructor() {
        workers.push(this);
      }
    }
    vi.stubGlobal('Worker', FlowWorker);
    const input = app.container.querySelector('input[type="file"]')!;
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [new File(['zip'], 'instagram-user-2026-11-20.zip')] },
      });
      readers.at(-1)?.finish();
    });
    const realResult = { ...buildDemoAnalysisResult(), isDemoData: false };
    await act(async () => {
      workers.at(-1)?.onmessage?.({ data: { type: 'success', result: realResult } });
    });
    expect(window.location.hash).toBe('#/results');
    expect(document.documentElement.dataset.preventPullRefresh).toBe('true');

    // Click "Set up local history" prompt on Results -> History
    fireEvent.click(screen.getByRole('button', { name: 'ตั้งค่าประวัติบนเครื่อง' }));
    expect(window.location.hash).toBe('#/history');
    expect(document.documentElement.dataset.preventPullRefresh).toBeUndefined();
    const historyFromResults = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    const backToResults = historyFromResults.getByRole('link', { name: /กลับไปหน้าผลวิเคราะห์/ });
    expect(backToResults).toHaveAttribute('href', '#/results');
    fireEvent.click(backToResults);
    expect(window.location.hash).toBe('#/results');
    expect(document.documentElement.dataset.preventPullRefresh).toBe('true');
    expect(screen.getByRole('heading', { name: 'ผลการวิเคราะห์ผู้ติดตาม' })).toBeVisible();

    // Results -> Upload ("Analyze another ZIP") -> Back returns to Results
    fireEvent.click(screen.getByRole('button', { name: 'อัปโหลดไฟล์ใหม่' }));
    expect(window.location.hash).toBe('#/upload');
    const uploadFromResults = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    fireEvent.click(uploadFromResults.getByRole('link', { name: /กลับไปหน้าผลวิเคราะห์/ }));
    expect(window.location.hash).toBe('#/results');

    // Top-nav click resets trail cleanly to Home -> History (no stale Results parent)
    fireEvent.click(screen.getAllByRole('link', { name: 'ประวัติบนเครื่อง' })[0]);
    expect(window.location.hash).toBe('#/history');
    const historyFromNav = within(screen.getByRole('navigation', { name: 'เส้นทางหน้า' }));
    expect(historyFromNav.queryByRole('link', { name: /ผลวิเคราะห์/ })).not.toBeInTheDocument();
    expect(historyFromNav.getByRole('link', { name: /กลับหน้าแรก/ })).toHaveAttribute('href', '#/');
  });

  it('shows the export menu locations for mobile and desktop', async () => {
    await act(async () => {
      render(<App />);
    });
    fireEvent.click(screen.getByRole('link', { name: 'ดูวิธีขอไฟล์' }));

    expect(screen.getByText(/วิธีขอไฟล์ ZIP จาก Instagram/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ผู้ติดตามและคนที่คุณติดตาม/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /ตั้งแต่ต้น \(All time\)/i })).toBeInTheDocument();

    expect(screen.getByText(/เมนูสามขีดที่มุมขวาบน/)).toBeInTheDocument();
    const desktop = screen.getByRole('button', { name: /คอมพิวเตอร์ \(Web\)/i });
    fireEvent.click(desktop);
    expect(desktop).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/มุมซ้ายล่างของแถบเมนู/)).toBeInTheDocument();
  });

  it('focuses the date range step when opening its guide link', async () => {
    window.history.replaceState(null, '', '/#/how-it-works?section=date-range');
    render(<App />);
    const heading = await screen.findByRole('heading', { name: /เลือกช่วงวันที่ ตั้งแต่ต้น/ });
    expect(heading.closest('li')).toHaveFocus();
  });

  it('keeps downloaded-file help collapsed and links to the Instagram export guide', async () => {
    window.history.replaceState(null, '', '/#/upload');
    await act(async () => {
      render(<App />);
    });
    expect(
      screen.queryByRole('heading', { name: 'ยังไม่มีไฟล์ .zip จาก Instagram?' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เลือกไฟล์ .ZIP จากเครื่อง' })).toBeVisible();
    const help = screen.getByText('ดูวิธีหาไฟล์ที่ดาวน์โหลดไว้');
    expect(screen.getByText('iPhone', { exact: true })).not.toBeVisible();
    fireEvent.click(help);
    expect(screen.getByText('iPhone', { exact: true })).toBeVisible();
    fireEvent.click(help);
    expect(screen.getByText('iPhone', { exact: true })).not.toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'ดูวิธีขอไฟล์จาก Instagram' }));
    expect(await screen.findByRole('heading', { name: 'วิธีขอไฟล์ ZIP จาก Instagram' })).toBeVisible();
  });

  it.each([90, 180])(
    'warns about a possible limited date range with a %i-day follower span',
    (days) => {
      const result = buildDemoAnalysisResult();
      const day = 86400;
      const oldest = 1_700_000_000;
      render(
        <ResultsScreen
          result={{
            ...result,
            isDemoData: false,
            followers: result.followers.map((entry, index) => ({
              ...entry,
              timestamp: oldest + (index === 0 ? 0 : days * day),
            })),
            following: [{ ...result.following[0], timestamp: oldest - 181 * day }],
          }}
          diff={null}
          comparison={null}
          comparisonStatus="off"
          onNavigate={vi.fn()}
          onSelectComparison={vi.fn()}
        />,
      );
      const warning = screen.getByRole('note');
      expect(warning).toHaveTextContent('รายชื่อผู้ติดตามใน ZIP อาจครอบคลุมแค่บางช่วง');
      expect(warning).toHaveTextContent('วันที่ติดตามใน ZIP บอกไม่ได้ว่าคุณตั้งช่วงไหน');
      expect(within(warning).getByRole('link', { name: 'ดูขั้นตอนเลือกช่วงตลอดเวลา' })).toHaveAttribute(
        'href',
        '#/how-it-works?section=date-range',
      );
    },
  );

  it('offers the next comparison action for each history state', () => {
    const onNavigate = vi.fn();
    const props = {
      result: { ...buildDemoAnalysisResult(), isDemoData: false },
      diff: null,
      comparison: null,
      onNavigate,
      onSelectComparison: vi.fn(),
    };
    const { rerender } = render(<ResultsScreen {...props} comparisonStatus="off" />);
    const prompt = within(screen.getByRole('region', { name: 'ขั้นตอนถัดไปสำหรับเทียบไฟล์' }));
    fireEvent.click(prompt.getByRole('button', { name: 'ตั้งค่าประวัติบนเครื่อง' }));
    expect(onNavigate).toHaveBeenLastCalledWith('history');

    rerender(<ResultsScreen {...props} comparisonStatus="waiting" />);
    fireEvent.click(prompt.getByRole('button', { name: 'อัปโหลด ZIP เพื่อเก็บรายชื่อ' }));
    expect(onNavigate).toHaveBeenLastCalledWith('upload');

    rerender(<ResultsScreen {...props} comparisonStatus="unknown-owner" />);
    expect(prompt.getByRole('button', { name: 'อัปโหลด ZIP ชื่อเดิม' })).toBeVisible();

    rerender(<ResultsScreen {...props} comparisonStatus="ready" />);
    fireEvent.click(screen.getByRole('button', { name: 'อัปโหลด ZIP เพื่อเทียบ' }));
    expect(onNavigate).toHaveBeenLastCalledWith('upload');
    expect(screen.queryByRole('button', { name: 'อัปโหลดไฟล์ใหม่' })).not.toBeInTheDocument();
  });

  it('runs demo analysis through real Dashboard, searchable Account List, and PDF screen', async () => {
    window.history.replaceState(null, '', '/#/results?demo');
    render(<App />);

    const overview = await screen.findByRole('heading', { name: 'ภาพรวมบัญชี' });
    fireEvent.click(screen.getByRole('button', { name: 'ดูภาพรวมบัญชีและรายชื่อ' }));
    expect(overview).toHaveFocus();
    const profileCountsExplanation = screen.getByText(
      'ทำไมยอดในไฟล์ ZIP อาจมากกว่าหรือต่างจากหน้าโปรไฟล์ Instagram?',
    );
    expect(profileCountsExplanation.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(profileCountsExplanation);
    expect(screen.getByText('1. ยอดใน ZIP มากกว่าหน้าโปรไฟล์')).toBeVisible();
    expect(screen.getByText(/บัญชีที่ถูกปิดใช้งาน/)).toBeVisible();
    expect(screen.queryByText('1,398')).not.toBeInTheDocument();
    const calculation = screen.getByText('ดูวิธีคำนวณ');
    expect(calculation.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(calculation);
    expect(screen.getByText('1,212 + 150 + 36 = 1,398')).toBeVisible();
    expect(screen.getByText('1,212 ÷ 1,398 × 100 ≈ 86.7%')).toBeVisible();
    expect(screen.getByText('150 ÷ 1,398 × 100 ≈ 10.7%')).toBeVisible();
    expect(screen.getByText('36 ÷ 1,398 × 100 ≈ 2.6%')).toBeVisible();
    // Account list stays collapsed until the user clicks a Dashboard metric card
    expect(screen.queryByLabelText(/ค้นหาชื่อบัญชี/i)).toBeNull();

    const metricsGroup = screen.getByRole('group', { name: /เลือกหมวดรายชื่อจากการ์ด/ });
    const notBackCard = metricsGroup.querySelector<HTMLButtonElement>(
      '[data-relationship="notFollowingBack"]',
    )!;
    fireEvent.click(notBackCard);

    expect(
      await screen.findByRole('heading', { name: 'ไม่ติดตามคุณกลับ', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /หมวดรายชื่อบัญชี/ })).toBeNull();
    const searchInput = screen.getByLabelText(/ค้นหาชื่อบัญชี/i);
    fireEvent.change(searchInput, { target: { value: 'bkk.cafe.hopper' } });
    expect(screen.getAllByText(/@bkk\.cafe\.hopper/i).length).toBeGreaterThan(0);

    const mutualCard = metricsGroup.querySelector<HTMLButtonElement>(
      '[data-relationship="mutual"]',
    )!;
    fireEvent.click(mutualCard);
    expect(mutualCard).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: /ติดตามกันทั้งสองฝ่าย/i })).toBeInTheDocument();
    expect(screen.queryByText(/@bkk\.cafe\.hopper/i)).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /สร้างรายงาน PDF/i })[0]);
    expect(await screen.findByText(/ดาวน์โหลด PDF ลงเครื่อง/i)).toBeInTheDocument();
    expect(screen.getByText('1,212 จาก 1,362 บัญชี (89.0%)')).toBeVisible();
    fireEvent.click(screen.getByText('ดูวิธีคำนวณ'));
    expect(screen.getByText('1,212 + 150 + 36 = 1,398')).toBeVisible();
    expect(screen.getByText('1,212 ÷ 1,398 × 100 ≈ 86.7%')).toBeVisible();
    expect(screen.getByText('1,212 ÷ 1,362 × 100 ≈ 89.0%')).toBeVisible();
    fireEvent.click(screen.getByRole('checkbox', { name: /หน้าสรุปภาพรวมและกราฟวงกลม/ }));
    expect(screen.queryByText('ดูวิธีคำนวณ')).not.toBeInTheDocument();
  });

  it('distinguishes one-ZIP relationships from changes between two sample exports', async () => {
    await act(async () => {
      render(<App />);
    });
    const preview = within(screen.getByRole('region', { name: 'ตัวอย่างแดชบอร์ด' }));
    const wavePath = document.querySelector('.landing-hero__ig-wave-runner');
    expect(wavePath).toHaveAttribute('stroke', 'url(#hero-wave-gradient)');
    const single = preview.getByRole('button', { name: 'ไฟล์เดียว' });
    const compare = preview.getByRole('button', { name: 'เทียบ 2 ไฟล์' });
    expect(single).toHaveAttribute('aria-pressed', 'true');
    expect(preview.getByRole('heading', { name: 'ไม่ติดตามคุณกลับ' })).toBeVisible();
    expect(preview.queryByRole('button', { name: /เริ่มติดตามคุณ|หายจากรายชื่อ/ })).toBeNull();

    fireEvent.click(compare);
    expect(compare).toHaveAttribute('aria-pressed', 'true');
    expect(preview.getByRole('status')).toHaveTextContent('เทียบไฟล์ 19 ต.ค. 2569 กับ 19 พ.ย. 2569');
    expect(preview.getByRole('heading', { name: 'เริ่มติดตามคุณ' })).toBeVisible();
    expect(preview.getAllByRole('row')).toHaveLength(5);
    expect(preview.queryByRole('button', { name: /ไม่ติดตามคุณกลับ/ })).toBeNull();

    fireEvent.click(preview.getByRole('button', { name: /หายจากรายชื่อ/ }));
    expect(preview.getByText('@demo_account_014')).toBeVisible();
    expect(preview.getByRole('columnheader', { name: 'พบในไฟล์รอบก่อน' })).toBeVisible();
    fireEvent.click(single);
    expect(preview.getByRole('heading', { name: 'ไม่ติดตามคุณกลับ' })).toBeVisible();
    expect(preview.queryByText('@demo_account_014')).toBeNull();
  });

  it('opens the full sample overview and waits for a dashboard card selection', async () => {
    await act(async () => {
      render(<App />);
    });
    const preview = screen.getByRole('region', { name: 'ตัวอย่างแดชบอร์ด' });
    fireEvent.click(within(preview).getByRole('button', { name: /ติดตามกันทั้งสองฝ่าย/ }));
    expect(within(preview).getByRole('heading', { name: 'ติดตามกันทั้งสองฝ่าย' })).toBeVisible();

    const trigger = within(screen.getByRole('region', { name: 'ดูว่าใครเพิ่งเลิกติดตาม' })).getByRole(
      'link',
      { name: 'ลองดูผลเทียบตัวอย่าง 2 ไฟล์' },
    );
    expect(
      screen.getAllByRole('link').filter((link) => link.getAttribute('href') === '#/results?demo'),
    ).toEqual([trigger]);
    expect(trigger).toHaveAttribute('href', '#/results?demo');
    expect(trigger).not.toHaveAttribute('target');
    fireEvent.click(trigger);

    expect(
      await screen.findByRole('heading', { name: 'ตัวอย่างผลการวิเคราะห์ผู้ติดตาม', level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole('status', { name: 'ไฟล์ที่ใช้เทียบ' })).toHaveTextContent('19 ต.ค. 2569');
    expect(screen.queryByRole('region', { name: 'ตัวอย่างแดชบอร์ด' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ภาพรวมบัญชี' })).toBeVisible();
    expect(screen.getByRole('button', { name: /หายจากรายชื่อ/ })).toBeVisible();
    expect(screen.queryByRole('searchbox', { name: 'ค้นหาชื่อบัญชี' })).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#/results?demo');

    const metrics = screen.getByRole('group', { name: 'เลือกหมวดรายชื่อจากการ์ด' });
    expect(within(metrics).queryByRole('button', { pressed: true })).not.toBeInTheDocument();
    fireEvent.click(within(metrics).getByRole('button', { name: /ติดตามกันทั้งสองฝ่าย/ }));
    expect(screen.getByRole('heading', { name: 'ติดตามกันทั้งสองฝ่าย' })).toBeVisible();
    const search = screen.getByRole('searchbox', { name: 'ค้นหาชื่อบัญชี' });
    fireEvent.change(search, { target: { value: 'mutual_friend_0001' } });
    expect(screen.getAllByText(/@mutual_friend_0001/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /สร้างรายงาน PDF ตัวอย่าง/ }));
    expect(await screen.findByText(/ดาวน์โหลด PDF ลงเครื่อง/i)).toBeInTheDocument();
    expect(window.location.hash).toBe('#/pdf?demo');
  });

  it('shows only the highlighted relationship count in the center of the dashboard chart', async () => {
    window.history.replaceState(null, '', '/#/results?demo');
    await act(async () => {
      render(<App />);
    });
    const legend = screen.getByRole('list', { name: 'สัดส่วนในกราฟความสัมพันธ์' });
    const chart = within(legend.closest('.relationship-chart')!);
    const center = chart.getByRole('status');
    const mutual = within(legend).getByText('ติดตามกันทั้งสองฝ่าย');

    expect(center).toBeEmptyDOMElement();
    expect(legend).toHaveTextContent('86.7%');
    fireEvent(
      mutual,
      Object.assign(new Event('pointerover', { bubbles: true }), { pointerType: 'mouse' }),
    );
    expect(within(center).getByText('1,212')).toBeVisible();
    expect(within(center).getByText('ติดตามกันทั้งสองฝ่าย')).toBeVisible();
    fireEvent.pointerOut(mutual);
    expect(center).toBeEmptyDOMElement();

    const notFollowingBack = within(legend).getByRole('button', { name: /ไม่ติดตามคุณกลับ/ });
    fireEvent.click(notFollowingBack);
    expect(within(center).getByText('150')).toBeVisible();
    expect(notFollowingBack).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    fireEvent.click(notFollowingBack);
    expect(center).toBeEmptyDOMElement();
  });

  it('shows the ZIP size and the analysis order for each account in history', async () => {
    const records: HistoryRecord[] = [
      { id: '4', ownerHandle: 'first', sourceFileSize: 172_032 },
      { id: '3', ownerHandle: 'second', sourceFileSize: 2_097_152 },
      { id: '2', ownerHandle: 'first' },
      { id: '1', ownerHandle: 'first', sourceFileSize: 512 },
    ].map((record) => ({
      ...record,
      sourceFileName: `${record.ownerHandle}-${record.id}.zip`,
      analyzedAtIso: `2026-11-20T08:0${record.id}:00Z`,
      snapshotDateLabel: '20 พ.ย. 2569',
      counts: buildDemoAnalysisResult().counts,
    }));
    const onDeleteRecord = vi.fn().mockResolvedValue(undefined);
    const onClearAll = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <HistoryScreen
        preferences={{ tier1SummaryOptIn: true, tier2HandlesOptIn: false }}
        records={records}
        activeRecordId={null}
        hasActiveAnalysis={false}
        hasLatestSnapshot={false}
        onUpdatePreferences={vi.fn()}
        onOpenRecord={vi.fn()}
        onDeleteRecord={onDeleteRecord}
        onClearAll={onClearAll}
      />,
    );
    const cards = screen.getAllByRole('article');
    const jumpToSavedEntries = screen.getByRole('button', { name: 'ดูรายการประวัติ' });
    expect(jumpToSavedEntries.querySelector('svg')).not.toBeNull();
    fireEvent.click(jumpToSavedEntries);
    expect(screen.getByRole('heading', { name: /รายการประวัติที่บันทึกไว้บนเครื่องนี้/ })).toHaveFocus();
    expect(within(cards[0]).getByText('ล่าสุด')).toBeVisible();
    expect(within(cards[0]).getByText('168.0 KB')).toBeVisible();
    fireEvent.click(within(cards[0]).getByRole('button', { name: 'รายละเอียดเพิ่มเติม' }));
    expect(within(cards[0]).getByText('1,212 จาก 1,362 บัญชี (89.0%)')).toBeVisible();
    expect(within(cards[1]).getByText('ล่าสุด')).toBeVisible();
    expect(within(cards[1]).getByText('2.00 MB')).toBeVisible();
    expect(within(cards[2]).getByText('ก่อนหน้า')).toBeVisible();
    expect(within(cards[2]).getByText('ไม่มีข้อมูลขนาด')).toBeVisible();
    expect(within(cards[3]).getByText('เก่ากว่า')).toBeVisible();
    const historyRange = screen.getByRole('list', { name: 'ช่วงประวัติของแต่ละบัญชี' });
    expect(within(historyRange).getByText('มีประวัติ 1 รอบ')).toBeVisible();
    const [first, latest] = historyRange.querySelectorAll('time');
    expect(first).toHaveAttribute('datetime', records[3].analyzedAtIso);
    expect(latest).toHaveAttribute('datetime', records[0].analyzedAtIso);
    fireEvent.click(screen.getByRole('button', { name: /@first/ }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByText('ก่อนหน้า')).toBeVisible();
    expect(within(historyRange).queryByText('@second')).not.toBeInTheDocument();

    const dialog = container.querySelector('dialog');
    if (!dialog) throw new Error('Missing history confirmation dialog');
    dialog.showModal = () => {
      dialog.setAttribute('open', '');
    };
    dialog.close = () => {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    };
    const deleteButton = within(cards[0]).getByRole('button', { name: /ลบประวัติวันที่/ });
    fireEvent.click(deleteButton);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('first-4.zip');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('วิเคราะห์เมื่อ');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('ประวัติที่ลบแล้วกู้คืนไม่ได้');
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('ดาวน์โหลดไว้');
    expect(screen.getByRole('button', { name: 'ยกเลิก' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(onDeleteRecord).not.toHaveBeenCalled();
    fireEvent.click(deleteButton);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'ลบรายการ' }));
    });
    expect(onDeleteRecord).toHaveBeenCalledExactlyOnceWith('4');

    const clearButton = screen.getByRole('button', { name: 'ล้างประวัติทั้งหมด' });
    fireEvent.click(clearButton);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('4 รายการ');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('ปิดการบันทึกประวัติทั้งสองระดับ');
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(onClearAll).not.toHaveBeenCalled();
    fireEvent.click(clearButton);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'ล้างทั้งหมด' }));
    });
    expect(onClearAll).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/ล้างประวัติและปิดสวิตช์/)).toBeVisible();
  });

  it('defaults History Model B 2-tier opt-in switches to OFF', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('link', { name: /^ประวัติบนเครื่อง$/i })[0]);

    const switches = await screen.findAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toBeDisabled();
    expect(
      screen.getByRole('heading', { name: 'ทำไมระบบถึงปิดการบันทึกประวัติเป็นค่าเริ่มต้น?' }),
    ).toBeVisible();
  });

  it('keeps the top bar free of a compare link and a duplicate analyze button', async () => {
    await act(async () => {
      render(<App />);
    });
    const header = document.querySelector('header.nav') as HTMLElement;
    expect(header.textContent).not.toMatch(/เปรียบเทียบ/);
    expect(header.textContent).not.toMatch(/เริ่มวิเคราะห์เลย/);
    expect(header.textContent).toMatch(/วิธีขอไฟล์/);
  });

  it('shows mobile theme controls only inside the open navigation drawer', async () => {
    await act(async () => {
      render(<App />);
    });
    const menuToggle = screen.getByRole('button', { name: 'เปิดเมนูหลัก' });
    expect(within(menuToggle.parentElement!).getAllByRole('button')).toEqual([menuToggle]);
    expect(screen.queryByRole('navigation', { name: 'เมนูหลักบนมือถือ' })).toBeNull();
    fireEvent.click(menuToggle);

    const drawer = screen.getByRole('navigation', { name: 'เมนูหลักบนมือถือ' });
    const themes = within(within(drawer).getByRole('group', { name: 'เลือกธีมสี' }));
    expect(within(drawer).getByRole('link', { name: 'วิธีขอไฟล์' })).toBeVisible();
    expect(within(drawer).getByRole('group', { name: 'ภาษา' })).toBeVisible();
    expect(themes.getAllByRole('button')).toEqual([
      themes.getByRole('button', { name: 'ตามระบบ', pressed: true }),
      themes.getByRole('button', { name: 'สว่าง' }),
      themes.getByRole('button', { name: 'มืด' }),
    ]);

    fireEvent.click(themes.getByRole('button', { name: 'สว่าง' }));
    expect(themes.getByRole('button', { name: 'สว่าง', pressed: true })).toBeVisible();
    expect(document.documentElement.dataset.theme).toBe('light');

    themes.getByRole('button', { name: 'สว่าง' }).focus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(drawer).not.toBeInTheDocument();
    expect(menuToggle).toHaveFocus();
  });

  it('restores System, tracks device changes, and respects a saved manual override', async () => {
    const systemScheme = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal('matchMedia', (query: string) =>
      query === '(prefers-color-scheme: dark)' ? systemScheme : { matches: false },
    );
    const setDeviceDarkMode = (matches: boolean) => {
      systemScheme.matches = matches;
      systemScheme.dispatchEvent(new Event('change'));
    };
    window.localStorage.setItem(THEME_STORAGE_KEY, 'system');

    const app = render(<App />);
    expect(await screen.findByRole('button', { name: 'ตามระบบ', pressed: true })).toBeVisible();
    expect(document.documentElement.dataset.theme).toBe('light');

    setDeviceDarkMode(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');

    fireEvent.click(screen.getByRole('button', { name: 'มืด' }));
    setDeviceDarkMode(false);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    app.unmount();
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByRole('button', { name: 'มืด', pressed: true })).toBeVisible();
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'ตามระบบ' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('renders landing page sections immediately without opacity-hiding scroll-reveal wrappers', async () => {
    render(<App />);
    const readingsSection = (
      await screen.findByRole('heading', { name: 'ข้อมูลอยู่บนเครื่องของคุณตั้งแต่ต้นจนจบ' })
    ).closest('section');
    expect(readingsSection).not.toBeNull();
    expect(readingsSection?.querySelector('.panels')).toHaveTextContent(/100%.*200 MB/);
    expect(document.querySelectorAll('.scroll-reveal')).toHaveLength(0);
  });
});
