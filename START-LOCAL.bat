@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "PharmaQuest" http://localhost:8000
  py -m http.server 8000
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "PharmaQuest" http://localhost:8000
  python -m http.server 8000
  goto :eof
)
echo Python was not found. Install Python 3 or deploy this folder to GitHub Pages.
pause
