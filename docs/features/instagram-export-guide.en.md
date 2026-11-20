# Instagram Export Guide

[ภาษาไทย](instagram-export-guide.md) · **English**

## Overview

An interactive in-app guide that walks users through requesting their official follower `.zip` export from Instagram Accounts Center—highlighting the three key settings: `Followers and following` only, `All time` date range, and `JSON` format.

## Key Capabilities

- **Device-Specific Walkthroughs:**
  - **Mobile (Instagram App):** 19 illustrated steps. Choose **JSON**, tap **Save** to return to the confirmation screen, then tap **Start export**. Once the ZIP is ready, tap Download next to it and confirm your password in Accounts Center. On iPhone, tap **Save…** in the download bar and wait for **Download complete** before tapping **Open in…** to save the ZIP to Files.
    On Android, the browser opens and downloads the ZIP automatically. Skip the iPhone-only steps 17–18 and go to step 19 to find and select the ZIP.
  - **Desktop (Web):** 15 illustrated steps. Save the JSON format before starting the export. When the ZIP is ready, click Download next to the file and confirm your password in Accounts Center. Find the downloaded ZIP and select it without extracting it.
  - **Date range in Thai:** The mobile app labels **All time** as **ตั้งแต่ต้น**. The desktop site labels it **ตลอดเวลา**.
- **Bilingual Device Mockups:** Dynamically switches mockup labels between Thai and English, highlights exact buttons to tap, uses fictitious handles (`@somchai.demo`), and omits Instagram/Meta trademarks.
- **Checking an export request:** The guide links to the steps for opening **Export your information → Current activity** and downloading the file once ready, even without an email notification.
- **Why use a ZIP:** The home page links to a separate comparison of Instagram Login and ZIP analysis, with a shortcut to the export guide.
- **Downloaded File Finder:** Includes a collapsible guide on the Upload screen explaining where to locate the downloaded `.zip` archive on iOS, Android, and desktop.

## Related Source Files

- [`src/screens/HowItWorksScreen.tsx`](../../src/screens/HowItWorksScreen.tsx) — Guide page and mobile/desktop switcher
- [`src/screens/ExportComparisonScreen.tsx`](../../src/screens/ExportComparisonScreen.tsx) — Instagram Login and ZIP comparison page
- [`src/components/GuideIllustration.tsx`](../../src/components/GuideIllustration.tsx) — Localized mobile and desktop UI mockups
- [`src/components/UploadFileGuide.tsx`](../../src/components/UploadFileGuide.tsx) — File-location helper on the Upload screen
