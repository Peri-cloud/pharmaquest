@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ==========================================================
echo  PharmaQuest - Publish this complete project to GitHub
echo ==========================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git was not found. Install Git for Windows first:
  echo https://git-scm.com/download/win
  echo Then close this window, reopen it, and run this file again.
  pause
  exit /b 1
)

if not exist "index.html" (
  echo ERROR: index.html was not found.
  echo Extract the complete PharmaQuest ZIP and run this file
  echo from the same folder that contains index.html.
  pause
  exit /b 1
)

if not exist ".git" git init -b main
if errorlevel 1 goto :failed

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/Peri-cloud/pharmaquest.git
) else (
  git remote set-url origin https://github.com/Peri-cloud/pharmaquest.git
)
if errorlevel 1 goto :failed

echo.
echo Connecting to Peri-cloud/pharmaquest and syncing main...
git fetch origin main
if errorlevel 1 (
  echo Could not fetch the repository. Check your internet connection
  echo and GitHub sign-in, then run this file again.
  goto :failed
)

rem Preserve extracted files while basing the new commit on remote main.
git reset --mixed origin/main
if errorlevel 1 goto :failed

git add -A
if errorlevel 1 goto :failed

git diff --cached --quiet
if not errorlevel 1 goto :success

git commit -m "Publish PharmaQuest pharmacist MCQ practice app"
if errorlevel 1 goto :failed

git push -u origin main
if errorlevel 1 goto :failed

:success
echo.
echo SUCCESS: PharmaQuest has been pushed to:
echo https://github.com/Peri-cloud/pharmaquest
echo.
echo Next: GitHub Settings -^> Pages -^> Source -^> GitHub Actions.
echo Then check the Actions tab for the Pages deployment.
echo.
pause
exit /b 0

:failed
echo.
echo The upload did not finish. No files were deleted.
echo Check the message above, correct the issue, and run this file again.
echo.
pause
exit /b 1
