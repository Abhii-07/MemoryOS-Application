# run.ps1 - MemoryOS Phase 5 server lifecycle (start | stop | restart | status | logs)
#
#   .\run.ps1 -Restart  Stop + Start (shown in phases, no guess-timing:
#                       /healthz poll decides readiness, not sleep arithmetic)
#   .\run.ps1 -Start / -Stop / -Status / -Logs
#
# Env honoured: MEMORYOS_DB_DSN (default portable instance :5433),
#               MEMORYOS_PY (default engine venv python).
# Logs are per-run (uvicorn.<pid>.log) so a restart never blocks on a stale
# file lock. NOTE: ASCII only - PS 5.1 misreads UTF-8 no-BOM as ANSI.

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
$latest = { Get-ChildItem (Join-Path $SERVER_DIR "uvicorn.*.log") -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 2 }

function Get-ServerProcess {
    $conn = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
    if ($conn) { Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue }
}

function Test-Health {
    try {
        $r = Invoke-RestMethod -Uri $HEALTH_URL -TimeoutSec 3 -ErrorAction Stop
        return $r.status -eq "ok"
    } catch { return $false }
}

if ($Status) {
    $p = Get-ServerProcess
    if (-not $p) { Write-Host "server: STOPPED"; exit 0 }
    $healthy = Test-Health
    Write-Host "server: RUNNING (pid $($p.Id)) | /healthz: $(if ($healthy) {'ok'} else {'down'})"
    exit 0
}

if ($Logs) {
    $files = & $latest
    if (-not $files) { Write-Host "no log files yet"; exit 0 }
    foreach ($f in $files) {
        Write-Host "=== $($f.Name) (tail) ==="
        Get-Content $f.FullName -Tail 30 -ErrorAction SilentlyContinue
    }
    exit 0
}

if ($Stop -or $Restart) {
    $p = Get-ServerProcess
    if ($p) {
        Write-Host "stopping server (pid $($p.Id))..."
        Stop-Process -Id $p.Id -Force
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Milliseconds 250
            if (-not (Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue)) {
                break
            }
        }
        $still = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
        if ($still) { Write-Host "WARNING: port $PORT still held after 5s" } else { Write-Host "port $PORT released" }
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
        Write-Host "pg :5433 reachable"
    } catch {
        Write-Host "WARNING: PostgreSQL on :5433 not reachable - server will boot but /healthz stays down"
    }

    $env:PYTHONPATH = "$ENGINE_SRC;$SERVER_DIR"
    $stamp = Get-Date -Format "HHmmss"
    $OUT = Join-Path $SERVER_DIR "uvicorn.$stamp.log"
    $ERR = Join-Path $SERVER_DIR "uvicorn.$stamp.err.log"

    Write-Host "spawning uvicorn (logs $OUT)..."
    # Start-Process (shell-exec, own hidden console): the server never holds
    # the caller's stdout pipes, so the invoking shell returns immediately.
    # (.NET CreateNoWindow alternative PASSES the parent's std handles to the
    # child - that kept the agent shell "stuck until timeout" on every run.)
    Start-Process -FilePath $PY -ArgumentList "-m", "uvicorn", "app:app", "--port", "$PORT", "--log-level", "info" -WorkingDirectory $SERVER_DIR -RedirectStandardOutput $OUT -RedirectStandardError $ERR -WindowStyle Hidden

    Write-Host "waiting for /healthz (up to 60s)..."
    $ready = $false
    for ($i = 0; $i -lt 120; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Health) { $ready = $true; break }
        $p = Get-ServerProcess
        if (-not $p) {
            Write-Host "FAIL: process died during startup - err log tail:"
            Get-Content $ERR -Tail 8 -ErrorAction SilentlyContinue
            exit 1
        }
    }

    if ($ready) {
        $p = Get-ServerProcess
        Write-Host "READY: server running (pid $($p.Id)) on http://127.0.0.1:$PORT"
        exit 0
    }
    Write-Host "FAIL: /healthz never came up in 60s - err log tail:"
    Get-Content $ERR -Tail 8 -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "usage: .\run.ps1 -Start | -Stop | -Restart | -Status | -Logs"