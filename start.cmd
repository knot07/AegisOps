@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist "_runtime\python\python.exe" (
  echo Missing bundled Python. Extract the complete Windows portable ZIP first.
  pause
  exit /b 1
)
"%~dp0_runtime\python\python.exe" -I -X utf8 "%~dp0windows.py" %*
if errorlevel 1 (
  echo.
  echo AegisOps could not start. Read the error above.
  pause
  exit /b 1
)
endlocal
