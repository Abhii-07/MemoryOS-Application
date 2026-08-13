# run.ps1 - MemoryOS Phase 5 server lifecycle (start | stop | restart | status)
#
# The one command that replaces all guess-timing:
#   .\run.ps1 -Start     starts uvicorn, WAITS for /healthz (up to 60s), prints READY or FAIL
#   .\run.ps1 -Stop      kills the server, waits until port 8000 is released
#   .\run.ps1 -Restart   Stop + Start
#   .\run.ps1 -Status    pid + /healthz state
#   .\run.ps1 -Logs      tail of the last server run
#
# Env honoured: MEMORYOS_DB_DSN (default portable instance :5433),
#               MEMORYOS_PY (default engine venv python).
# NOTE: ASCII only in this file - PS 5.1 misreads UTF-8 no-BOM as ANSI.

param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Logs
)

$ErrorActionPreference = "Stop"
$PORT = 8000
$HEALTH_URL = "http://127.0.0.1:$PORT/healthz"
$SERVER_DIR = $PSScriptRoot
$PY = $env:MEMORYOS_PY
if (-not $PY) { $PY = "D:\Abhii\Projects\MemoryOS\implementation\MemoryOS-App\.venv\Scripts\python.exe" }
$ENGINE_SRC = "D:\Abhii\Projects\MemoryOS\implementation\MemoryOS-App\src"
$OUT = Join-Path $SERVER_DIR "uvicorn.log"
$ERR = Join-Path $SERVER_DIR "uvicorn.err.log"

function Get-ServerProcess {
    $conn = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    }
}

function Test-Health {
    try {
        $r = Invoke-RestMethod -Uri $HEALTH_URL -TimeoutSec 3 -ErrorAction Stop
        return $r.status -eq "ok"
    } catch {
        return $false
    }
}

if ($Status) {
    $p = Get-ServerProcess
    if (-not $p) { Write-Host "server: STOPPED"; exit 0 }
    $healthy = Test-Health
    Write-Host "server: RUNNING (pid $($p.Id)) | /healthz: $(if ($healthy) {'ok'} else {'down'})"
    exit 0
}

if ($Logs) {
    Write-Host "=== uvicorn.log ==="
    Get-Content $OUT -Tail 20 -ErrorAction SilentlyContinue
    Write-Host "=== uvicorn.err.log ==="
    Get-Content $ERR -Tail 20 -ErrorAction SilentlyContinue
    exit 0
}

if ($Stop -or $Restart) {
    $p = Get-ServerProcess
    if ($p) {
        Write-Host "stopping server (pid $($p.Id))..."
        Stop-Process -Id $p.Id -Force
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 500
            if (-not (Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue)) {
                break
            }
        }
        Write-Host "port $PORT released"
    } else {
        Write-Host "server not running - nothing to stop"
    }
    if (-not $Restart) { exit 0 }
}

if ($Start -or $Restart) {
    $existing = Get-ServerProcess
    if ($existing) {
        Write-Host "server already RUNNING (pid $($existing.Id)) - use -Restart"
        exit 1
    }

    if (-not (Test-Path $PY)) { Write-Host "ERROR: python not found: $PY (set MEMORYOS_PY)"; exit 1 }
    if (-not (Test-Path $ENGINE_SRC)) { Write-Host "ERROR: engine src not found: $ENGINE_SRC"; exit 1 }

    try {
        & "C:\pg17\bin\psql.exe" -p 5433 -U memoryos -d memoryos -t -c "SELECT 1" 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "psql check failed" }
    } catch {
        Write-Host "WARNING: PostgreSQL on :5433 not reachable - server will boot but /healthz stays down"
    }

    $env:PYTHONPATH = "$ENGINE_SRC;$SERVER_DIR"
    Start-Process -FilePath $PY -ArgumentList "-m", "uvicorn", "app:app", "--port", "$PORT", "--log-level", "info" -WorkingDirectory $SERVER_DIR -RedirectStandardOutput $OUT -RedirectStandardError $ERR -WindowStyle Hidden

    $ready = $false
    for ($i = 0; $i -lt 120; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Health) { $ready = $true; break }
        $p = Get-ServerProcess
        if (-not $p) {
            Write-Host "FAIL: process died during startup - err log tail:"
            Get-Content $ERR -Tail 8
            exit 1
        }
    }

    if ($ready) {
        $p = Get-ServerProcess
        Write-Host "READY: server running (pid $($p.Id)) on http://127.0.0.1:$PORT"
        exit 0
    }
    Write-Host "FAIL: /healthz never came up in 60s - err log tail:"
    Get-Content $ERR -Tail 8
    exit 1
}

Write-Host "usage: .\run.ps1 -Start | -Stop | -Restart | -Status | -Logs"