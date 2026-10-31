# PharmaQuest — Pharmacist Exam Lab

This repository is being prepared for the standalone PharmaQuest pharmacy MCQ practice app.

## First upload — no Git installation needed

The complete project is uploaded as one ZIP file. The repository's GitHub Actions workflow expands it, commits the actual app files and all 21 pharmacy subject datasets, then deploys the site.

1. Open this repository: https://github.com/Peri-cloud/pharmaquest
2. Click **Add file → Upload files**.
3. Upload **PharmaQuest-Source.zip** to the repository root. Do not extract it before uploading.
4. Commit the ZIP upload to the **main** branch.
5. Open **Actions** and watch **Deploy PharmaQuest to GitHub Pages**.
6. Once deployment succeeds, open **Settings → Pages** for the live site URL.

**Do not run a batch file.** This upload method works through the GitHub website and does not require Git for Windows.

## What the application includes

- 45,915 source MCQ records across 21 pharmacy subjects.
- 45,080 default-eligible, answerable questions after excluding invalid-answer records and source-flagged quality issues.
- Daily mixed practice, subject/topic practice and customizable timed mock tests.
- Instant explanations in practice mode, bookmarks and wrong-answer revision.
- Session summaries, analytics, streaks and adjustable daily target.
- Local progress backup/restore, light/dark theme and offline-capable PWA shell.

The supplied questions and explanations have not been independently fact-checked. Check important clinical, legal, dosage and current-regulation facts against authoritative references.

## After first deployment

The app files will appear directly in the repository root: `index.html`, `app.js`, `styles.css`, `data/` and PWA files. Future pushes to `main` trigger the deployment workflow automatically.

Progress and bookmarks are stored locally in the browser; they are not synced between devices. Export a backup before clearing browser data.

Published GitHub Pages sites are public. Do not store personal records, private notes or secrets in this repository.
