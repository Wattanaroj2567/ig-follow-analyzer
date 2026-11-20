# Local History (IndexedDB)

[ภาษาไทย](local-history.md) · **English**

## Overview

Stores analysis history locally inside the user's browser (`IndexedDB`) to track follower changes across exports, following a strict privacy-first opt-in design (Model B).

The Landing page also includes a compact single-frame example showing how turning on local history, uploading an initial ZIP, and returning with a newer ZIP highlights recent unfollowers.

The results page shows **New followers** and **Missing from the list** cards. Select a card to open its account list, then expand an account to see whether it appeared in each export. The timeline includes a follow date when the file provides one and shows when membership changed between exports. The landing page links to a comparison with fictitious sample data.

## Key Capabilities

- **OFF by Default:** Nothing is persisted until the user explicitly opts in.
- **2-Tier Explicit Opt-In:**
  - **Tier 1 (`tier1SummaryOptIn`):** Saves summary counts, ZIP metadata, and PDF export history.
  - **Tier 2 (`tier2HandlesOptIn`):** Saves follower lists locally in the browser to reopen past lists and compute diffs (recent unfollowers / new followers) on the next upload.
- **Per-Account Isolation:** Groups history by the owner handle extracted from the ZIP filename (`account:<handle>`) so multiple accounts never mix, and excludes sample demo data.
- **Full Control & Pagination:** Paginates saved history cards (5 items per page) to keep long histories compact, with per-record deletion and 1-click full clear behind confirmation dialogs.

## Related Source Files

- [`src/lib/historyStore.ts`](../../src/lib/historyStore.ts) — `IndexedDB` persistence (`ig-follow-analyzer-local-db`) via `idb` (`preferences`, `records`, `snapshots`)
- [`src/screens/HistoryScreen.tsx`](../../src/screens/HistoryScreen.tsx) — 2-tier opt-in controls, paginated history list, account filter, and full clear UI
- [`src/screens/LocalHistoryPreview.tsx`](../../src/screens/LocalHistoryPreview.tsx) — Landing page example of the local history workflow
- [`src/lib/igParser.ts`](../../src/lib/igParser.ts) — `computeHistoryDiff` for comparing snapshots
