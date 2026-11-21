# ViralClip AI Studio — One-Click Local Launcher (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting ViralClip AI Studio Backend (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Cyan
$BackendProc = Start-Process -FilePath "$Root\backend\.venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" `
    -WorkingDirectory "$Root\backend" -PassThru

Write-Host "Starting ViralClip AI Studio Frontend (Vite on http://127.0.0.1:5173)..." -ForegroundColor Green
$FrontendProc = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory "$Root\frontend" -PassThru

Write-Host ""
Write-Host "ViralClip AI Studio is running!" -ForegroundColor Yellow
Write-Host "  Dashboard UI : http://127.0.0.1:5173"
Write-Host "  Backend API  : http://127.0.0.1:8000/docs"
Write-Host "Press Enter to stop both servers..."
Read-Host | Out-Null

Stop-Process -Id $BackendProc.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $FrontendProc.Id -Force -ErrorAction SilentlyContinue

