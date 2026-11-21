# Changelog

Notable changes to IG Follow Analyzer are documented here.

## [Unreleased]

### Changed

- Add a conventional commit message template (`.gitmessage`), a `git ci` alias, and an npm `prepare` script to encourage atomic, conventional commits.

- Refresh the share preview image to the current landing page, captured in the System theme.
- Use theme-aware background tints to distinguish sections on the landing page.
- Label both ZIPs consistently and display the net increase, decrease, or unchanged count with its calculation.
- Clarify how the landing-page features use Instagram ZIPs to check followers, compare exports, and create local reports.
- Flag unusually large follower turnover even when the total stays the same, and include the warning in comparison PDFs.
- Reuse saved history entries for identical ZIPs and exclude identical archive data from comparisons.
- Warn about large follower count drops before showing comparison totals and link to the All time export instructions.
- Clarify the follower comparison cards with a dated example of a name missing from the newer ZIP.
- Credit the Thai developer on the About page.
- Keep the navigation at the top and reveal the footer at the end of the scrollable page.
- Put ZIP explanations inside the follower comparison cards and give both cards a clear border.

### Fixed

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
- Center the PDF loading state while the report screen initializes.
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
