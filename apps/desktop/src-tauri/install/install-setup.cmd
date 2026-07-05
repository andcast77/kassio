@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "KASSIO_BACKEND_ROOT=%ROOT%\backend"
"%ROOT%\node\node.exe" "%ROOT%\backend\setup.mjs"
exit /b %ERRORLEVEL%
