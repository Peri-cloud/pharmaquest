# PharmaQuest — Pharmacist Exam Lab

A static, mobile-friendly pharmacist MCQ practice app built around the uploaded **Pharmacist MCQ** archive. It is designed for daily study, subject-wise revision and self-made timed mock tests. There is no backend, login or subscription.

## What is included

- 45,915 imported MCQ records across 21 pharmacy subjects.
- Daily mixed practice, with a default target of 25 questions (editable from Settings).
- Subject-wise practice and topic-focused sessions.
- Custom timed mock tests. Choose 25, 50, 75 or 100 questions and a timer from 0–120 minutes. This is a flexible practice mode, not a claim about any official examination pattern.
- Instant answer feedback and supplied explanation in practice mode; answer review only after submission in mock-test mode.
- Bookmarks, missed-question revision, question navigator, keyboard shortcuts and session summaries.
- Progress dashboard, weekly activity, per-subject accuracy, streak and daily goal.
- Local progress backup and restore using JSON.
- Light/dark theme, responsive layout and a small service worker that caches the app shell and subject files after first access.
- GitHub Actions workflow for automatic GitHub Pages deployment on every push to `main`.

## Question-bank quality handling

The source archive contains 45,915 records. This app's default practice set contains **45,080 answerable records** after applying both checks:

1. The source answer index must point to an existing option.
2. Records with source flags for missing images, incomplete stems, duplicate options, answer conflicts, low-confidence answers or required human review are excluded by default.

The source flag `answer_agrees_poll` is not excluded. In Settings, you can include other source-flagged records for exploration; questions with no valid answer are always excluded from scored practice.

The original questions and explanations are retained as supplied. They have **not** been independently fact-checked or corrected. Treat the source explanations as study aids and verify important clinical, legal, dose-related and current-regulation facts against authoritative references before relying on them.

## Run locally on Windows

1. Extract the complete `PharmaQuest` folder.
2. Make sure Python 3 is installed.
3. Double-click `START-LOCAL.bat`.
4. Your browser opens `http://localhost:8000`.
5. Keep the command window open while using the app. Press `Ctrl+C` in that window to stop the local server.

Do **not** open `index.html` directly with `file://`. Browsers block the app's local data requests in that mode. Use the local server or GitHub Pages.

## Deploy to GitHub Pages

The repository already contains `.github/workflows/pages.yml`, so every push to `main` can publish the site.

1. Create a new GitHub repository, for example `pharmaquest`.
2. Extract this package and upload the **contents of the `PharmaQuest` folder** to the repository root. `index.html` and `.github/` must be at the root level.
3. Commit and push to the `main` branch. From a Windows terminal opened inside this folder, the commands are:

   ```bash
   git init
   git add .
   git commit -m "Add PharmaQuest MCQ practice app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/pharmaquest.git
   git push -u origin main
   ```

   Replace the remote URL with your repository URL. If the repository already exists locally, do not run `git init` or add a second remote; just commit and push your changes.

4. On GitHub, open **Settings → Pages** and set **Build and deployment → Source → GitHub Actions**.
5. Open the repository's **Actions** tab and check that “Deploy PharmaQuest to GitHub Pages” completes successfully.
6. Return to **Settings → Pages** and open the published site URL.

For an account on GitHub Free, the repository generally needs to be public for GitHub Pages. Published Pages sites are publicly accessible, so do not add private notes, personal records or secrets to the repository. See the official [GitHub Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Updating the question bank

The daily question mix changes automatically each day, and your progress accumulates locally. The question-bank content itself does not regenerate automatically. To add or replace questions, update the relevant JSON file in `data/subjects/`, keep the schema below, update `data/manifest.json` counts, then commit and push. The GitHub Actions workflow publishes the new version automatically.

### Question JSON schema

Each subject file is a JSON array. A question record uses:

```json
{
  "id": "q123456",
  "subject": "Pharmacology",
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 1,
  "explanation": "Explanation text",
  "topic": "General pharmacology",
  "yieldLevel": "high",
  "examTags": ["EXAM 2024"],
  "flags": []
}
```

`answer` is a zero-based index. Use `null` only for an unanswerable source record; those are never included in scored practice. Keep IDs unique across the entire bank.

## Import this question bank into your existing Exam Practice Hub 2.1

Your GitHub account already contains a newer `practice-hub` project with a JSON Import Center. A separate `PharmaQuest-Exam-Practice-Hub-Import.zip` bundle is provided with 21 import-ready JSON files containing 45,080 default-quality-filtered questions. See [`PRACTICE-HUB-INTEGRATION.md`](PRACTICE-HUB-INTEGRATION.md) for the import steps and the important distinction between browser-local imports and the public bundled question bank.

## Progress, privacy and sync

- Progress, streaks, bookmarks and settings are saved in `localStorage` in the current browser profile.
- They are not sent to GitHub or to a server.
- Using the same published site on another device starts with separate progress. Use **Settings → Export JSON** on the old device and **Import progress** on the new one to transfer it.
- The service worker caches the app shell and subject files after they have been opened once. For offline use, first open each subject you expect to practise while online.
- Clearing browser site data can remove local progress. Export backups regularly.

## Keyboard shortcuts

- `1`–`6`: select an answer.
- `Enter`: submit an answer or move to the next question.
- `B`: bookmark the current question in practice mode.

## Project files

- `index.html` — application entry point.
- `styles.css` — responsive visual design and themes.
- `app.js` — session engine, progress tracking and UI.
- `data/manifest.json` — subject catalogue and source metadata.
- `data/subjects/*.json` — normalized MCQ datasets.
- `sw.js` — offline cache.
- `.github/workflows/pages.yml` — GitHub Pages deployment automation.
- `MASTER_PROMPT.md` — reusable prompt for future AI-assisted improvements.
- `DATA_AUDIT.md` — imported dataset counts and filtering summary.
