# Languages, Themes & Privacy

[ภาษาไทย](i18n-themes-and-privacy.md) · **English**

## Overview

Covers the cross-cutting bilingual system, appearance themes, Add to Home Screen guidance, and privacy boundaries shared across the entire application.

## Bilingual Interface (Thai / English)

- Defaults to Thai (`th`) with instant switching to English (`en`) from the desktop top bar or mobile drawer.
- Persists language choice in `localStorage` (`ig-follow-analyzer-language`).
- Switches language in place without losing active analysis results, search queries, or category filters.
- Covers all UI copy, date formatting, illustrated export mockups, and both real and sample PDF reports.

## Theme System (System / Dark / Light)

- Supports 3 modes: **System (default)**, **Dark**, and **Light**.
- Persists preference in `localStorage` (`ig-follow-analyzer-theme`) and automatically updates `data-theme` and `<meta name="theme-color">` when OS appearance changes under `System`.
- Built on Tailwind CSS v4 tokens in `src/index.css` with `Plus Jakarta Sans` + `IBM Plex Sans Thai` typography and `prefers-reduced-motion` support.

## Add to Home Screen & Desktop Pinning

- Includes `public/manifest.webmanifest` and a collapsible, non-intrusive guide (`AddToHomeGuide.tsx`) on the Landing page (automatically hidden when running in `display-mode: standalone`).
- Supports 1-click installation (`beforeinstallprompt` on Chrome/Edge) alongside browser-specific instructions for mobile (`Safari`, `Chrome`, `Edge`, `Brave`, `Samsung Internet`, `Firefox`, in-app browsers) and desktop (`Chrome`, `Edge`, `Brave`, `Safari Mac Add to Dock`, `Firefox`).

## Privacy & Explicit Non-Goals

- **No User Accounts:** No sign-up, login, Instagram OAuth, password/cookie/token collection, or automated follow/unfollow actions.
- **Terms, Privacy, and FAQ:** Covers the tool’s scope, local file processing, the two levels of history consent, and its independence from Instagram and Meta. The FAQ links to the export guide and the History page for managing saved data.
- **About page:** Explains why IG Follow Analyzer was built, why it analyzes Instagram exports on the user’s device, and why users choose whether to enable history and what to keep.
- **Feedback form on the About page:** When submitted, `FeedbackForm.tsx` sends the category, message, operating system, browser, and viewport size to Google Forms. It does not attach the ZIP or account lists from the analysis.

## Related Source Files

- [`src/lib/language.ts`](../../src/lib/language.ts) — Language context and translator helpers (`useLanguage`, `readLanguage`)
- [`src/lib/theme.ts`](../../src/lib/theme.ts) — `useThemePreference` hook
- [`src/components/AppShell.tsx`](../../src/components/AppShell.tsx) — Top navigation, language/theme switchers, mobile drawer, back-to-top button, and footer
- [`src/screens/TrustAndAboutScreen.tsx`](../../src/screens/TrustAndAboutScreen.tsx) — Terms/Privacy, FAQ, and About screens
- [`src/index.css`](../../src/index.css) — Tailwind CSS v4 theme tokens for Dark/Light modes
