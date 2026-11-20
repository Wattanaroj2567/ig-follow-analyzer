# Project Agent Instructions — IG Follow Analyzer

This file defines the project-specific rules and workflow for `ig-follow-analyzer`.

## 1. Orientation & Read First

- **Workspace boundary:** Edit files only inside this repository. Do not edit `src/` when a task is explicitly design-only or review-only.
- **Skills:** Reuse installed global skills matching the task (no repo-local `.agents/skills/` folder is used).
- **Code map (inspect only what the task touches):**
  - App shell & routes: `src/App.tsx`, `src/lib/routes.ts`, `src/components/AppShell.tsx`
  - ZIP parsing & set engine: `src/workers/zipParser.worker.ts`, `src/lib/igParser.ts`, `src/data/relationshipMetrics.ts`
  - Export & local history: `src/lib/pdfGenerator.ts` (report fonts in `public/fonts/`), `src/lib/historyStore.ts` (`IndexedDB`)
  - Language, theme & tokens: `src/lib/language.ts`, `src/lib/theme.ts`, `src/index.css`
- **Feature docs (read on demand):** Start with `docs/README.md` (`docs/README.en.md`) and the matching bilingual file in `docs/features/`. Document unresolved assumptions instead of silently inventing behavior.

## 2. Product & Privacy Guardrails (Non-Negotiable)

- **100% client-side processing:** Parse Instagram `.zip` archives (JSON/HTML) locally inside `src/workers/zipParser.worker.ts` (`fflate`). Never transmit user archives or follower lists to any server.
- **Prohibited features:** Never add website sign-up/login, user accounts, Instagram OAuth, credential/password/cookie/token collection, or automated follow/unfollow actions.
- **Opt-in local history:** Browser-local history (`IndexedDB`, Model B) must remain OFF by default, require explicit 2-tier consent, and support 1-click full clear.
- **Direct local PDF export:** Generate A4 PDF reports locally with `pdfmake`, the active site colors, and the site's `Plus Jakarta Sans` and `IBM Plex Sans Thai` fonts. Trigger direct device downloads without external OAuth or cloud APIs.
- **Set-derived metrics:** Compute all counts via set operations rather than hardcoding numbers. Use only fictitious handles and sample data in previews and guides.

## 3. UI, Branding & Copy Rules

- **Branding & legal:** Always use `IG Follow Analyzer` consistently (text-only wordmark). Omit Instagram and Meta brand marks in the UI and export guide. Preserve the `© 2026 IG Follow Analyzer` footer notice, Meta/Instagram non-affiliation disclaimer, 1-minute plain-language Terms/Privacy, and About page.
- **Visual system & themes:** Follow the Tailwind CSS v4 tokens in `src/index.css` with System (default), Dark, and Light themes, `Plus Jakarta Sans` + `IBM Plex Sans Thai` typography, and crisp 2D `lucide-react` UI icons (avoid cartoon emojis and generic violet/lavender templates).
- **Bilingual parity (Thai-first + English):** Keep Thai and English copy, guide illustrations, and sample reports in sync through `src/lib/language.ts`. Switching languages must persist in the browser without losing active analysis results or filters.
- **Accessibility & verification assets:** Keep interactive HTML semantic, keyboard-accessible, responsive, with visible focus states and `prefers-reduced-motion` support. Capture desktop and mobile verification screenshots as separate assets at natural viewport dimensions.

## 4. Implementation & Verification Workflow

1. **Plan & edit:** Keep changes scoped to the request. Preserve base-path compatibility for static assets and `public/fonts/` so production builds (Cloudflare Pages / static hosting) work without broken links.
2. **Verify before finishing code changes:** Run and pass:
   - `npm run lint`
   - `npm run format:check`
   - `npm run typecheck`
   - `npm run deadcode`
   - `npm run test`
   - `npm run build`
3. **Sync documentation:**
   - Update `README.md` (Thai) and `README.en.md` (English) together when user-facing features, setup, or deployment change. Keep READMEs high-level; do not append micro-UI patch notes.
   - Record notable user-facing, setup, or bug-fix changes under `## [Unreleased]` in `CHANGELOG.md`.
