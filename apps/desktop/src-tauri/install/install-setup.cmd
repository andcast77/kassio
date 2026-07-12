@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "KASSIO_BACKEND_ROOT=%ROOT%\backend"
rem Data dir resolves to the per-user location (%LOCALAPPDATA%\Kassio\data) via
rem @kassio/runtime paths.ts. Per-user install runs unprivileged, so no icacls
rem grant is needed and PostgreSQL starts without the admin restriction.

"%ROOT%\node\node.exe" "%ROOT%\backend\setup.mjs"
exit /b %ERRORLEVEL%
