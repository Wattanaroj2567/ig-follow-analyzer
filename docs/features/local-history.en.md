# Local History (IndexedDB)

[ภาษาไทย](local-history.md) · **English**

## Overview

Stores analysis history locally inside the user's browser (`IndexedDB`) to track follower changes across exports, following a strict privacy-first opt-in design (Model B).

The landing page explains how to turn on history and account list storage, analyze one ZIP per run, and return with a newer ZIP for the same account in the same browser. It recommends requesting a fresh ZIP the next day or later because same-day exports may contain the same list. You can choose an earlier export from the latest results.

The results page shows **New followers** and **Missing from the list** cards. Select a card to open its account list, then expand an account to see whether it appeared in each export. The timeline includes a follow date when the file provides one and shows when membership changed between exports. The landing page links to a comparison with fictitious sample data.

Latest results show both ZIP names, export dates, and analysis times. The app automatically compares the latest export with the preceding export for the same account that has saved lists. If several earlier exports are available, choose **Change previous export** to update the counts and timelines, or **Reset to previous export** to restore the automatic pairing. Exports from the same day are ordered by analysis time.

In local history, choose **Compare with latest in PDF** on an earlier entry to preview the selected pair. The button appears when saving account lists is enabled and both that entry and the latest ZIP for the same account have saved lists.

Select **View sample history** on the landing page or sample dashboard to see the two latest sample files or browse the full list four at a time. Open each file's sample dashboard or create a comparison PDF from an earlier entry. Sample pages use built-in fictitious data and do not access real history in `IndexedDB`.

## Key Capabilities

- **OFF by Default:** Nothing is persisted until the user explicitly opts in.
- **2-Tier Explicit Opt-In:**
  - **Tier 1 (`tier1SummaryOptIn`):** Saves summary counts, ZIP metadata, and PDF export history.
  - **Tier 2 (`tier2HandlesOptIn`):** Saves account lists with each history entry for reopening results and comparing exports. Counts-only entries remain available in history.
- **Per-Account Isolation:** Identifies the owner from the original Instagram ZIP filename. Comparing real exports requires a matching owner, and sample mode uses its own fictitious data.
- **Full Control & Pagination:** Paginates saved history cards (5 items per page) to keep long histories compact, with per-record deletion and 1-click full clear behind confirmation dialogs.

## Related Source Files

- [`src/lib/historyStore.ts`](../../src/lib/historyStore.ts) — `IndexedDB` persistence (`ig-follow-analyzer-local-db`) via `idb` (`preferences`, `records`, `snapshots`)
- [`src/screens/HistoryScreen.tsx`](../../src/screens/HistoryScreen.tsx) — 2-tier opt-in controls, paginated history list, account filter, and full clear UI
- [`src/screens/DemoHistoryScreen.tsx`](../../src/screens/DemoHistoryScreen.tsx) — Sample history and links to earlier sample analyses
- [`src/screens/LocalHistoryPreview.tsx`](../../src/screens/LocalHistoryPreview.tsx) — Landing page example of the local history workflow
- [`src/lib/igParser.ts`](../../src/lib/igParser.ts) — `computeHistoryDiff` for comparing snapshots
