# Changelog

Notable changes to IG Follow Analyzer are documented here.

## [Unreleased]

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
