import type { ArchiveErrorCode, ParseStage } from '../types/analyzer';
import type { Language } from './language';

export type UploadErrorCode =
  | ArchiveErrorCode
  | 'CANCELLED'
  | 'INVALID_EXTENSION'
  | 'WORKER_ERROR'
  | 'READ_FAILED'
  | 'UNKNOWN_ERROR';

type Bilingual = Record<Language, string>;
const getNewExport: Bilingual = {
  th: 'ลองดาวน์โหลดไฟล์ ZIP จาก Instagram ใหม่อีกครั้ง',
  en: 'Download a fresh copy of your export from Instagram and try again.',
};
const selectJson: Bilingual = {
  th: 'แนะนำให้เลือกส่งออกข้อมูลเป็นรูปแบบ JSON จากศูนย์บัญชี Instagram',
  en: 'Request a new export in JSON format from Instagram Accounts Center.',
};
const selectFollowersAndFollowing: Bilingual = {
  th: 'ขอไฟล์ใหม่โดยเลือกเฉพาะหมวดผู้ติดตามและกำลังติดตาม',
  en: 'Request another export with only Followers and following selected.',
};
const selectOriginal: Bilingual = {
  th: 'เลือกไฟล์ ZIP ต้นฉบับที่ดาวน์โหลดจาก Instagram โดยไม่ต้องแตกไฟล์',
  en: 'Choose the original ZIP from Instagram and keep it zipped.',
};

export const uploadErrors: Record<UploadErrorCode, { message: Bilingual; hint: Bilingual }> = {
  CANCELLED: {
    message: { th: 'ยกเลิกการวิเคราะห์ไฟล์แล้ว', en: 'Analysis canceled.' },
    hint: { th: 'คุณสามารถเลือกไฟล์ .zip ใหม่ได้ทุกเมื่อ', en: 'Choose another ZIP anytime.' },
  },
  INVALID_EXTENSION: {
    message: {
      th: 'กรุณาเลือกไฟล์นามสกุล .zip ที่ดาวน์โหลดจาก Instagram',
      en: 'Choose the .zip file you downloaded from Instagram.',
    },
    hint: selectOriginal,
  },
  ARCHIVE_TOO_LARGE: {
    message: { th: 'ไฟล์ ZIP มีขนาดเกิน 200 MB', en: 'This ZIP is larger than 200 MB.' },
    hint: selectFollowersAndFollowing,
  },
  WORKER_ERROR: {
    message: {
      th: 'เบราว์เซอร์ไม่สามารถเริ่มตัวประมวลผลไฟล์ได้',
      en: 'Your browser couldn’t start the file processor.',
    },
    hint: {
      th: 'กรุณารีเฟรชหน้าเว็บแล้วลองเลือกไฟล์ .zip ใหม่อีกครั้ง',
      en: 'Refresh the page and select the ZIP again.',
    },
  },
  READ_FAILED: {
    message: {
      th: 'ไม่สามารถอ่านไฟล์จากอุปกรณ์ของคุณได้',
      en: 'The file couldn’t be read from your device.',
    },
    hint: {
      th: 'ตรวจสอบว่าไฟล์ไม่ได้ถูกย้ายหรือถูกลบ แล้วลองเลือกใหม่อีกครั้ง',
      en: 'Make sure the file is still on your device, then select it again.',
    },
  },
  UNKNOWN_ERROR: {
    message: { th: 'เกิดข้อผิดพลาดระหว่างอ่านไฟล์ ZIP', en: 'The ZIP couldn’t be read.' },
    hint: selectOriginal,
  },
  INVALID_FOLLOWERS_JSON: {
    message: {
      th: 'ไม่สามารถอ่านไฟล์ JSON ของรายชื่อผู้ติดตามได้',
      en: 'The followers JSON couldn’t be read.',
    },
    hint: getNewExport,
  },
  INVALID_FOLLOWING_JSON: {
    message: {
      th: 'ไม่สามารถอ่านไฟล์ JSON ของรายชื่อที่กำลังติดตามได้',
      en: 'The following JSON couldn’t be read.',
    },
    hint: getNewExport,
  },
  UNEXPECTED_FOLLOWERS_SCHEMA: {
    message: {
      th: 'รูปแบบข้อมูลในไฟล์ผู้ติดตามไม่ตรงกับโครงสร้างของ Instagram',
      en: 'The followers file has an unrecognized structure.',
    },
    hint: selectJson,
  },
  UNEXPECTED_FOLLOWING_SCHEMA: {
    message: {
      th: 'รูปแบบข้อมูลในไฟล์กำลังติดตามไม่ตรงกับโครงสร้างของ Instagram',
      en: 'The following file has an unrecognized structure.',
    },
    hint: selectJson,
  },
  EMPTY_FILE: {
    message: { th: 'ไฟล์ที่เลือกมีขนาด 0 ไบต์', en: 'The selected file is empty.' },
    hint: getNewExport,
  },
  NOT_A_ZIP: {
    message: {
      th: 'ไฟล์ที่เลือกไม่ใช่ไฟล์ .zip ที่ถูกต้อง',
      en: 'The selected file isn’t a valid ZIP.',
    },
    hint: selectOriginal,
  },
  TOO_MANY_ENTRIES: {
    message: {
      th: 'ไฟล์ ZIP มีจำนวนไฟล์ย่อยมากเกินขอบเขตความปลอดภัย',
      en: 'The ZIP contains too many files to process safely.',
    },
    hint: selectFollowersAndFollowing,
  },
  UNSAFE_PATH: {
    message: {
      th: 'ตรวจพบโครงสร้างเส้นทางไฟล์ไม่ปลอดภัยภายใน ZIP',
      en: 'The ZIP contains an unsafe file path.',
    },
    hint: selectOriginal,
  },
  DECOMPRESSED_TOO_LARGE: {
    message: {
      th: 'ขนาดข้อมูลหลังแตกเกิน 50 MB',
      en: 'The unpacked account lists are larger than 50 MB.',
    },
    hint: selectFollowersAndFollowing,
  },
  CORRUPT_ZIP: {
    message: {
      th: 'ไฟล์ ZIP เสียหายหรือถูกเข้ารหัสด้วยรหัสผ่าน',
      en: 'The ZIP is damaged or password-protected.',
    },
    hint: getNewExport,
  },
  MISSING_BOTH_SECTIONS: {
    message: {
      th: 'ไม่พบไฟล์รายชื่อผู้ติดตามและกำลังติดตามใน ZIP นี้',
      en: 'This ZIP is missing both the followers and following lists.',
    },
    hint: selectFollowersAndFollowing,
  },
  MISSING_FOLLOWERS: {
    message: {
      th: 'พบเฉพาะไฟล์กำลังติดตาม แต่ไม่พบไฟล์รายชื่อผู้ติดตาม (followers_1.json)',
      en: 'The ZIP contains your following list but is missing the followers list.',
    },
    hint: {
      th: 'ตรวจสอบว่าไฟล์ส่งออกครบถ้วน และได้เลือกช่วงวันที่เป็น “ตลอดเวลา (All time)”',
      en: 'Check that your download is complete and that Date range was set to All time.',
    },
  },
  MISSING_FOLLOWING: {
    message: {
      th: 'พบเฉพาะไฟล์ผู้ติดตาม แต่ไม่พบไฟล์รายชื่อที่กำลังติดตาม (following.json)',
      en: 'The ZIP contains your followers list but is missing the following list.',
    },
    hint: selectFollowersAndFollowing,
  },
};

export const uploadProgress: Record<ParseStage | 'preparing', Bilingual> = {
  preparing: {
    th: 'กำลังเตรียมอ่านไฟล์ ZIP บนเบราว์เซอร์ของคุณ…',
    en: 'Preparing to read the ZIP in your browser…',
  },
  validating: {
    th: 'กำลังตรวจสอบขนาดและความปลอดภัยของไฟล์ ZIP…',
    en: 'Checking the ZIP size and structure…',
  },
  unpacking: {
    th: 'กำลังค้นหาและแตกเฉพาะไฟล์ผู้ติดตามภายใน ZIP…',
    en: 'Unpacking the account lists from the ZIP…',
  },
  parsing: {
    th: 'กำลังอ่านรายชื่อผู้ติดตามและกำลังติดตาม…',
    en: 'Reading the followers and following lists…',
  },
  comparing: {
    th: 'กำลังคำนวณเปรียบเทียบความสัมพันธ์ผู้ติดตาม…',
    en: 'Comparing the account lists…',
  },
  complete: { th: 'วิเคราะห์เสร็จสมบูรณ์', en: 'Analysis complete' },
};
