# Master Prompt — Build / Improve PharmaQuest

Copy everything below into your AI coding tool. Attach the `PharmaQuest` project folder and the original MCQ archive when available.

---

## ROLE

Act as a senior product designer, UX researcher and front-end engineer who specialises in polished educational products, exam-preparation systems and accessible static web applications. Build a production-quality pharmacist MCQ practice platform called **PharmaQuest — Pharmacist Exam Lab**.

You are responsible for the product architecture, interaction design, responsive UI, question-bank integrity, testing and deployment instructions. Do not produce a generic quiz template. The result must feel like a carefully designed study product that a serious pharmacy student can use every day.

## PRIMARY OUTCOME

Create a fast, elegant, mobile-first MCQ web app using **HTML, CSS and vanilla JavaScript**. It must deploy as a static website to GitHub Pages and must not require a paid API, backend, account, build system or framework. Use only local assets and browser-native capabilities. If a feature requires a backend, explain the limitation and provide a safe local alternative instead of pretending it works.

The target learners are pharmacist-exam candidates preparing for exams such as MRB Pharmacist, RRB Pharmacist, AIIMS CRE Pharmacist and state pharmacist recruitment exams. Do not hard-code or claim an official exam pattern unless the user supplies a current official notification. Timed mocks must be configurable and clearly labelled as custom practice tests.

## DATASET CONTEXT

The source archive contains **45,915 question records across 21 pharmacy subjects**. The imported app data has already been normalised into a manifest plus subject JSON files. Preserve its content and IDs.

Each question record follows this schema:

```json
{
  "id": "q123456",
  "subject": "Pharmacology",
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 1,
  "explanation": "Supplied explanation",
  "topic": "General pharmacology",
  "yieldLevel": "high",
  "examTags": ["EXAM 2024"],
  "flags": []
}
```

`answer` is a zero-based index into `options`. Some questions have five or more options; never assume exactly four. Some source records have no valid answer. Some carry quality flags. The current default policy excludes records marked `image_needed`, `incomplete_question`, `duplicate_options`, `answer_conflicts_poll`, `needs_human_answer` or `answer_low_confidence`, and excludes any question whose answer index is invalid. `answer_agrees_poll` may remain eligible. Keep this policy configurable and explain it in the UI. Never silently invent a correct answer or a missing explanation.

The source bank has not been independently clinically or legally fact-checked. Preserve supplied wording and explanations unless the user explicitly asks for a reviewed correction workflow. For drug, dose, interaction, disease-management, law and regulatory information, show a clear reminder that source explanations should be checked against authoritative current references.

## PRODUCT DESIGN

Design a calm, high-quality study workspace with:

- A clean light theme and a carefully tuned dark theme.
- A strong typographic hierarchy, generous spacing and a restrained pharmacy-inspired palette (deep green, sage, warm off-white, restrained lime accent).
- Consistent buttons, tags, option cards, progress bars, charts, empty states, loading states, success/error feedback and responsive navigation.
- Desktop sidebar navigation and a mobile-friendly menu/bottom navigation pattern.
- Proper focus states, semantic HTML, keyboard accessibility, readable contrast, reduced-motion support and touch-friendly controls.
- No clutter, excessive gradients, noisy animations, fake charts, fake data, placeholder buttons or decorative controls that do nothing.

The dashboard should make the next useful action obvious within seconds. The question screen should keep the question and options visually dominant and make it easy to answer without distractions.

## REQUIRED FEATURES

### 1. Dashboard
- Daily target selector, default 25 questions per day.
- “Start today’s practice” action that creates a balanced mix across subjects.
- Quick mixed practice.
- Entry point for subject practice and timed mock tests.
- Questions attempted, overall accuracy, current streak and today's progress.
- Seven-day activity chart based only on actual saved activity.
- Subject performance based only on actual recorded attempts.
- Clear empty states before the learner has any history.

### 2. Question bank
- List all subjects with source counts and default eligible counts.
- Search subject names and topic names.
- Subject-wise practice.
- Topic picker for each subject, with actual topic counts.
- Optional high-yield and flagged-question filters, if implemented accurately.
- Load subject files lazily; do not download all 21 files on the first dashboard visit.

### 3. Practice mode
- One question per screen, all supplied options shown in their original order.
- Option selection, answer submission, immediate correct/incorrect feedback and supplied explanation.
- Bookmark / unbookmark.
- Skip a question without treating it as answered.
- Previous/next controls and a question navigator.
- Question ID, subject and topic metadata.
- Support variable option counts.
- Keyboard shortcuts: `1`–`6` to choose, `Enter` to submit/continue, `B` to bookmark.

### 4. Timed mock mode
- User-configurable question count and time limit.
- No instant correctness feedback while the mock is in progress.
- Allow navigation between questions and mark-for-review.
- Save only the final selected answer for each question when the test is submitted or time expires.
- Show score, correct, incorrect, unanswered, time spent and explanations after finishing.
- Label this as a custom mock, not an official exam pattern.

### 5. Review centre
- Missed questions, bookmarks and recent activity.
- One-click practice from each list.
- Prioritise previously missed questions for revision.
- Avoid showing a stale or empty review list just because the corresponding subject file has not yet been loaded.

### 6. Performance
- Overall accuracy and attempts.
- Daily activity and streak.
- Per-subject accuracy.
- Weak topics based on actual incorrect attempts.
- No invented or hard-coded performance metrics.

### 7. Persistence and portability
- Store attempts, bookmarks, daily logs, streak inputs, settings and optional daily plan in `localStorage` or IndexedDB.
- Export and import a versioned JSON backup.
- Explain that progress is browser/device-local and does not automatically sync across devices.
- Never put personal study progress into the public Git repository.

### 8. Offline behaviour
- Add a web app manifest and service worker.
- Cache the app shell at first load and cache each subject JSON file after it is opened successfully.
- Show an understandable offline message when a subject has not yet been cached.
- Do not claim the entire bank is offline-ready until all required subject files have actually been cached.

### 9. Data integrity
- Validate each answer index before a question enters a scored session.
- Support more than four choices.
- Keep IDs stable and unique.
- Do not rewrite question content during import.
- Preserve the original exam-source tags, topic labels, source flags and explanations.
- Report duplicate IDs, malformed records, missing answers and questionable records in a data audit.
- If a source update changes the schema, add a migration instead of silently breaking old data or user progress.

## TECHNICAL REQUIREMENTS

- Use plain HTML, CSS and vanilla JavaScript. No React, Vue, Angular, jQuery, external quiz API or paid service.
- Keep files organised: `index.html`, `styles.css`, `app.js`, `data/manifest.json`, `data/subjects/*.json`, `manifest.webmanifest`, `sw.js`, documentation and GitHub Actions workflow.
- Use relative URLs everywhere so project-site paths such as `https://USERNAME.github.io/REPOSITORY/` work.
- Do not assume the app is served from the domain root.
- Do not use `file://` fetches; document a local static-server command.
- Escape source text before inserting it into HTML. Treat the imported MCQ text as untrusted data.
- Add robust loading, error, empty and storage-quota handling.
- Keep the first-load payload small and lazy-load subject data.
- Cache large data files only after a successful fetch.
- Make every visible button functional. Remove or label unfinished features instead of leaving dead controls.
- Include a GitHub Actions workflow that deploys the static root to GitHub Pages on pushes to `main` and on manual dispatch.
- Include a README with Windows local-run instructions, deployment steps, data update steps, backup explanation and known limitations.

## QUALITY CHECKS BEFORE DELIVERY

Run and report all of the following:

1. JavaScript syntax check.
2. Parse every subject JSON file and verify the total number of records.
3. Verify every question has a non-empty ID, question text and at least two options.
4. Count answerable and unanswerable questions.
5. Confirm every scored question has an integer answer index within its option array.
6. Confirm IDs are unique across the entire dataset.
7. Confirm the default quality filter excludes the correct source flags.
8. Test dashboard load, subject load, topic selection, practice submit, skip, bookmark, timed mock, result review, progress persistence and export/import.
9. Test responsive layout on desktop and mobile.
10. Test GitHub Pages path compatibility and service-worker scope.
11. Confirm the final ZIP contains the entire site, not just `index.html`.

## DELIVERY FORMAT

Deliver:

1. The complete working app source folder.
2. A ZIP containing the complete app and all required subject data.
3. A README with exact GitHub Pages deployment steps.
4. A separate `MASTER_PROMPT.md` for future AI-assisted changes.
5. A data audit with per-subject counts and quality-filter information.
6. A concise summary of what was tested and any known limitations.

Do not stop after writing a plan. Build the app, test it, fix any errors found and package the complete working result.

---

## CHANGE REQUEST TEMPLATE

When improving an existing PharmaQuest version, append the following:

**Requested change:** [Describe the new feature or correction.]

**Do not regress:** Existing question data, question IDs, answer scoring, bookmarks, progress history, responsive layouts, local backup format, offline caching and GitHub Pages deployment.

**Acceptance criteria:** [List the exact behaviour that must work.]

Before editing, inspect the existing files and data structures. Then implement the change, run the quality checks, update the README and return the complete updated project ZIP. Do not return partial code snippets in place of updated files.
