# Changelog

Notable changes to IG Follow Analyzer are documented here.

## [Unreleased]

### Added

- Add a mobile back control in the top bar on every page except the home page. It returns to the previous page when there is in-app history and falls back to the parent page on a direct visit.
- Open a comparison PDF from an earlier entry in local or sample history, using the latest ZIP and the chosen history entry.
- Added the ZIP comparison picker and optional follower-change summary to sample PDF reports, with the selected pair shared between the dashboard and PDF screen.
- Added a creator credit on the About page with a link to the creator’s GitHub profile.
- Show both ZIP filenames in comparison results and let users compare the latest export with an earlier saved export for the same account, with a reset to the automatic comparison.
- Added reviews on the About page with a required star rating and display name, an optional comment, and opt-in publication consent.
- Added a separate sample history linked from the landing page and sample dashboard. Users can browse fictitious ZIP exports and reopen each sample result without accessing real history.
- Added follower comparison cards and expandable per-account timelines, with a bilingual sample users can try before uploading an export.

- Full client-side web application (`Vite + React + TypeScript` + `Tailwind CSS v4`) across 9 pages (`Landing`, `HowItWorks`, `ExportComparison`, `Upload`, `Results`, `PdfReport`, `History`, `TermsAndFaq`, `About`) with crisp 2D `lucide-react` icons, `Plus Jakarta Sans` + `IBM Plex Sans Thai` typography, and `© 2026 IG Follow Analyzer` footer notice.
- Web Worker ZIP parser (`fflate`) supporting multi-part `followers_*.json`, Meta 2025–2026 `following.json` (`title` / `/_u/` fallback), safe HTML fallback, two-sided follow date tracking (`followedUsAt` & `followedByUsAt`), owner `@username` extraction from official Instagram ZIP filenames, partial `"Last year"` export detection, and Zip Bomb / Path Traversal guards.
- Interactive step-by-step Instagram Accounts Center export guide covering 16 Mobile steps and 11 Desktop steps with bulleted multi-step instructions, highlighted menu/action labels, localized device mockups, an upload-page file finder guide, and a non-intrusive multi-browser Add to Home Screen / desktop pin guide (`AddToHomeGuide.tsx` + `manifest.webmanifest`).
- Set-math Dashboard and searchable, filterable, sortable, 25-row paginated Account List, plus a dedicated interactive sample results mode accessible from the landing preview.
- Client-side A4 PDF report generator (`pdfmake` + `Plus Jakarta Sans` and `IBM Plex Sans Thai` fonts in `public/fonts/`) with report presets, vector SVG relationship chart, scrollable multi-page zoom preview, and direct device download.
- Browser-local History Model B (`IndexedDB` via `idb`) with explicit 2-tier opt-in consent (OFF by default), per-account snapshot isolation, unfollower diff tracking, expandable history cards, and confirmation dialogs before deleting records or clearing all history.
- Bilingual Thai/English interface (`localStorage` persistence without losing active analysis results), System (default), Dark, and Light themes across all pages, and a themed in-app Feedback & Issue form (`FeedbackForm.tsx`) submitting directly to Google Forms.
- Automated GitHub Actions CI workflow (`.github/workflows/ci.yml`) running `deadcode`, `lint`, `format:check`, `typecheck`, `test`, and `build` for Cloudflare Pages production deployments, with subpath-safe asset and PDF font loading.
- Code quality and test suite (`Vitest`, Testing Library, `ESLint`, `Prettier`, TypeScript strict checks, and `knip` dead-code analysis via `npm run deadcode`) plus feature-level documentation under `docs/features/`.

### Changed

- Keep the ZIP requirement brief on the landing page and link to a dedicated comparison of the official Instagram Login API and ZIP analysis, then show the request, status check, and file selection steps at the top of the export guide. Highlight the export settings, how to check Instagram’s download status without email, and how to select the original ZIP from the downloads folder.
- Explain that PDF reports are optional and can be kept on the device. Show the benefit of enabling local history and account list storage near the top of real analysis results.
- Give the landing headline’s amber underline a crayon texture.
- Align the About page with the shared content gutter.
- Display the year for both ZIP dates in the sample comparison heading, including when the years match.
- Label the latest, previous, and older exports in the dashboard and PDF comparison picker, with the reset action aligned to the left below the list.
- Show a two-way arrow between the ZIP files in the dashboard and PDF comparison panels.
- Styled the previous ZIP picker’s scrollbar to match the other scrollable controls in light and dark themes.
- Consolidated the landing page’s full sample dashboard link in the example timeline section.
- Clarified that the landing-page history workflow uses one ZIP per analysis and suggested requesting the next export on a later day.
- Simplified the footer to link to Terms and Privacy and About.
- Rewrote the landing-page use cases around single-ZIP analysis, follower changes, local processing, and customizable PDF reports.
- Put each comparison explanation below its own card, with the note about timing and cause under missing followers.
- Aligned the previous ZIP picker to the right of the compared-file details and kept the reset action as text below the list.
- Moved System to the first position in the theme switcher on desktop and mobile.
- Clarified the final desktop export step so users can find where the browser saved their ZIP and select the original archive for analysis.
- Selecting the same review star again clears the rating and preserves the review draft.
- Matched the A4 preview and downloadable PDF to the website’s active theme, relationship colors, and Plus Jakarta Sans and IBM Plex Sans Thai fonts.
- The landing dashboard preview starts with a single ZIP and switches to a two-export comparison with browsable new and missing followers.
- Added a built-in review form that follows the site theme and saves to Google Forms from the About page when an Apps Script receiver is configured.
- Added ratings and screened, consented comments above the homepage footer, browser-based repeat submission protection, Google Forms edit links, and owner visibility controls in a private sheet.
- Updated the landing page, History settings, About page, and FAQ to explain automatic comparison and how to choose an earlier ZIP.
- Styled the landing page’s step-by-step guide link as a bordered secondary button with a right arrow.
- Restyled the About page’s Terms and Privacy link as underlined text.
- Replaced the boxed back button in sample history with a text link and a left arrow.
- Shortened the export guide button in the landing page hero.
- Clarified that the sample dashboard compares two exports, displayed the dates in its header, and shortened the history prompt after a first real analysis.
- Limited feedback details to 500 characters and added a counter and a visible scrollbar when longer messages overflow the field.
- Styled the desktop page scrollbar as a floating thumb with the track inset below the navigation bar in supported browsers.
- Matched the dashboard sort selector to the search field and shortened the sort labels in Thai and English.
- Reworked the About page in Thai and English to explain why the project exists, why it uses Instagram exports, and how users choose what to keep in local history.
- Rewrote Terms, Privacy, and FAQ in Thai and English with clearer explanations of local history and feedback, fewer icons, and direct links to the export guide and History.
- Replaced the landing page's timed local-history demo with a single mobile-friendly view of setup, the next ZIP upload, and an example unfollower result, with large, unframed arrows centered between the steps.
- Restyled the landing headline underline as a solid amber pen stroke that glides back and forth.
- Improved readability in the A4 report and preview with higher-contrast metrics and color-coded tables. The donut chart shows counts and percentages for each group. Removed the font name and contents box.
- Simplified the dashboard chart by showing a count in the center only when a relationship group is highlighted.
- Simplified navigation and export flows by keeping desktop navigation width stable across routes, moving mobile theme and language controls into the accessible `<1024px` navigation drawer, focusing export exclusively on direct A4 PDF downloads (removing the redundant web Google Drive OAuth stub and `.env.example`), and removing unused kit assets (`public/assets/`) and legacy mock fixtures.
- Lazy-loaded the PDF report screen, split React into a dedicated chunk, and switched Landing hero animations from infinite loops to one-shot entrances to eliminate idle CPU usage.

### Fixed

- Aligned the review form's field borders with the feedback form, including on focus.
- Distinguished the current page in light-theme top navigation with a deeper gray background and an amber underline. Hovered links use a lighter gray.
- Show a single, slimmer scrollbar in the full-screen PDF preview and lock background scrolling while it is open.
- Open the full-screen PDF preview at a scale that fits the available width on mobile, with horizontal scrolling when zoomed in.
- Styled the active History opt-in toggle switches in blue (`bg-ig-blue`) with a contrasting white thumb (`bg-ig-blue-ink`) and color-coded the History status banner by action (green when enabled, amber when disabled, red when cleared).
- Isolated demo mode (`isDemoData`) from real local history and diff snapshots, and prevented duplicate history records when toggling Tier-2 handle storage.
- Pinned relationship chart center counts when clicking or tapping a segment, with hover feedback and a clear state when the selection is toggled off.
