# IG Follow Analyzer

<p align="center">
  <img src="public/favicon.svg" alt="IG Follow Analyzer logo" width="112" />
</p>

<p align="center"><strong>วิเคราะห์ความสัมพันธ์ผู้ติดตาม Instagram แบบประมวลผลบนเครื่อง 100%</strong></p>

<p align="center">
  ตรวจสอบว่าใครไม่ติดตามกลับ เทียบคนเพิ่งเลิกติดตามจากประวัติบนเครื่อง และส่งออกรายงาน PDF A4 (ไทย / อังกฤษ) ได้ทันทีจากไฟล์ <code>.zip</code> ที่คุณส่งออกเอง โดยไม่ต้องเข้าสู่ระบบและไม่ต้องกรอกรหัสผ่าน Instagram
</p>

<p align="center">
  <a href="https://follow-analyzer.tawandev.site/">เปิดใช้งานเว็บ</a> ·
  <a href="docs/README.md">เอกสารฟีเจอร์</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center"><strong>ภาษาไทย</strong> · <a href="README.en.md">English</a></p>

---

## ฟีเจอร์หลัก

- **วิเคราะห์ ZIP ในเบราว์เซอร์ 100%:** อ่านและคำนวณไฟล์ `.zip` (JSON และ HTML) ใน Web Worker โดยไม่อัปโหลดข้อมูลผู้ติดตามไปยังเซิร์ฟเวอร์
- **คู่มือขอไฟล์จาก Instagram:** ขั้นตอนพร้อมภาพจำลองสำหรับมือถือและคอมพิวเตอร์ พร้อมหน้าอธิบายแยกว่าทำไมการวิเคราะห์จึงใช้ ZIP
- **แดชบอร์ดและตารางรายชื่อ:** สรุปยอดผู้ติดตาม กำลังติดตาม ติดตามกันและกัน และบัญชีที่ไม่ติดตามกลับ พร้อมกราฟ ค้นหา กรอง เรียงลำดับ และแบ่งหน้า
- **ส่งออกรายงาน:** เลือกดาวน์โหลด PDF A4 (ไทย / อังกฤษ) ลงเครื่องเพื่อเก็บไว้อ่านหรือพิมพ์ภายหลัง สร้างรายงานเทียบสองรอบได้เมื่อมีรายชื่อครบทั้งสองไฟล์
- **ประวัติย้อนหลังบนเครื่อง:** เทียบ ZIP ล่าสุดกับรอบก่อนโดยอัตโนมัติ หรือเลือกไฟล์ย้อนหลังของบัญชีเดียวกันเพื่อดูผู้ติดตามใหม่ บัญชีที่หายจากรายชื่อ และไทม์ไลน์ ประวัติอยู่ในเบราว์เซอร์ (`IndexedDB`) ปิดเป็นค่าเริ่มต้น และล้างข้อมูลได้หลังยืนยัน
- **โหมดตัวอย่าง:** ลองดูภาพรวมไฟล์เดียวและเทียบผลจากไฟล์ ZIP สมมติ 2 รอบ เลือก ZIP ย้อนหลังในหน้าผลตัวอย่างได้ก่อนอัปโหลดไฟล์จริง
- **ภาษาและธีม:** รองรับภาษาไทย/อังกฤษ และธีมตามระบบ (ค่าเริ่มต้น) มืด หรือสว่าง
- **ความคิดเห็นและรีวิว:** แจ้งปัญหา เสนอฟีเจอร์ หรือให้คะแนนจากหน้าเกี่ยวกับเรา เมื่อคุณกดส่งรีวิว Google Apps Script จะรับข้อมูลรีวิวเพื่อบันทึกใน Google Forms และจัดการใน Google Sheets

> ไม่รองรับการเข้าสู่ระบบเว็บไซต์, Instagram OAuth, การจัดการบัญชีผู้ใช้ หรือการติดตาม/เลิกติดตามบัญชีโดยอัตโนมัติ

## แผนผังการทำงาน

```mermaid
flowchart LR
    IG["ไฟล์ส่งออกจาก Instagram (.zip)"] --> Upload["อัปโหลดไฟล์ ZIP"]

    subgraph Browser["เบราว์เซอร์ (ประมวลผลบนเครื่อง 100%)"]
        Upload --> Worker["Web Worker (fflate)"]
        Worker --> Engine["Set Engine (คำนวณความสัมพันธ์)"]
        Engine --> Dashboard["แดชบอร์ดและตารางรายชื่อ"]
        Dashboard --> Export["ส่งออก PDF A4"]
        Dashboard -. "เลือกเปิดเอง (ปิดเป็นค่าเริ่มต้น)" .-> History["ประวัติย้อนหลัง (IndexedDB)"]
    end
```

## Tech Stack

- **Frontend:** `Vite`, `React 19`, `TypeScript`, `Tailwind CSS v4`, `lucide-react`
- **Client-Side Processing:** `fflate` (Web Worker), `pdfmake` (A4 PDF), `idb` (`IndexedDB`)
- **Quality & Testing:** `Vitest`, Testing Library, `ESLint`, `Prettier`

## เริ่มต้นใช้งาน

### ความต้องการของระบบ

- Node.js (CI ใช้ Node.js 24) และ `npm`

### การติดตั้ง

```bash
npm install
```

### การรันใช้งาน

```bash
npm run dev
```

## วิธีใช้งาน

1. ขอไฟล์ข้อมูลผู้ติดตามจากศูนย์บัญชี Instagram ตามคู่มือในแอป แล้วเช็ก **กิจกรรมปัจจุบัน** เพื่อดาวน์โหลดเมื่อไฟล์พร้อม
2. ลากหรือเลือกไฟล์ `.zip` ที่ดาวน์โหลดมาทั้งไฟล์ในหน้าวิเคราะห์ หรือเปิดดูผลตัวอย่างจากหน้าแรก
3. ตรวจสอบผลวิเคราะห์ ค้นหาหรือกรองรายชื่อ และดาวน์โหลดรายงาน PDF A4 ลงเครื่อง (บนมือถือสามารถเลือกบันทึกเข้าแอปไฟล์หรือแอปไดรฟ์บนเครื่องได้ทันที)

## การพัฒนา

คำสั่งสำหรับตรวจสอบคุณภาพโค้ดและสร้างไฟล์ผลิต:

```bash
npm run lint
npm run lint:tailwind
npm run format:check
npm run typecheck
npm run deadcode
npm run test
npm run build
```

`npm run lint:tailwind` เรียกใช้ Tailwind CSS IntelliSense language server ผ่านเทอร์มินัล รวมถึง PowerShell บน Windows คำสั่งแสดงชื่อไฟล์และบรรทัดที่มีคำเตือน Tailwind และคืนสถานะล้มเหลวเมื่อพบคำเตือน

GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) รันชุดตรวจนี้ทุกครั้งที่ push หรือเปิด PR เข้า `main` สำหรับการเผยแพร่ Production บน **Cloudflare Pages** ใช้ build command `npm run build` และ output directory `dist`

ดู[คู่มือเจ้าของเว็บสำหรับเปิดรับและจัดการรีวิว](docs/features/i18n-themes-and-privacy.md#การเปิดรับรีวิวผ่าน-google-forms)

## เอกสารเพิ่มเติม

- [เอกสารสรุปรายฟีเจอร์](docs/README.md) (`docs/features/`)
- [แกลเลอรีภาพทุกหน้าและสถานะ](docs/screenshots/README.md) (เดสก์ท็อปและมือถือ)
- [Changelog](CHANGELOG.md)
- [Project Agent Instructions](AGENTS.md)

## ลิขสิทธิ์และหมายเหตุ

- สร้างโดย [Wattanaroj Butdee (GitHub)](https://github.com/Wattanaroj2567)
- `© 2026 IG Follow Analyzer` — เครื่องมืออิสระ ไม่เกี่ยวข้องกับ Instagram หรือ Meta
- พรีวิว A4 และไฟล์ PDF ใช้สีตามธีมเว็บขณะดาวน์โหลด และใช้ฟอนต์ `Plus Jakarta Sans` กับ `IBM Plex Sans Thai` จาก `public/fonts/`
