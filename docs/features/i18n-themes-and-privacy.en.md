# Languages, Themes & Privacy

[ภาษาไทย](i18n-themes-and-privacy.md) · **English**

## Overview

Covers the cross-cutting bilingual system, appearance themes, Add to Home Screen guidance, and privacy boundaries shared across the entire application.

## Bilingual Interface (Thai / English)

- Defaults to Thai (`th`) with instant switching to English (`en`) from the desktop top bar or mobile drawer.
- Persists language choice in `localStorage` (`ig-follow-analyzer-language`).
- Switches language in place without losing active analysis results, search queries, or category filters.
- Covers all UI copy, date formatting, illustrated export mockups, and both real and sample PDF reports.

## Theme System (System / Light / Dark)

- The navigation stays at the top while page content scrolls. The footer appears at the end of the page, and **Back to top** returns the content to its start.
- The theme switcher lists **System (default)**, **Light**, and **Dark** from left to right.
- Persists preference in `localStorage` (`ig-follow-analyzer-theme`) and automatically updates `data-theme` and `<meta name="theme-color">` when OS appearance changes under `System`.
- Built on Tailwind CSS v4 tokens in `src/index.css` with `Plus Jakarta Sans` + `IBM Plex Sans Thai` typography and `prefers-reduced-motion` support.
- On mobile, the navigation bar and fullscreen PDF preview toolbar share the same height, theme surface, and control size.

## Add to Home Screen & Desktop Pinning

- Includes `public/manifest.webmanifest` and a collapsible, non-intrusive guide (`AddToHomeGuide.tsx`) on the Landing page (automatically hidden when running in `display-mode: standalone`).
- Supports 1-click installation (`beforeinstallprompt` on Chrome/Edge) alongside browser-specific instructions for mobile (`Safari`, `Chrome`, `Edge`, `Brave`, `Samsung Internet`, `Firefox`, in-app browsers) and desktop (`Chrome`, `Edge`, `Brave`, `Safari Mac Add to Dock`, `Firefox`).

## Privacy & Explicit Non-Goals

- **No User Accounts:** No sign-up, login, Instagram OAuth, password/cookie/token collection, or automated follow/unfollow actions.
- **Cookies and sessions:** The site sets no cookies, creates no login sessions, and does not track users. Language and theme preferences use `localStorage`; history uses `IndexedDB` only after explicit opt-in.
- **Terms, Privacy, and FAQ:** Covers the tool’s scope, local file processing, the two levels of history consent, and its independence from Instagram and Meta. Each FAQ answer opens and closes independently. Some answers link to the export guide and the History page for managing saved data.
- **About page:** Explains why IG Follow Analyzer was built, why it analyzes Instagram exports on the user’s device, and why users choose whether to enable history and what to keep.
- **Bug reports and feature suggestions:** On the About page, select **Open feedback form** to start writing. Hiding and reopening the form keeps the draft and selected topic. The details field accepts up to 500 characters and scrolls when needed. The link below the submit button opens **Bug reports and feature suggestions** in the privacy notice. On submission, Google Forms receives the topic, message, operating system name, browser name, and viewport size. ZIP files and account lists from the analysis stay on the user's device.
- **User reviews:** The About page’s review form follows the site theme and preserves the draft when switching themes. The link below the submit button opens **Ratings and review comments** in the privacy notice. On submission, Google Apps Script receives the review fields and a random ID that helps prevent duplicate ratings. Answers are saved in Google Forms. A restricted Google Sheet is used to manage reviews and record the same random ID stored in the browser. ZIP files and account lists from the analysis stay on the user's device.

## Collecting reviews through Google Forms

Visitors can send a review from **About → Write a review**. A rating of 1–5 and a display name of up to 80 characters are required. A comment of up to 500 characters and publication consent are optional. Apps Script saves answers to Google Forms. The submit button is disabled until the receiver is configured.

Once ratings exist, the homepage shows their average and count above the footer. It selects up to six consented comments a day after screening for profanity, impersonation, and contact details. Ratings still count when they have no public comment. The homepage counts submissions made via the site after this version of the receiver is enabled.

### First-time setup

1. Open the existing form as its owner, or run `createReviewForm` from the [form setup script](../examples/create-review-form.gs) and use the edit link in the execution log. The receiver expects one five-star rating, paragraph, short text, and checkbox question. Keep the configured consent option and make that question optional.
2. Under **Settings → Responses**, turn off email collection and limiting to one response, and turn on **Allow response editing**. Under **Presentation**, keep the response summary off. Publish for anyone with the link and verify the responder link opens in a private window without signing in. [Google Forms settings](https://support.google.com/docs/answer/2839588)
3. In the form select **Responses → Link to Sheets**, and create or select a spreadsheet with sharing set to **Restricted**. Paste the [review receiver and summary script](../examples/receive-review.gs) into Apps Script. Set the `REVIEW_FORM_ID` script property to the ID in `/forms/d/<id>/edit` and `REVIEW_SHEET_ID` to the ID in `/spreadsheets/d/<id>/edit`. [Link a form to a spreadsheet](https://support.google.com/docs/answer/139706)
4. Select `setupReviewLedger` in Apps Script, click **Run**, and grant permissions as the owner. This creates the **Review controls** tab.
5. Deploy as a **Web app**. Set **Execute as** to **Me** and **Who has access** to **Anyone**. For an existing deployment, use **Deploy → Manage deployments → Edit → New version** to keep its URL. Set the website's `VITE_REVIEW_ENDPOINT` to the URL ending in `/exec` at build time, then publish the rebuilt site. [Deploy an Apps Script web app](https://developers.google.com/apps-script/guides/web)

### View and manage reviews

1. In Google Forms open **Responses → Individual** to read responses, or use the Sheets icon under Responses to open the spreadsheet.
2. Open the **Review controls** tab. Find the row by its original display name and received time, then change its **Visibility**.
   - `show` counts the rating and makes eligible comments available for public display.
   - `hide` keeps the rating and removes the comment and name from public display.
   - `exclude` removes the comment, name, and rating from the homepage, for example for a test or spam submission.
3. Reload the homepage. These reversible controls preserve the original answer. For permanent deletion, remove the answer in Forms and any copy in the linked response tab and remove the identifying data from **Review controls** as needed. Set visibility to `exclude` first.

### Test before launch

Use a separate test form and sheet. Open the test site in a private window and submit a clearly labeled **System test** review with consent. Check **Responses**, **Review controls**, and the homepage above the footer. Use the edit link to change the rating and confirm the count stays the same. Set `hide`, then `exclude`, and reload after each change.

The edit link appears after the first successful submission. Respondents should keep it private. The site uses a random browser-local ID to reduce repeat ratings. Clearing site storage or switching browsers may allow a new submission. Automated text screening is a first pass. Owners can hide anything it misses.

## Related Source Files

- [`src/lib/language.ts`](../../src/lib/language.ts) — Language context and translator helpers (`useLanguage`, `readLanguage`)
- [`src/lib/theme.ts`](../../src/lib/theme.ts) — `useThemePreference` hook
- [`src/components/AppShell.tsx`](../../src/components/AppShell.tsx) — Top navigation, mobile back control, language/theme switchers, mobile drawer, back-to-top button, and footer
- [`src/screens/TrustAndAboutScreen.tsx`](../../src/screens/TrustAndAboutScreen.tsx) — Terms/Privacy, FAQ, and About screens
- [`src/index.css`](../../src/index.css) — Tailwind CSS v4 theme tokens for Dark/Light modes
