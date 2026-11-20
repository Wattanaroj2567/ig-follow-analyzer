# Instagram Export Guide

[ภาษาไทย](instagram-export-guide.md) · **English**

## Overview

An interactive in-app guide that walks users through requesting their official follower `.zip` export from Instagram Accounts Center—highlighting the three key settings: `Followers and following` only, `All time` date range, and `JSON` format.

## Key Capabilities

- **Device-Specific Walkthroughs:**
  - **Mobile (Instagram App):** 17 illustrated steps covering data selection, date range, format, status checks, downloading, and choosing the saved `.zip` file.
  - **Desktop (Web):** 11 illustrated steps for browser users, including how to choose or find the download folder and select the original ZIP without extracting it.
- **Bilingual Device Mockups:** Dynamically switches mockup labels between Thai and English, highlights exact buttons to tap, uses fictitious handles (`@somchai.demo`), and omits Instagram/Meta trademarks.
- **Checking an export request:** The guide links to the steps for opening **Export your information → Current activity** and downloading the file once ready, even without an email notification.
- **Why use a ZIP:** The home page links to a separate comparison of Instagram Login and ZIP analysis, with a shortcut to the export guide.
- **Downloaded File Finder:** Includes a collapsible guide on the Upload screen explaining where to locate the downloaded `.zip` archive on iOS, Android, and desktop.

## Related Source Files

- [`src/screens/HowItWorksScreen.tsx`](../../src/screens/HowItWorksScreen.tsx) — Guide page and mobile/desktop switcher
- [`src/screens/ExportComparisonScreen.tsx`](../../src/screens/ExportComparisonScreen.tsx) — Instagram Login and ZIP comparison page
- [`src/components/GuideIllustration.tsx`](../../src/components/GuideIllustration.tsx) — Localized mobile and desktop UI mockups
- [`src/components/UploadFileGuide.tsx`](../../src/components/UploadFileGuide.tsx) — File-location helper on the Upload screen
