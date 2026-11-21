# IG Follow Analyzer

<p align="center">
  <img src="public/favicon.svg" alt="IG Follow Analyzer logo" width="112" />
</p>

<p align="center">
  See who follows you back on Instagram, compare two exports, and download an A4 PDF report. The app analyzes ZIP files in your browser and keeps follower lists on your device.
</p>

<p align="center">
  <strong><a href="https://follow-analyzer.tawandev.site/">Open the web app</a></strong>
</p>

<p align="center">
  <a href="docs/features/instagram-export-guide.en.md">Export guide</a> ·
  <a href="docs/README.en.md">Feature docs</a>
</p>

<p align="center">
  <strong>English</strong> · <a href="README.th.md">ภาษาไทย</a>
</p>

---

## Features

- **Follower dashboard.** See who follows you, who you follow, who follows you back, and who does not follow back on either side. Search, filter, and sort the lists.
- **Relationship percentages.** See how each percentage is calculated from your results.
- **ZIP analysis in your browser.** Open Instagram exports in JSON or HTML. Your ZIP stays on your device.
- **Compare exports.** See which followers are new or missing between two ZIPs from the same account. History is off by default and can be cleared anytime.
- **A4 PDF reports.** Download your results in Thai or English.
- **Sample data and export guide.** Try the dashboard with fictitious accounts, then follow the guide to request your own ZIP.
- **Comparison Q&A.** Find what to do with your first ZIP, a newer export, or a duplicate.
- **Language and themes.** Use the app in Thai or English with System, Dark, or Light themes.

## How to use

Try the sample data on the home page, or follow these steps with your own export.

1. **Request your ZIP.** In Instagram Accounts Center, select **Followers and following**, **All time**, and **JSON**. Download the ZIP when it is ready.
2. **Analyze your ZIP.** If you plan to compare exports later, enable local history and account-list saving first. Then select your ZIP in the app.
3. **Download the report.** On the results page, select **Create PDF report** and download it to your device.

### Compare exports (optional)

Return to the same browser with a newer ZIP for the same account. The results show who appeared or disappeared since the earlier saved export. [Local history guide](docs/features/local-history.en.md)

## How it works

`Instagram ZIP → Web Worker → Dashboard → A4 PDF`

| Component           | Role                                   |
| ------------------- | -------------------------------------- |
| Web app             | Displays analysis results.             |
| Web Worker · fflate | Reads ZIPs and computes relationships. |
| PDF · pdfmake       | Builds the A4 report.                  |
| History · IndexedDB | Stores opted-in data in the browser.   |

The web app uses React, TypeScript, Vite, and Tailwind CSS.

ZIP analysis and PDF export run entirely on your device. The app works without an account or Instagram credentials. [Privacy and scope](docs/features/i18n-themes-and-privacy.en.md#privacy--explicit-non-goals)

## Run locally

Use Node.js 24 and npm. Run these commands from the repository root and open the local URL printed by Vite.

```bash
npm ci
npm run dev
```

### Enable reviews (optional)

Run `npm run setup:env` to create `.env.local` from the example. Set `VITE_REVIEW_ENDPOINT` to the full Google Apps Script web app URL ending in `/exec`. The endpoint is public in the browser bundle. [Review setup guide](docs/features/i18n-themes-and-privacy.en.md#first-time-setup)

### Deploy to Cloudflare Pages

Use `npm run build` as the build command and `dist` as the output directory. For reviews in production, set `VITE_REVIEW_ENDPOINT` in the Production environment and redeploy.

## Development commands

| Command                 | Purpose                             |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start the Vite dev server.          |
| `npm run setup:env`     | Create the local review config.     |
| `npm run lint`          | Check the code with ESLint.         |
| `npm run lint:tailwind` | Check Tailwind CSS classes.         |
| `npm run format:check`  | Check formatting with Prettier.     |
| `npm run typecheck`     | Check TypeScript types.             |
| `npm run deadcode`      | Find unused code and dependencies.  |
| `npm run test`          | Run the Vitest suite.               |
| `npm run build`         | Build the static site into `dist/`. |
| `npm run preview`       | Serve the production build locally. |

## Documentation

- [Feature documentation](docs/README.en.md)
- [Desktop and mobile screenshots](docs/screenshots/README.md)
- [Changelog](CHANGELOG.md)
- [AI agent guidelines](AGENTS.md)

If reviews are enabled, use the feedback form on the app’s **About** page to report a problem or suggest an improvement.

Created by [Wattanaroj Butdee](https://github.com/Wattanaroj2567). Released under the [MIT License](LICENSE). © 2026 IG Follow Analyzer. Independent tool, not affiliated with Instagram or Meta.
