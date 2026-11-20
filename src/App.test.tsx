import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { buildDemoAnalysisResult } from './data/demoAnalysis';
import { verifyFollowSetInvariants } from './data/mockFixture';
import { THEME_STORAGE_KEY } from './lib/theme';
import { HistoryScreen } from './screens/HistoryScreen';
import type { HistoryRecord } from './types/analyzer';

describe('IG Follow Analyzer — Real Client-Side Application', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

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
    expect(screen.getByText('19 Nov 2026')).toBeVisible();
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
    illustrations()
      .slice(4, 14)
      .forEach((figure) => expect(figure).not.toHaveTextContent('accountscenter.instagram.com'));
    expect(illustrations()[9]).toHaveTextContent('6 เดือนที่ผ่านมา');
    expect(illustrations()[9]).toHaveTextContent('ตั้งแต่ต้น');
    expect(illustrations()[9]).toHaveTextContent('กำหนดเอง');
    expect(illustrations()[11]).toHaveTextContent('ส่งคำขอแล้ว');
    expect(illustrations()[11]).toHaveTextContent('กิจกรรมปัจจุบัน');
    expect(illustrations()[12]).toHaveTextContent('ไฟล์ที่พร้อมให้ดาวน์โหลด');
    expect(illustrations()[13]).toHaveTextContent('เปิด (Open)');
    expect(illustrations()[14]).toHaveTextContent('ดาวน์โหลดเสร็จสมบูรณ์');
    expect(illustrations()[14]).toHaveTextContent('เปิดใน…');
    expect(illustrations()[15]).toHaveTextContent('บันทึกไปยัง แอปไฟล์');
    expect(illustrations()[16]).toHaveTextContent('รายการดาวน์โหลด');
    expect(illustrations()[16]).toHaveTextContent('บันทึกเป็น');
    illustrations().forEach((figure) =>
      expect(figure.querySelector('.guide-device-phone__status')).toHaveTextContent('08:075G76'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(illustrations()).toHaveLength(17);
    expect(illustrations()[9]).toHaveTextContent('Last 6 months');
    expect(illustrations()[11]).toHaveTextContent('Request submitted');
    expect(illustrations()[12]).toHaveTextContent('Available downloads');
    expect(illustrations()[14]).toHaveTextContent('Download complete');
    expect(illustrations()[14]).toHaveTextContent('Open in…');
    expect(illustrations()[15]).toHaveTextContent('Save to Files');
    expect(illustrations()[16]).toHaveTextContent('Downloads');
    expect(illustrations()[16]).toHaveTextContent('Save as');
    illustrations().forEach((figure) => expect(figure).not.toHaveTextContent(/[\u0e00-\u0e7f]/));

    fireEvent.click(screen.getByRole('button', { name: 'Desktop web' }));
    expect(illustrations()).toHaveLength(11);
    expect(illustrations()[3]).toHaveTextContent('accountscenter.instagram.com');
    expect(illustrations().at(-1)).toHaveTextContent('Available downloads');
    illustrations().forEach((figure) => expect(figure).not.toHaveTextContent(/[\u0e00-\u0e7f]/));

    fireEvent.click(screen.getByRole('button', { name: 'ไทย' }));
    expect(illustrations().at(-1)).toHaveTextContent('ไฟล์ที่พร้อมให้ดาวน์โหลด');
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
    expect(preview.getByRole('heading', { name: 'เปิดประวัติ แล้วอัปโหลด ZIP' })).toBeVisible();
    expect(preview.getByRole('heading', { name: 'อัปโหลด ZIP รอบใหม่' })).toBeVisible();
    expect(preview.getByText('@demo_account_014')).toBeVisible();
    expect(preview.getByText('ไม่พบในรายชื่อรอบล่าสุด')).toBeVisible();
    expect(preview.getByRole('link', { name: 'ลองดูผลเทียบตัวอย่าง' })).toHaveAttribute(
      'href',
      '#/results?demo',
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    const englishPreview = within(
      screen.getByRole('region', { name: 'See who recently unfollowed you' }),
    );
    expect(englishPreview.getByRole('heading', { name: 'Recently unfollowed' })).toBeVisible();
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
    fireEvent.click(screen.getByRole('button', { name: /ติดตามใหม่/ }));
    expect(screen.getByRole('heading', { name: 'ติดตามใหม่' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /หายจากรายชื่อ/ }));
    const row = screen.getByText('@demo_account_014').closest('details');
    expect(row).not.toHaveAttribute('open');
    fireEvent.click(within(row!).getByText('ดูไทม์ไลน์'));
    expect(row).toHaveAttribute('open');
    expect(within(row!).getByText('พบในรายชื่อรอบก่อน')).toBeVisible();
    expect(within(row!).getByText('ไม่พบในรายชื่อรอบล่าสุด')).toBeVisible();
  });

  it('shows the export menu locations for mobile and desktop', async () => {
    await act(async () => {
      render(<App />);
    });
    fireEvent.click(screen.getAllByRole('link', { name: /ดูวิธีขอไฟล์พร้อมภาพ/i })[0]);

    expect(screen.getByText(/วิธีขอไฟล์ ZIP จาก Instagram/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ผู้ติดตามและคนที่คุณติดตาม/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /ตั้งแต่ต้น \(All time\)/i })).toBeInTheDocument();

    expect(screen.getByText(/เมนูสามขีดที่มุมขวาบน/)).toBeInTheDocument();
    const desktop = screen.getByRole('button', { name: /คอมพิวเตอร์ \(Web\)/i });
    fireEvent.click(desktop);
    expect(desktop).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/มุมซ้ายล่างของแถบเมนู/)).toBeInTheDocument();
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

  it('runs demo analysis through real Dashboard, searchable Account List, and PDF screen', async () => {
    window.history.replaceState(null, '', '/#/results?demo');
    render(<App />);

    expect(await screen.findByText(/ภาพรวมบัญชี/i)).toBeInTheDocument();
    expect(screen.queryByText('1,398')).not.toBeInTheDocument();
    // Account list stays collapsed until the user clicks a Dashboard metric card
    expect(screen.queryByLabelText(/ค้นหาชื่อบัญชี/i)).toBeNull();

    const metricsGroup = screen.getByRole('group', { name: /เลือกหมวดรายชื่อจากการ์ด/ });
    const notBackCard = metricsGroup.querySelector<HTMLButtonElement>(
      '[data-relationship="notFollowingBack"]',
    )!;
    fireEvent.click(notBackCard);

    expect(await screen.findByRole('heading', { name: /ไม่ติดตามคุณกลับ/i })).toBeInTheDocument();
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
  });

  it('opens the full sample overview and waits for a dashboard card selection', async () => {
    await act(async () => {
      render(<App />);
    });
    const preview = screen.getByRole('region', { name: 'ตัวอย่างแดชบอร์ด' });
    fireEvent.click(within(preview).getByRole('button', { name: /ติดตามกันทั้งสองฝ่าย/ }));
    expect(within(preview).getByRole('heading', { name: 'ติดตามกันทั้งสองฝ่าย' })).toBeVisible();

    const trigger = within(preview).getByRole('link', { name: 'เปิดตัวอย่างเต็ม' });
    expect(trigger).toHaveAttribute('href', '#/results?demo');
    expect(trigger).not.toHaveAttribute('target');
    fireEvent.click(trigger);

    expect(
      await screen.findByRole('heading', { name: 'ตัวอย่างผลการวิเคราะห์ผู้ติดตาม', level: 1 }),
    ).toBeVisible();
    expect(screen.queryByRole('region', { name: 'ตัวอย่างแดชบอร์ด' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ภาพรวมบัญชี' })).toBeVisible();
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
    expect(within(cards[0]).getByText('ล่าสุด')).toBeVisible();
    expect(within(cards[0]).getByText('168.0 KB')).toBeVisible();
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
    expect(screen.getByRole('button', { name: 'ยกเลิก' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(onDeleteRecord).not.toHaveBeenCalled();
    fireEvent.click(deleteButton);
    fireEvent.click(screen.getByRole('button', { name: 'ลบรายการ' }));
    expect(onDeleteRecord).toHaveBeenCalledExactlyOnceWith('4');

    const clearButton = screen.getByRole('button', { name: 'ล้างประวัติทั้งหมด' });
    fireEvent.click(clearButton);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('4 รายการ');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('ปิดการบันทึกประวัติทั้งสองระดับ');
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(onClearAll).not.toHaveBeenCalled();
    fireEvent.click(clearButton);
    fireEvent.click(screen.getByRole('button', { name: 'ล้างทั้งหมด' }));
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
    expect(themes.getByRole('button', { name: 'ตามระบบ', pressed: true })).toBeVisible();
    expect(themes.getByRole('button', { name: 'มืด' })).toBeVisible();

    fireEvent.click(themes.getByRole('button', { name: 'สว่าง' }));
    expect(themes.getByRole('button', { name: 'สว่าง', pressed: true })).toBeVisible();
    expect(document.documentElement.dataset.theme).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'ปิดเมนูหลัก' }));
    expect(drawer).not.toBeInTheDocument();
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
});
