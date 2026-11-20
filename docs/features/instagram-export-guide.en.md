# Instagram Export Guide

[ภาษาไทย](instagram-export-guide.md) · **English**

## Overview

An interactive in-app guide that walks users through requesting their official follower `.zip` export from Instagram Accounts Center—highlighting the three key settings: `Followers and following` only, `All time` date range, and `JSON` format.

## Key Capabilities

- **Device-Specific Walkthroughs:**
  - **Mobile (Instagram App):** 16 illustrated steps from Profile → Accounts Center → select `Followers and following` → configure date range & format → download the `.zip` file.
  - **Desktop (Web):** 11 illustrated steps for browser users, including how to choose or find the download folder and select the original ZIP without extracting it.
- **Bilingual Device Mockups:** Dynamically switches mockup labels between Thai and English, highlights exact buttons to tap, uses fictitious handles (`@somchai.demo`), and omits Instagram/Meta trademarks.
- **Downloaded File Finder:** Includes a collapsible guide on the Upload screen explaining where to locate the downloaded `.zip` archive on iOS, Android, and desktop.

## Related Source Files

- [`src/screens/HowItWorksScreen.tsx`](../../src/screens/HowItWorksScreen.tsx) — Guide page and mobile/desktop switcher
- [`src/components/GuideIllustration.tsx`](../../src/components/GuideIllustration.tsx) — Localized mobile and desktop UI mockups
- [`src/components/UploadFileGuide.tsx`](../../src/components/UploadFileGuide.tsx) — File-location helper on the Upload screen
