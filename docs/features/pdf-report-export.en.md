# A4 PDF Report Export

[ภาษาไทย](pdf-report-export.md) · **English**

## Overview

Generates an A4 follower relationship PDF report directly inside the browser and downloads it straight to the user's device—no external OAuth or cloud APIs required (on iOS and Android, users can save directly to Files or Google Drive through the native OS share/save sheet).

## Key Capabilities

- **Client-Side A4 PDF Generation (`pdfmake`):**
  - Embeds `TH Sarabun New` fonts from `public/fonts/` so both Thai and English text remain selectable and searchable inside the exported PDF.
  - Subpath-safe font loading for both root deployments (Cloudflare Pages) and subpath previews (GitHub Pages).
  - Quick presets (`Recommended`, `Doesn't follow back`, `All categories`) with live page and account count estimates.
  - Responsive A4 preview that fits mobile and desktop viewports, supports continuous multi-page scrolling, and zooms from `60%–180%`.
  - Donut chart legend displays counts and percentages for all three relationship segments in both the preview and exported PDF.
  - High-contrast summary cards and color-coded tables per category.
  - Supports both **Thai and English** reports for real user exports and sample data (synced with the UI language and selectable directly in the PDF controls panel).

## Related Source Files

- [`src/lib/pdfGenerator.ts`](../../src/lib/pdfGenerator.ts) — `pdfmake` document definition, vector SVG donut chart, and `TH Sarabun New` font loader
- [`src/screens/PdfReportScreen.tsx`](../../src/screens/PdfReportScreen.tsx) — Report configuration, language selector, A4 preview, and direct download button
- [`src/screens/pdf-report.css`](../../src/screens/pdf-report.css) — A4 preview font styling (lazy-loaded with `PdfReportScreen`)
- [`public/fonts/`](../../public/fonts/) — `THSarabunNew-*.ttf` font files
