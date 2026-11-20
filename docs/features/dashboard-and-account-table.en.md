# Dashboard & Account Table

[ภาษาไทย](dashboard-and-account-table.md) · **English**

## Overview

Presents the complete follower relationship breakdown on one screen with summary cards, an interactive donut chart, a searchable/sortable/paginated account table, and an interactive sample data mode for trying the app before uploading a real archive.

## Key Capabilities

- **5 Set-Derived Summary Cards:**
  - `Followers`
  - `Following`
  - `Not Following Back`
  - `Not Followed Back`
  - `Mutual`
- **Interactive Donut Chart:** Displays category counts and percentages; hovering or tapping highlights a segment and shows its exact count in the center, and tapping again clears the selection.
- **Account Table:**
  - Instant search by `@username`
  - Filter across all 5 relationship categories. When a comparison is available, open **New followers** or **Missing from the list** and expand any account to see its export timeline.
  - The **New followers** and **Missing from the follower list** cards show the count and explain which ZIP contains those names. An example below the cards shows how the app classifies a name found only in the ZIP used for comparison.
  - The comparison lists both ZIP filenames. On the **Compared with** side, use **Change previous export** to choose an earlier ZIP with saved lists for the same account or reset to the automatically selected export.
  - Sort by newest follow date or alphabetically (`A–Z` / `Z–A`) with 25-row pagination
  - Sanitized external links to open each profile directly on Instagram
  - Two-sided follow dates for mutual follows (JSON exports) and a clear notice when timestamps are absent (HTML exports)
- **Sample Data Mode (Demo):** The landing preview starts with the five relationship categories from one ZIP. **Compare two ZIPs** shows both export dates and lets visitors switch between new followers and accounts missing from the latest list. Select **Try comparing two sample ZIPs** in **See who recently unfollowed you** to open the full dashboard, choose an earlier ZIP, and expand account timelines.
- **First real analysis:** Shows an overview of the current export and explains how to turn on history and save account lists to compare the next ZIP.

## Related Source Files

- [`src/screens/ResultsScreen.tsx`](../../src/screens/ResultsScreen.tsx) — Dashboard summary card, account table, search, sorting, and pagination
- [`src/components/RelationshipOverview.tsx`](../../src/components/RelationshipOverview.tsx) — Metric cards and interactive donut chart
- [`src/data/relationshipMetrics.ts`](../../src/data/relationshipMetrics.ts) — Category order, colors, and metadata
- [`src/data/demoAnalysis.ts`](../../src/data/demoAnalysis.ts) — Fictitious sample dataset computed via the set engine
- [`src/screens/LandingScreen.tsx`](../../src/screens/LandingScreen.tsx), [`src/screens/LandingPreview.tsx`](../../src/screens/LandingPreview.tsx), [`src/screens/LocalHistoryPreview.tsx`](../../src/screens/LocalHistoryPreview.tsx) — Landing dashboard preview and local history example
