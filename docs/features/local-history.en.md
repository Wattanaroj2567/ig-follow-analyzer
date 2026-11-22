# Local History (IndexedDB)

[ภาษาไทย](local-history.md) · **English**

## Overview

Stores analysis history locally inside the user's browser (`IndexedDB`) to track follower changes across exports, following a strict privacy-first opt-in design (Model B).

Expanded history cards show how many of the accounts you follow also follow you back, with both counts and the percentage to one decimal place.

The landing page explains how to turn on history and account list storage, analyze one ZIP per run, and return with a newer ZIP for the same account in the same browser. You can choose an earlier export from the latest results.

The landing page tip suggests noting the follower count on your Instagram profile when saving the first ZIP. If the count looks lower later or you don’t remember the earlier count, compare a fresh ZIP with the saved one to see which accounts are missing. Request a fresh ZIP the next day or later because same-day exports may contain the same list.

The results page shows **New followers** and **Missing from the list** cards. Select a card to open its account list, then expand an account to see whether it appeared in each export. The timeline includes a follow date when the file provides one and shows when membership changed between exports. Each account has an **Open Instagram profile** link beside or below the timeline. The landing page links to a comparison with fictitious sample data.

The comparison shows each ZIP’s export date and filename, and shows analysis times if the dates match. The app automatically compares the latest export with the preceding export for the same account that has saved lists. If several earlier exports are available, choose **Change previous export** to update the counts and timelines, or **Reset to previous export** to restore the automatic pairing. Exports from the same day are ordered by analysis time.

The comparison labels the **ZIP you’re viewing** and the **Comparison ZIP** above the new and missing follower counts.

If the open ZIP has at least 30% fewer followers and the drop is at least 10 accounts, the results show a warning above the comparison totals. The drop may reflect an incomplete list or a real change. Request a new ZIP with **All time** as the date range before drawing conclusions about unfollows.

The results also warn when at least 30% of the older list is missing and at least 30% of the open list is new, with at least 10 accounts on each side. The warning works even if the total count stayed the same.

With account-list storage enabled, the app keeps a SHA-256 fingerprint with the saved result. The same ZIP name and bytes reuse the original history entry. Exports with the same fingerprint are skipped when selecting a comparison. Saved results from before fingerprints were added still reopen normally.

To create a comparison PDF, open the latest saved result for the account, select an earlier ZIP in the results, then open the PDF report.

On the landing page, select **Try comparing two sample ZIPs** to explore the dashboard and choose earlier sample exports. The sample comparison uses built-in fictitious data.

## Key Capabilities

- **OFF by Default:** Analysis history is saved only after opt-in, and the History page explains why it starts off (explicit consent first, safer on shared devices, and two-tier control with 1-click removal).
- **2-Tier Explicit Opt-In:**
  - **Tier 1 (`tier1SummaryOptIn`):** Saves summary counts, ZIP metadata, and PDF export history.
  - **Tier 2 (`tier2HandlesOptIn`):** Saves account lists with each history entry for reopening results and comparing exports. Counts-only entries remain available in history.
- **Per-Account Isolation:** Identifies the owner from the original Instagram ZIP filename. Comparing real exports requires a matching owner, and sample mode uses its own fictitious data.
- **Revoking consent:** Turning off account list storage removes saved lists and keeps summaries. Turning off summary storage also disables list storage. **Clear all history** deletes the summaries and lists and turns both settings off. Changes apply to every open tab of the updated app.
  A result reopened from history becomes unavailable if its saved account list is removed. A ZIP analyzed in the current tab remains available until the tab closes or reloads.
- **Full Control & Pagination:** Paginates saved history cards (5 items per page) to keep long histories compact, with per-record deletion and 1-click full clear behind confirmation dialogs.

## Related Source Files

- [`src/lib/historyStore.ts`](../../src/lib/historyStore.ts) — `IndexedDB` persistence (`ig-follow-analyzer-local-db`) via `idb` (`preferences`, `records`)
- [`src/screens/HistoryScreen.tsx`](../../src/screens/HistoryScreen.tsx) — 2-tier opt-in controls, paginated history list, account filter, and full clear UI
- [`src/screens/DemoHistoryScreen.tsx`](../../src/screens/DemoHistoryScreen.tsx) — Sample history and links to earlier sample analyses
- [`src/screens/LocalHistoryPreview.tsx`](../../src/screens/LocalHistoryPreview.tsx) — Landing page example of the local history workflow
- [`src/lib/igParser.ts`](../../src/lib/igParser.ts) — `computeHistoryDiff` for comparing snapshots
