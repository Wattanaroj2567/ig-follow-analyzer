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
  - Select **How percentages are calculated** below the chart to see how the three relationship counts add up to the chart denominator. Each account belongs to just one category.
- **Account Table:**
  - Instant search by `@username`
  - Filter across all 5 relationship categories. When a comparison is available, open **New followers** or **Missing from the list** and expand any account to see its export timeline.
  - The **New followers** and **Missing from the follower list** cards show the count and explain which ZIP contains those names. An example below the cards shows how the app classifies a name found only in the ZIP used for comparison.
  - The comparison shows the date and filename for the **ZIP you’re viewing** and the **Comparison ZIP**. On the **Comparison ZIP** side, use **Change previous export** to choose an earlier ZIP with saved lists for the same account or reset to the automatically selected export.
  - Sort by newest follow date or alphabetically (`A–Z` / `Z–A`) using a theme-matched menu, with 25-row pagination; desktop table columns keep fixed widths between pages
  - Sanitized external links to open each profile directly on Instagram
  - Two-sided follow dates for mutual follows (JSON exports) and a clear notice when timestamps are absent (HTML exports)
- **Sample Data Mode (Demo):** The landing preview starts with the five relationship categories from one ZIP. **Compare two ZIPs** shows both export dates and lets visitors switch between new followers and accounts missing from the latest list. Select **Try comparing two sample ZIPs** in **See who recently unfollowed you** to open the full dashboard, choose an earlier ZIP, and expand account timelines.
- **Next step for comparing exports:** The results page points to local history setup while account list storage is off. Once a list is saved, **Upload a ZIP to compare** takes you to the upload page to choose a newer export from the same account.
- **ZIP date range:** Follow dates can flag a potentially incomplete list. They cannot identify the range selected in Instagram. Before using a comparison, check that both ZIPs used **All time**.

## Related Source Files

- [`src/screens/ResultsScreen.tsx`](../../src/screens/ResultsScreen.tsx) — Dashboard summary card, account table, search, sorting, and pagination
- [`src/components/RelationshipOverview.tsx`](../../src/components/RelationshipOverview.tsx) — Metric cards and interactive donut chart
- [`src/data/relationshipMetrics.ts`](../../src/data/relationshipMetrics.ts) — Category order, colors, and metadata
- [`src/data/demoAnalysis.ts`](../../src/data/demoAnalysis.ts) — Fictitious sample dataset computed via the set engine
- [`src/screens/LandingScreen.tsx`](../../src/screens/LandingScreen.tsx), [`src/screens/LandingPreview.tsx`](../../src/screens/LandingPreview.tsx), [`src/screens/LocalHistoryPreview.tsx`](../../src/screens/LocalHistoryPreview.tsx) — Landing dashboard preview and local history example
