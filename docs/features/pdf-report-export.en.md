# A4 PDF Report Export

[ภาษาไทย](pdf-report-export.md) · **English**

## Overview

Generates an A4 follower relationship PDF report directly inside the browser and downloads it straight to the user's device—no external OAuth or cloud APIs required (on iOS and Android, users can save directly to Files or Google Drive through the native OS share/save sheet).

## Key Capabilities

- **Client-Side A4 PDF Generation (`pdfmake`):**
  - Embeds `Plus Jakarta Sans` and `IBM Plex Sans Thai` from `public/fonts/` so Thai and English text remain selectable inside the exported PDF.
  - Preview and export share the site's background, text, chart, and table colors in Dark, Light, and System themes. A downloaded PDF keeps the theme shown when the download starts.
  - Subpath-safe font loading for both root deployments (Cloudflare Pages) and subpath previews (GitHub Pages).
  - Quick presets (`Recommended`, `Doesn't follow back`, `All categories`) with a page count that updates as you select sections.
  - The preview opens immediately and prepares the files needed for export in the background. The download button shows progress if creating the PDF takes a moment.
  - Choose **Results** in the desktop breadcrumb or **Back to results** on mobile to return to the analysis with the selected ZIP pair.
  - Choose the earlier ZIP in the latest results before opening the PDF report. The preview and download use that pair. The optional comparison summary shows the earlier ZIP and the counts of new followers and accounts missing from the follower list.
    Real comparisons remind readers to check that both ZIPs used **All time**, with a stronger caution when the lists change unusually. This appears in both the preview and downloaded PDF.
  - Responsive A4 preview that fits mobile and desktop viewports, supports continuous multi-page scrolling and `60%–180%` zoom, and windows rendered fullscreen pages around the active page for smooth mobile scrolling and pinch-zoom.
  - Donut chart legend displays counts and percentages for all three relationship segments in both the preview and exported PDF.
  - The follow-back row shows how many of the accounts you follow also follow you back, with both counts and the percentage.
  - Select **How percentages are calculated** above the preview to see the formulas for the current results. The chart denominator is the sum of the three relationship counts. The follow-back rate divides by the number of accounts you follow.
  - High-contrast summary cards and color-coded tables per category.
  - Account tables in the preview and export have outer borders and column dividers. Underlined profile URLs open the corresponding Instagram profile in both the preview and the downloaded PDF.
  - Supports both **Thai and English** reports for real user exports and sample data (synced with the UI language and selectable directly in the PDF controls panel).

## Related Source Files

- [`src/lib/pdfGenerator.ts`](../../src/lib/pdfGenerator.ts) — `pdfmake` document definition, vector SVG donut chart, and website font loader
- [`src/screens/PdfReportScreen.tsx`](../../src/screens/PdfReportScreen.tsx) — Report configuration, language selector, A4 preview, and direct download button
- [`src/screens/pdf-report.css`](../../src/screens/pdf-report.css) — A4 preview font styling
- [`public/fonts/`](../../public/fonts/) — Report font files and their SIL Open Font License notices
