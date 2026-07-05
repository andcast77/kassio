@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "KASSIO_BACKEND_ROOT=%ROOT%\backend"
set "KASSIO_DATA_DIR=%ProgramData%\Kassio\data"

"%ROOT%\node\node.exe" "%ROOT%\backend\setup.mjs"
set "SETUP_EXIT=%ERRORLEVEL%"
if %SETUP_EXIT% neq 0 exit /b %SETUP_EXIT%

if exist "%ProgramData%\Kassio" (
  rem Grant Modify to Users so any Windows account can use the shared DB.
  icacls "%ProgramData%\Kassio" /grant *S-1-5-32-545:(OI)(CI)M /T >nul 2>&1
)

exit /b 0
