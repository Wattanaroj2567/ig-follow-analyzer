# การอ่านไฟล์ ZIP และ Set Engine

**ภาษาไทย** · [English](zip-parser-and-set-engine.en.md)

## ภาพรวม

ฟีเจอร์นี้รับไฟล์ `.zip` ที่ผู้ใช้ส่งออกจากศูนย์บัญชี Instagram มาแตกและคำนวณในเบราว์เซอร์ 100% ผ่าน Web Worker เพื่อไม่ให้หน้าเว็บค้างและไม่ส่งข้อมูลออกไปยังเซิร์ฟเวอร์ใดๆ

## ความสามารถหลัก

- **ประมวลผลใน Web Worker (`fflate`):** อ่านเฉพาะไฟล์เป้าหมาย (`followers_*.json`, `following.json` หรือไฟล์ `.html` เทียบเท่า) และข้ามรูปภาพ/วิดีโอ/ไฟล์อื่นทั้งหมด
- **รองรับทั้ง JSON และ HTML:**
  - **JSON (แนะนำ):** รองรับทั้งโครงสร้างเดิม (`string_list_data[].value`) และโครงสร้างใหม่ของ Meta (`title` และลิงก์ `/_u/<handle>`) พร้อมดึง timestamp วันที่ติดตาม
  - **HTML (Fallback):** ดึงรายชื่อบัญชีด้วย regex ที่ปลอดภัยโดยไม่ฉีด HTML เข้า DOM (ไม่มี timestamp วันที่ติดตาม)
- **ระบบป้องกันไฟล์ผิดปกติ:**
  - จำกัดขนาดไฟล์ ZIP ไม่เกิน `200 MB`
  - จำกัดขนาดข้อมูลหลังแตกเฉพาะไฟล์เป้าหมายไม่เกิน `50 MB`
  - จำกัดจำนวนรายการในไฟล์ไม่เกิน `25,000` entries
  - ป้องกัน Path Traversal (`..`, absolute path)
- **Set Engine และวันที่ติดตามสองฝั่ง:**
  - คำนวณ 5 หมวดจากเซตโดยตรง: `Followers`, `Following`, `Mutual`, `Not Following Back`, `Not Followed Back`
  - แยกวันที่ติดตามฝั่งเขา (`followedUsAt`) และฝั่งเรา (`followedByUsAt`) เพื่อแสดงข้อมูลได้ครบในหมวดติดตามกันและกัน
- **แยกบัญชีเจ้าของจากชื่อไฟล์:** ดึง handle เจ้าของจากชื่อไฟล์มาตรฐานของ Instagram (เช่น `instagram-<handle>-YYYY-MM-DD-...zip`) เพื่อแยกประวัติย้อนหลังของแต่ละบัญชี

## ไฟล์โค้ดที่เกี่ยวข้อง

- [`src/workers/zipParser.worker.ts`](../../src/workers/zipParser.worker.ts) — Web Worker รับ `ArrayBuffer` และส่งความคืบหน้า (`validating` → `unpacking` → `parsing` → `comparing` → `complete`)
- [`src/lib/igParser.ts`](../../src/lib/igParser.ts) — ตัวแตกไฟล์, parser (JSON/HTML), set math และ `computeHistoryDiff`
- [`src/lib/uploadFeedback.ts`](../../src/lib/uploadFeedback.ts) — ข้อความแจ้งเตือนและสถานะข้อผิดพลาดฝั่ง UI
- [`src/screens/UploadScreen.tsx`](../../src/screens/UploadScreen.tsx) — หน้าลาก/เลือกไฟล์ `.zip` และตัวแสดงความคืบหน้า
- [`src/lib/igParser.test.ts`](../../src/lib/igParser.test.ts) — Unit tests สำหรับ parser และ set engine
