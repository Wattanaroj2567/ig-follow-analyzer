# Changelog

Notable changes to IG Follow Analyzer are documented here.

## [Unreleased]

### Changed

- Clarify the follower comparison cards with a dated example of a name missing from the newer ZIP.
- Credit the Thai developer on the About page.
- Keep the navigation at the top and reveal the footer at the end of the scrollable page.
- Put ZIP explanations inside the follower comparison cards and give both cards a clear border.

### Fixed

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
