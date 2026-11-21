# ZIP Parser & Set Engine

[ภาษาไทย](zip-parser-and-set-engine.md) · **English**

## Overview

This feature parses the `.zip` archive exported from Instagram Accounts Center 100% locally inside a browser Web Worker, keeping the UI responsive without uploading any follower data to a server.

The page checks that the selection contains exactly one nonempty ZIP within the size limit before reading it. A cancellable file reader hands the buffer to the worker. The worker checks the archive, unpacks the relevant files, validates both lists, then calculates the relationships. Each run ends with one result or one error. Cancelling or leaving the page stops both the read and the worker.

## Key Capabilities

- **Web Worker Processing (`fflate`):** Extracts only target files (`followers_*.json`, `following.json`, or equivalent `.html` files) while skipping photos, videos, and all unrelated entries at the ZIP header level.
- **JSON & HTML Support:**
  - **JSON (Recommended):** Supports both legacy (`string_list_data[].value`) and newer Meta (`title` / `/_u/<handle>`) schemas with follow timestamps.
  - **HTML (Fallback):** Extracts handles safely via regex without injecting HTML into the DOM (follow timestamps are unavailable in HTML exports).
- **Archive Safety Guardrails:**
  - Maximum compressed ZIP size: `200 MB`
  - Maximum declared uncompressed size across target files: `50 MB`
  - Maximum scanned archive entries: `25,000`
  - Path traversal protection (`..`, absolute paths)
- **Integrity coverage:** Checks archive headers, declared sizes, and decoded list content. Full integrity verification would also require checking each entry’s CRC-32.
- **List validation:** Allows empty lists. Rejects unreadable JSON rows, incomplete HTML documents, and duplicate or missing parts within a numbered sequence. A missing final part cannot be detected from numbering alone if the export contains no manifest. Repeated accounts keep the latest valid timestamp.
- **Set Engine & Two-Sided Follow Dates:**
  - Computes all 5 relationship categories directly via set math: `Followers`, `Following`, `Mutual`, `Not Following Back`, and `Not Followed Back`.
  - Tracks both sides of follow timestamps (`followedUsAt` and `followedByUsAt`) for mutual follows.
- **Owner Account Extraction:** Extracts the owner's `@username` from official Instagram export filenames (e.g., `instagram-<handle>-YYYY-MM-DD-...zip`) to isolate local history per account.
  The date after the account name takes precedence. An impossible date in the original filename leaves its owner unidentified and uses the analysis date for display.

## Related Source Files

- [`src/workers/zipParser.worker.ts`](../../src/workers/zipParser.worker.ts) — Web Worker receiving `ArrayBuffer` and reporting stages (`validating` → `unpacking` → `parsing` → `comparing`)
- [`src/lib/igParser.ts`](../../src/lib/igParser.ts) — Archive filter, JSON/HTML parsers, set math, and `computeHistoryDiff`
- [`src/lib/useZipAnalysis.ts`](../../src/lib/useZipAnalysis.ts) — Selection checks, file reader, worker lifecycle, and cancellation.
- [`src/lib/uploadFeedback.ts`](../../src/lib/uploadFeedback.ts) — Bilingual upload progress and error messages
- [`src/screens/UploadScreen.tsx`](../../src/screens/UploadScreen.tsx) — Drag-and-drop / file picker UI and progress indicator
- [`src/lib/igParser.test.ts`](../../src/lib/igParser.test.ts) — Unit tests for parsing and set invariants
