@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Please run start.cmd first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" backup.py
pause
