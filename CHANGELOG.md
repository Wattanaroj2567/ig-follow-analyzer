# Changelog

Notable changes to IG Follow Analyzer are documented here.

## [Unreleased]

### Added

- Added follower comparison cards and expandable per-account timelines, with a bilingual sample users can try before uploading an export.

- Full client-side web application (`Vite + React + TypeScript` + `Tailwind CSS v4`) across 8 pages (`Landing`, `HowItWorks`, `Upload`, `Results`, `PdfReport`, `History`, `TermsAndFaq`, `About`) with crisp 2D `lucide-react` icons, `Plus Jakarta Sans` + `IBM Plex Sans Thai` typography, and `© 2026 IG Follow Analyzer` footer notice.
- Web Worker ZIP parser (`fflate`) supporting multi-part `followers_*.json`, Meta 2025–2026 `following.json` (`title` / `/_u/` fallback), safe HTML fallback, two-sided follow date tracking (`followedUsAt` & `followedByUsAt`), owner `@username` extraction from official Instagram ZIP filenames, partial `"Last year"` export detection, and Zip Bomb / Path Traversal guards.
- Interactive step-by-step Instagram Accounts Center export guide covering 16 Mobile steps and 11 Desktop steps with bulleted multi-step instructions, highlighted menu/action labels, localized device mockups, an upload-page file finder guide, and a non-intrusive multi-browser Add to Home Screen / desktop pin guide (`AddToHomeGuide.tsx` + `manifest.webmanifest`).
- Set-math Dashboard and searchable, filterable, sortable, 25-row paginated Account List, plus a dedicated interactive sample results mode accessible from the landing preview.
- Client-side A4 PDF report generator (`pdfmake` + `TH Sarabun New` fonts in `public/fonts/`) with report presets, vector SVG relationship chart, scrollable multi-page zoom preview, and direct device download.
- Browser-local History Model B (`IndexedDB` via `idb`) with explicit 2-tier opt-in consent (OFF by default), per-account snapshot isolation, unfollower diff tracking, expandable history cards, and confirmation dialogs before deleting records or clearing all history.
- Bilingual Thai/English interface (`localStorage` persistence without losing active analysis results), System (default), Dark, and Light themes across all pages, and a themed in-app Feedback & Issue form (`FeedbackForm.tsx`) submitting directly to Google Forms.
- Automated GitHub Actions CI workflow (`.github/workflows/ci.yml`) running `deadcode`, `lint`, `format:check`, `typecheck`, `test`, and `build` for Cloudflare Pages production deployments, with subpath-safe asset and PDF font loading.
- Code quality and test suite (`Vitest`, Testing Library, `ESLint`, `Prettier`, TypeScript strict checks, and `knip` dead-code analysis via `npm run deadcode`) plus feature-level documentation under `docs/features/`.

### Changed

- Reworked the About page in Thai and English to explain why the project exists, why it uses Instagram exports, and how users choose what to keep in local history.
- Rewrote Terms, Privacy, and FAQ in Thai and English with clearer explanations of local history and feedback, fewer icons, and direct links to the export guide and History.
- Replaced the landing page's timed local-history demo with a single mobile-friendly view of setup, the next ZIP upload, and an example unfollower result, with unframed icons.
- Restyled the landing headline underline as a solid amber pen stroke that glides back and forth.
- Improved readability in the A4 report and preview with higher-contrast metrics and color-coded tables. The donut chart shows counts and percentages for each group. Removed the font name and contents box.
- Simplified the dashboard chart by showing a count in the center only when a relationship group is highlighted.
- Simplified navigation and export flows by keeping desktop navigation width stable across routes, moving mobile theme and language controls into the accessible `<1024px` navigation drawer, focusing export exclusively on direct A4 PDF downloads (removing the redundant web Google Drive OAuth stub and `.env.example`), and removing unused kit assets (`public/assets/`) and legacy mock fixtures.
- Lazy-loaded the PDF report screen, split React into a dedicated chunk, and switched Landing hero animations from infinite loops to one-shot entrances to eliminate idle CPU usage.

### Fixed

- Show a single, slimmer scrollbar in the full-screen PDF preview and lock background scrolling while it is open.
- Matched the A4 preview font to the exported PDF by using TH Sarabun New, with slightly larger preview text for readability.
- Open the full-screen PDF preview at a scale that fits the available width on mobile, with horizontal scrolling when zoomed in.
- Styled the active History opt-in toggle switches in blue (`bg-ig-blue`) with a contrasting white thumb (`bg-ig-blue-ink`) and color-coded the History status banner by action (green when enabled, amber when disabled, red when cleared).
- Isolated demo mode (`isDemoData`) from real local history and diff snapshots, and prevented duplicate history records when toggling Tier-2 handle storage.
- Pinned relationship chart center counts when clicking or tapping a segment, with hover feedback and a clear state when the selection is toggled off.
