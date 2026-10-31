# Add the PharmaQuest bank to your existing Exam Practice Hub 2.1

Your connected GitHub account already has a newer **Exam Practice Hub 2.1** repository at `https://github.com/Peri-cloud/practice-hub`. That app includes a JSON Import Center and stores imported questions in the current browser's IndexedDB.

A separate archive, `PharmaQuest-Exam-Practice-Hub-Import.zip`, is supplied alongside the standalone PharmaQuest app. It contains 21 import-ready JSON arrays with **45,080** answerable, default-quality-filtered questions.

## Import steps

1. Extract `PharmaQuest-Exam-Practice-Hub-Import.zip`.
2. Open your existing Exam Practice Hub 2.1 website in Chrome or Edge.
3. Open **Import Center** and select JSON import.
4. Select all 21 files inside the extracted `subjects` folder. Each file is below the importer's documented 8 MB per-file limit.
5. Review the field-mapping and validation screen. The data uses the importer's accepted root-array structure and standard `question`, `options`, `answer`, `explanation`, `subject`, `topic` and `tags` fields. The answer value is a zero-based option index.
6. Confirm the import after checking the preview. Verify the imported counts in the app.
7. Export a progress/data backup from the existing app after the import.

## What happens to the data?

The import is stored in the current browser profile under the app's local IndexedDB import bank. It does **not** change the GitHub repository, modify the bundled original dataset, or automatically make the imported questions visible to other visitors. To distribute the questions to all visitors, the app's bundled dataset would need a deliberate repository update and rebuild.

The import bundle excludes invalid answer indexes and questions carrying the configured quality flags for missing images, incomplete stems, duplicate options, answer conflicts, low-confidence answers or required human review. It preserves source question IDs, wording, options, explanations, subjects, topics and exam tags.

The supplied answer keys and explanations are preserved from the source archive and are not independently fact-checked. Verify important clinical, legal, dose-related and regulatory details against authoritative current references.
