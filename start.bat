@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Start Two Systems

REM Always run in a persistent cmd window to avoid instant close on double-click.
if /I "%~1"=="__IN_CONSOLE__" goto :MAIN
start "Start Two Systems" "%ComSpec%" /k "\"%~f0\" __IN_CONSOLE__"
exit /b 0

:MAIN

set "ROOT=%~dp0"
echo [INFO] Workspace: %ROOT%
echo.

pushd "!ROOT!" 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot access workspace folder.
  goto :DONE
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH.
  goto :DONE
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found in PATH.
  goto :DONE
)

if not exist "!ROOT!server\package.json" (
  echo [ERROR] Missing: !ROOT!server\package.json
  goto :DONE
)
if not exist "!ROOT!web\package.json" (
  echo [ERROR] Missing: !ROOT!web\package.json
  goto :DONE
)

set "LOGISTICS_DIR=!ROOT!"
set "ADMIN_DIR="
set "ALT_LOGISTICS_DIR="

for /d %%D in ("!ROOT!*") do (
  if /I not "%%~nxD"=="server" if /I not "%%~nxD"=="web" if /I not "%%~nxD"=="node_modules" if /I not "%%~nxD"==".cursor" (
    if exist "%%~fD\server\package.json" if exist "%%~fD\web\package.json" (
      if exist "%%~fD\server\src\index.ts" (
        findstr /I /C:"LOGISTICS_API" "%%~fD\server\src\index.ts" >nul 2>&1
        if not errorlevel 1 (
          set "ADMIN_DIR=%%~fD"
        ) else (
          if not defined ALT_LOGISTICS_DIR set "ALT_LOGISTICS_DIR=%%~fD"
        )
      ) else (
        if not defined ALT_LOGISTICS_DIR set "ALT_LOGISTICS_DIR=%%~fD"
      )
    )
  )
)

if not defined ADMIN_DIR (
  echo [ERROR] Cannot find admin system folder.
  echo [HINT] Admin server\src\index.ts should include LOGISTICS_API.
  goto :DONE
)

if not exist "!ROOT!server\src\index.ts" (
  if defined ALT_LOGISTICS_DIR set "LOGISTICS_DIR=!ALT_LOGISTICS_DIR!"
)

echo [INFO] Logistics system: !LOGISTICS_DIR!
echo [INFO] Admin system: !ADMIN_DIR!
echo.

call :START_NODE_APP "logistics-server" "!LOGISTICS_DIR!\server"
call :START_NODE_APP "logistics-web" "!LOGISTICS_DIR!\web"
call :START_NODE_APP "admin-server" "!ADMIN_DIR!\server"
call :START_NODE_APP "admin-web" "!ADMIN_DIR!\web"

timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"
start "" "http://localhost:5183"

echo.
echo [OK] Start commands sent.
echo [INFO] If a service fails, check its command window for the exact error.
echo.
echo Press any key to close this launcher window.

:DONE
echo.
pause
popd >nul 2>&1
endlocal
exit /b 0

:START_NODE_APP
set "APP_TITLE=%~1"
set "APP_DIR=%~2"

if not exist "!APP_DIR!\package.json" (
  echo [WARN] Skip !APP_TITLE!: package.json not found in "!APP_DIR!"
  goto :EOF
)

start "!APP_TITLE!" /D "!APP_DIR!" cmd /k "if not exist node_modules (echo [!APP_TITLE!] node_modules missing, running npm i... && npm i) else (echo [!APP_TITLE!] node_modules found.) && echo [!APP_TITLE!] running npm run dev... && npm run dev || (echo. && echo [!APP_TITLE!] FAILED. Fix error above and rerun start.bat.)"
goto :EOF

