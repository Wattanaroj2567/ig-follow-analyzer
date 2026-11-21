import type { PageId } from '../components/AppShell';
import type { Translator } from '../lib/language';

export interface FaqItem {
  q: string;
  a: string;
  link?: { page: PageId; label: string };
}

export function getComparisonFaqs(t: Translator): FaqItem[] {
  return [
    {
      q: t('ใช้ครั้งแรก มี ZIP แค่ไฟล์เดียว ทำอะไรได้บ้าง?', 'I only have one ZIP. What can I do?'),
      a: t(
        'อัปโหลด ZIP เพื่อดูว่าใครติดตามคุณกลับและใครที่คุณยังไม่ได้ติดตามกลับ ถ้าอยากเทียบในครั้งหน้า ให้เปิดทั้งบันทึกประวัติและจำรายชื่อในหน้า “ประวัติบนเครื่อง” เพื่อเก็บรายชื่อรอบนี้ไว้ การเทียบความเปลี่ยนแปลงต้องใช้ ZIP สองรอบของบัญชีเดียวกัน',
        'Upload your ZIP to see who follows you back and who you don’t follow back. To compare later, turn on both history settings to save this account list. Comparing changes takes two exports from the same account.',
      ),
      link: { page: 'upload', label: t('ไปหน้าอัปโหลด ZIP', 'Open ZIP upload') },
    },
    {
      q: t(
        'เคยเก็บรายชื่อไว้แล้ว จะเทียบกับ ZIP รอบใหม่ยังไง?',
        'I saved a follower list. How do I compare it with a newer ZIP?',
      ),
      a: t(
        'ใช้เบราว์เซอร์เดิม เข้า “ประวัติบนเครื่อง” กด “เปิดผลวิเคราะห์” แล้วกด “อัปโหลด ZIP เพื่อเทียบ” เลือก ZIP รอบใหม่ของบัญชีเดิมโดยใช้ชื่อไฟล์เดิมจาก Instagram เว็บจะเทียบกับรอบก่อนที่บันทึกรายชื่อไว้ให้อัตโนมัติ ถ้ามีหลายรอบ เลือก “เปลี่ยนไฟล์ย้อนหลัง” ในหน้าผลล่าสุดได้',
        'In the same browser, go to Local history, select “Open results,” then “Upload a ZIP to compare.” Choose a newer ZIP from the same account with its original Instagram filename. The app compares it with the previous saved list. If you have several earlier lists, select “Change previous export” in the latest results.',
      ),
      link: { page: 'history', label: t('ไปหน้าประวัติบนเครื่อง', 'Open local history') },
    },
    {
      q: t('ถ้าอัปโหลด ZIP เดิมซ้ำ ระบบจะทำอะไร?', 'What happens if I upload the same ZIP again?'),
      a: t(
        'ถ้าเปิดบันทึกประวัติไว้และ ZIP มีชื่อกับเนื้อหาเหมือนเดิม เว็บจะใช้รายการประวัติเดิมและข้ามไฟล์ซ้ำตอนหาคู่เทียบ ถ้ามีแค่ไฟล์นี้ ให้ขอ ZIP รอบใหม่ของบัญชีเดิมเพื่อดูความเปลี่ยนแปลง',
        'With history enabled, uploading a ZIP with the same name and contents reuses its history entry, and the app skips the duplicate when choosing a comparison. If it’s your only export, request a newer ZIP from the same account to see changes.',
      ),
    },
    {
      q: t(
        'ยอดผู้ติดตามเท่าเดิม รายชื่อเปลี่ยนได้ไหม?',
        'Can the follower list change if the total stays the same?',
      ),
      a: t(
        'ได้ครับ สมมติทั้งสอง ZIP มีผู้ติดตาม 100 คน แต่ไฟล์รอบใหม่มีบัญชี B เพิ่มเข้ามาและไม่พบชื่อบัญชี A ผลจะขึ้น “ติดตามใหม่ 1” และ “หายจากรายชื่อผู้ติดตาม 1” แม้ยอดรวมยังเท่าเดิม กดการ์ดเพื่อดูว่าเป็นบัญชีไหนได้เลย',
        'Yes. Suppose both ZIPs have 100 followers, but the newer ZIP adds account B and no longer lists account A. You’ll see one new follower and one account missing from the follower list, even though the total stayed the same. Select either card to see the account.',
      ),
    },
  ];
}
