# ZIP Parser & Set Engine

[ภาษาไทย](zip-parser-and-set-engine.md) · **English**

## Overview

This feature parses the `.zip` archive exported from Instagram Accounts Center 100% locally inside a browser Web Worker, keeping the UI responsive without uploading any follower data to a server.

## Key Capabilities

- **Web Worker Processing (`fflate`):** Extracts only target files (`followers_*.json`, `following.json`, or equivalent `.html` files) while skipping photos, videos, and all unrelated entries at the ZIP header level.
- **JSON & HTML Support:**
  - **JSON (Recommended):** Supports both legacy (`string_list_data[].value`) and newer Meta (`title` / `/_u/<handle>`) schemas with follow timestamps.
  - **HTML (Fallback):** Extracts handles safely via regex without injecting HTML into the DOM (follow timestamps are unavailable in HTML exports).
- **Archive Safety Guardrails:**
  - Maximum compressed ZIP size: `200 MB`
  - Maximum uncompressed target file size: `50 MB`
  - Maximum scanned archive entries: `25,000`
  - Path traversal protection (`..`, absolute paths)
- **Set Engine & Two-Sided Follow Dates:**
  - Computes all 5 relationship categories directly via set math: `Followers`, `Following`, `Mutual`, `Not Following Back`, and `Not Followed Back`.
  - Tracks both sides of follow timestamps (`followedUsAt` and `followedByUsAt`) for mutual follows.
- **Owner Account Extraction:** Extracts the owner's `@username` from official Instagram export filenames (e.g., `instagram-<handle>-YYYY-MM-DD-...zip`) to isolate local history per account.

## Related Source Files

- [`src/workers/zipParser.worker.ts`](../../src/workers/zipParser.worker.ts) — Web Worker receiving `ArrayBuffer` and reporting stages (`validating` → `unpacking` → `parsing` → `comparing` → `complete`)
- [`src/lib/igParser.ts`](../../src/lib/igParser.ts) — Archive filter, JSON/HTML parsers, set math, and `computeHistoryDiff`
- [`src/lib/uploadFeedback.ts`](../../src/lib/uploadFeedback.ts) — Bilingual upload progress and error messages
- [`src/screens/UploadScreen.tsx`](../../src/screens/UploadScreen.tsx) — Drag-and-drop / file picker UI and progress indicator
- [`src/lib/igParser.test.ts`](../../src/lib/igParser.test.ts) — Unit tests for parsing and set invariants
