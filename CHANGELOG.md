# Changelog

Notable changes to IG Follow Analyzer are documented here.

## [Unreleased]

### Fixed

- Show a loading status for homepage reviews and reuse recently loaded reviews on reload while checking for updates.

- Restore homepage reviews by reading Google Forms answers by item ID in the Apps Script receiver.

## [1.0.0] - 2026-11-22

### Added

- Add context-aware breadcrumb navigation on screens `640px` and wider and a previous-page back link on narrow mobile viewports across every sub-page (`PageBreadcrumb.tsx`, `navigationTrail.ts`), preserving forward and back flows without looping.
- Explain on the History page why local history is off by default (explicit consent first, safer on shared devices, and two-tier control with 1-click removal) in Thai and English.
- Explain below the account overview cards and in the FAQs why follower and following totals in an Instagram ZIP can be higher than on the live profile (deactivated accounts and `__deleted__*` placeholders remain in the export without a status flag) or lower (limited export date range).

### Changed

- Promote IG Follow Analyzer to its first stable `1.0.0` public release.
- Use the hamburger menu drawer on all viewports narrower than `1024px` (including phone landscape and tablet portrait) with a compact side-by-side theme and language row for short landscape viewports and outside-tap dismissal.
- Make `instagram.com/...` profile URLs in the A4 PDF report preview real clickable external links that open in a new tab without triggering the fullscreen lightbox.
- Refresh `public/share.jpg` and the desktop and mobile landing and results screenshots to reflect the updated hero gradient underline, preview table grid lines, sample comparison button label, and profile count explanation.
- Add vertical column grid lines to the landing page dashboard preview table and match the hero crayon underline stroke gradient (`gold → coral → rose`) to the accented heading text.
- Clarify the Thai sample comparison button on the landing page as “ลองดูผลเทียบตัวอย่าง 2 ไฟล์” to match “Try comparing two sample ZIPs” and make it clear that it opens sample data.
- Add a down-arrow icon to the mobile “See saved entries” jump button on the History page to match the results page jump button.

### Fixed

- Remove opacity-hiding `.scroll-reveal` delays on the landing page (while keeping the stat number count-up animation) so every section renders immediately without flashing a gray box in Safari or showing blank gaps during fast scrolling on Android Chrome.
- Optimize mobile scroll rasterization on Android Chrome and iOS Safari by scoping the hero SVG `feTurbulence` crayon filter and large 24px-blur Light-theme shadows to fine-pointer desktop devices, capping mobile `.app-frame` ambient gradients to the upper hero band, switching root sizing to `100svh` to prevent URL-bar resize invalidation during fast flings, and clearing the default iOS Safari gray tap highlight on interactive controls.
- Remove the legacy `420px` mobile frame cap, side borders, and gray `body` background (`--color-rule-2`), switch to native document scrolling (`min-h-svh`) with safe-area inset padding, and guard pull-to-refresh only while viewing an active real-ZIP result or PDF so pages render edge-to-edge and flow smoothly beneath iOS Safari’s floating bottom toolbar.
- Prevent mobile Safari crashes and pinch-zoom stutter in the PDF report preview by windowing rendered fullscreen A4 sheets (`±1` around the active page), memoizing page rendering and date formatters, disabling GPU-heavy `backdrop-filter` and `background-attachment: fixed` on touch devices and inside PDF sheets/dialogs, and guarding preview resize observers during active pinch-zoom.
- Fix an iPad Pro portrait (`1024px`) breakpoint gap where both the desktop navigation bar and the mobile menu button could be hidden at once.

## [0.2.0] - 2026-11-21

### Added

- Show the current app version and a link to the GitHub changelog on the About page, and add the MIT License.
- Add practical comparison questions to the landing and Terms FAQs, with a fictitious example of changes when the follower total stays the same.
- Explain relationship percentages on the results and PDF report pages, including how the three relationship counts add up to the chart denominator. Describe follower changes from the comparison ZIP to the ZIP being viewed on both cards.
- Pause reviews from the review spreadsheet and tell visitors on the About page that new review submissions are temporarily paused.

### Changed

- Use matching category tints in both dashboard preview modes on the landing page.
- Simplify history deletion confirmations to explain that deleted history cannot be recovered.
- Highlight the comparison upload action with a blue fill in both themes.
- Keep the analyzed filename’s ZIP extension visible when the name is truncated.
- Warn about limited or custom Instagram export ranges and remind users to check both ZIPs before interpreting results or comparison PDFs.
- Match the next step on the results page to local history status, including a direct upload action when a comparison is available.
- Show both counts behind the follow-back percentage in history, the PDF preview, and downloaded reports.
- Style Instagram profile links in account tables and mobile cards as blue underlined text, with neutral text for follow dates.
- Label Instagram profile links in follower comparison rows and place them below the timeline on narrow screens.
- Label expanded follower timelines with “Hide timeline” and emphasize the result for the open ZIP.
- Match active navigation, switcher, and dashboard preview tab highlights and hover fills across Dark and Light themes.
- Add a navigation arrow icon to the “Try comparing two sample ZIPs” button in the landing page local history preview.
- Make the mobile navigation drawer fully opaque in Light and Dark themes so page text behind it does not bleed through.
- Give all rows in the landing page dashboard preview table a uniform surface background instead of alternating row shading.
- Give the results account table a shaded header row, uniform row surface, and visible horizontal and vertical grid lines in both themes, and group mobile account rows into a single bordered list separated by dividers.
- Widen and center the rank column and fit 30 account rows per A4 page in PDF report previews and generated PDFs to reduce empty bottom space.
- Present the tip for checking missing followers with Instagram counts and saved ZIPs as a short list.
- Give account overview relationship cards amber, blue, and green backgrounds in both themes. Use soft gray for the totals in Light theme.
- Tint the new follower card’s border green and the missing follower card’s border red.
- Show only the total page count in the PDF options summary.
- Underline profile links and show column dividers and outer borders in PDF account tables and their previews.
- Add a pale gold and rose background in Light theme that stays fixed while scrolling.
- Pair the blue background glow in Dark theme with a soft rose glow.
- Add a breadcrumb to desktop PDF reports and label the return destinations on mobile. Returning from the report preserves the selected ZIP comparison.
- Show each ZIP’s date and filename once on the results page, label both files, and place a two-way arrow between them.
- Set English as the default `README.md` and move the Thai translation to `README.th.md`. Put the feature overview and ZIP workflow near the top of both versions and add tables for the app components and development commands.
- Improve both README layouts on mobile with a standalone app link, shorter tables, and a separate guide section for optional export comparisons.
- Add `npm run setup:env` to create a local environment file from the safe example without overwriting an existing file and clarify Cloudflare Pages setup.
- Set up reviews with a Google Form and the review receiver script.
- Show a bilingual confirmation after feedback is submitted.
- Replace the operating system styled account sort select with a theme-matched accessible menu.
- Add a conventional commit message template (`.gitmessage`), a `git ci` alias, and an npm `prepare` script to encourage atomic, conventional commits.
- Refresh the share preview image to the current landing page, captured in the System theme.
- Use theme-aware background tints to distinguish sections on the landing page.
- Show only new and missing follower counts in the ZIP comparison summary and its PDF. Simplify the PDF overview by removing the difference between following and follower totals.
- Clarify how the landing-page features use Instagram ZIPs to check followers, compare exports, and create local reports.
- Flag unusually large follower turnover even when the total stays the same, and include the warning in comparison PDFs.
- Reuse saved history entries for identical ZIPs and exclude identical archive data from comparisons.
- Warn about large follower count drops before showing comparison totals and link to the All time export instructions.
- Clarify the follower comparison cards with a dated example of a name missing from the newer ZIP.
- Credit the Thai developer on the About page.
- Keep the navigation at the top and reveal the footer at the end of the scrollable page.
- Put ZIP explanations inside the follower comparison cards and give both cards a clear border.

### Fixed

- Serve a valid `robots.txt` file instead of the HTML fallback, speed up new-follower filtering in PDF reports, and complete the English HTML-export notice and singular account count labels.
- Hide the mobile “See saved entries” jump button on desktop history layouts where the saved list is already visible alongside settings.
- Jump directly to the All time guide step from results warnings on desktop and mobile.
- Wait for the review intake status before showing the review button on the About page.
- Keep desktop account table columns aligned when moving between pages.
- Validate ZIP selections before reading, stop file reads on cancellation, and report worker startup and decoding failures separately.
- Reject incomplete numbered lists and malformed account records before computing relationship counts.
- Apply history consent and deletion in IndexedDB transactions, and remove duplicate legacy snapshots during upgrade.
- Ignore cancelled or superseded ZIP reads and keep large supported lists within JavaScript argument limits.
- Open feedback results in Google Forms while preserving the draft in the app.
- Keep reviews working without newer AbortSignal helpers, restore keyboard focus after closing the mobile menu, and keep focus inside the fullscreen PDF preview.
- Align the Thai and English guides with the current ZIP comparison and PDF workflow.
- Validate export dates and nonempty JSON list shapes, and read HTML profile links with formatted labels. Close reopened results when their saved lists are removed and make key actions easier to find on mobile.
- Split new-follower and missing-follower comparison accounts into separate PDF and preview table pages.
- Format PDF comparison account names as a readable two-column table.
- Remove the sample history entry from the landing flow and keep direct access through the two-ZIP comparison.
- Add account-name previews for new and missing followers in PDF comparison summaries.
- Update the PDF A4 preview immediately when report section checkboxes or quick presets change.
- Group FAQ items into one bordered card with dividers instead of separate cards.
- Remove comparison file picker controls from PDF pages so reports preserve the comparison selected in analysis results.
- Open the PDF preview without an intermediate loading screen and prepare export assets in the background. Show download progress on the button when export takes a moment.
- Keep PDF creation in analysis/report screens and remove comparison PDF actions from history cards.
- Match the hover colors and transition for navigation links on mobile and desktop.
- Toggle each FAQ answer instantly and independently on the homepage and Terms page without shrinking the question button on press.
- Use consistent main heading sizes and spacing across the app on mobile and desktop.
- Open the relevant privacy topic from the review and feedback forms.
- Fail a ZIP analysis that stops receiving Worker responses instead of leaving the progress bar frozen, and keep progress moving while the archive fingerprint is computed.
- Apply history setting changes on top of another tab's newer version instead of failing the toggle, and stop keeping a deleted history entry selected after the list refreshes.

## [0.1.0] - 2026-11-20

### Added

- Analyze Instagram ZIP exports with JSON or HTML data entirely in your browser. ZIP files and follower lists stay on your device.
- See followers, following, mutual follows, and accounts that follow only one way. Search, filter, and sort the account table.
- Turn on local history to compare two exports for the same account, see new and missing followers, and browse individual account timelines. History is off by default and can be cleared from the app.
- Preview and download A4 PDF reports in Thai or English, with selectable sections and an optional comparison summary.
- Try the dashboard, export comparisons, and history with fictitious sample data.
- Follow illustrated instructions for requesting and finding your Instagram ZIP on iPhone, Android, and desktop.
- Use the app in Thai or English with System, Light, and Dark themes.
- Send feedback or leave a review from the About page. Publishing a review on the home page requires your consent.
- Run automated checks through GitHub Actions, including Tailwind IntelliSense diagnostics that can also run from PowerShell.
