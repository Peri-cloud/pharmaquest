# PharmaQuest — Pharmacist Exam Lab

<badge>Repository initialized</badge>

This repository has been created for the standalone PharmaQuest pharmacist MCQ practice application. The initial GitHub setup is in place, including the `main` branch, this deployment workflow and a Windows publishing helper.

**Important:** the full app source and question-bank JSON files have not yet been transferred into this repository. The repo will become the complete runnable app after the first full project push.

## Project package

The complete source package is provided separately in the ChatGPT conversation as **PharmaQuest-GitHub-Pages.zip**. It contains the app, its 21 pharmacy-subject datasets, documentation and the Windows publishing helper.

## Publish the complete project

1. Download and extract `PharmaQuest-GitHub-Pages.zip`.
2. Open the extracted `PharmaQuest` folder — the one that contains `index.html`.
3. Make sure Git for Windows is installed and GitHub sign-in works in Git Credential Manager.
4. Double-click `PUSH-TO-GITHUB.bat`.
5. The helper fetches this repository's current `main` branch, preserves the extracted project files, commits them and pushes the full app to this repository.

Run the helper from the extracted app folder, **not from a clone of this temporary bootstrap repository**.

## GitHub Pages

The repository includes `.github/workflows/pages.yml`. After the full app files are pushed, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The next app-source push will run the deployment workflow. Check the **Actions** tab for its result and **Settings → Pages** for the published URL.

## Question-bank notes

The source archive contains 45,915 MCQ records across 21 pharmacy subjects. The default practice pool includes 45,080 answerable records after excluding invalid-answer records and source-flagged quality issues. The supplied questions and explanations have not been independently fact-checked; verify important clinical, legal, dosage and current-regulation facts against authoritative references.
