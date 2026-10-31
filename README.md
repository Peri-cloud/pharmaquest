# PharmaQuest — Pharmacist Exam Lab

A static, responsive MCQ practice app for pharmacy exam preparation. It includes a daily mixed-practice target, subject- and topic-wise practice, timed mock tests, instant explanations, bookmarks, wrong-answer revision, performance analytics, local progress backup, themes and an offline-capable PWA shell.

## Question bank

- Source archive: 45,915 MCQ records across 21 pharmacy subjects.
- Default scored pool: 45,080 answerable records after excluding invalid-answer records and source-flagged quality issues.
- Original questions and explanations are preserved as supplied and have not been independently fact-checked. Verify clinical, legal, dose-related and current-regulation facts against authoritative references.

## Run locally

With Python 3 installed, run `python -m http.server 8000` from the project root and open http://localhost:8000. Do not open index.html directly with file:// because browser data requests may be blocked.

## GitHub Pages deployment

The repository includes `.github/workflows/pages.yml`. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source. Push the project to `main`; the workflow will publish the static site. Check the **Actions** tab for the deployment result and **Settings → Pages** for the live URL.

## Data and privacy

Progress, bookmarks, streaks and preferences are stored in localStorage in the current browser profile. They are not sent to a server. Export a progress backup before clearing site data or changing devices. For offline use, open each subject while online once so its dataset can be cached.

## Project structure

- `index.html`, `styles.css`, `app.js`: app interface and session logic
- `data/manifest.json`: subject catalogue
- `data/subjects/*.json`: 21 normalized subject datasets
- `sw.js`, `manifest.webmanifest`: offline/PWA support
- `.github/workflows/pages.yml`: automatic Pages deployment
- `MASTER_PROMPT.md`: future development prompt
- `DATA_AUDIT.md`: source-data quality summary
