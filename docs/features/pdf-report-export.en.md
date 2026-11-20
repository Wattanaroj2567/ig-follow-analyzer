# A4 PDF Report Export

[ภาษาไทย](pdf-report-export.md) · **English**

## Overview

Generates an A4 follower relationship PDF report directly inside the browser and downloads it straight to the user's device—no external OAuth or cloud APIs required (on iOS and Android, users can save directly to Files or Google Drive through the native OS share/save sheet).

## Key Capabilities

- **Client-Side A4 PDF Generation (`pdfmake`):**
  - Embeds `Plus Jakarta Sans` and `IBM Plex Sans Thai` from `public/fonts/` so Thai and English text remain selectable inside the exported PDF.
  - Preview and export share the site's background, text, chart, and table colors in Dark, Light, and System themes. A downloaded PDF keeps the theme shown when the download starts.
  - Subpath-safe font loading for both root deployments (Cloudflare Pages) and subpath previews (GitHub Pages).
  - Quick presets (`Recommended`, `Doesn't follow back`, `All categories`) with live page and account count estimates.
  - When a comparison is available, the report uses the pair selected on the dashboard. From the latest result, use **Change previous export** on the PDF screen to update the preview and download. The optional comparison summary shows the earlier ZIP and the new, missing, and net follower counts.
  - In history, select **Compare with latest in PDF** on an earlier entry to preview that export alongside the latest ZIP for the same account. Check both filenames before downloading.
  - Responsive A4 preview that fits mobile and desktop viewports, supports continuous multi-page scrolling, and zooms from `60%–180%`.
  - Donut chart legend displays counts and percentages for all three relationship segments in both the preview and exported PDF.
  - High-contrast summary cards and color-coded tables per category.
  - Supports both **Thai and English** reports for real user exports and sample data (synced with the UI language and selectable directly in the PDF controls panel).

## Related Source Files

- [`src/lib/pdfGenerator.ts`](../../src/lib/pdfGenerator.ts) — `pdfmake` document definition, vector SVG donut chart, and website font loader
- [`src/screens/PdfReportScreen.tsx`](../../src/screens/PdfReportScreen.tsx) — Report configuration, language selector, A4 preview, and direct download button
- [`src/screens/pdf-report.css`](../../src/screens/pdf-report.css) — A4 preview font styling (lazy-loaded with `PdfReportScreen`)
- [`public/fonts/`](../../public/fonts/) — Report font files and their SIL Open Font License notices
