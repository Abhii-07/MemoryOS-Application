# Phase 5 — PostgreSQL 0xC0000142 Blocker

> Status: **RESOLVED** (console-attached postmaster). Owner: opencode session. Last updated: 2026-08-13.

## 1. Summary

**Goal**: Local PostgreSQL 17 + pgvector for MemoryOS Phase 5 (FastAPI service → real engine). **Original blocker**: `0xC0000142` (STATUS_DLL_INIT_FAILED) — postmaster starts cleanly, but every backend spawned via `pg_ctl` died at DLL init. **Resolution**: console-attached postmaster works (\u00a78).

## 2. Environment

| Item | Value |
|---|---|
| OS | Windows 11, build 26200 |
| PostgreSQL | 17.10 x86_64, msvc-19.44.35227 (portable zip) |
| Install dirs | `C:\pg17\` (primary), `C:\pg17-fresh\pgsql\` (re-extract) |
| Auth/data | `initdb -U memoryos -A trust -E UTF8 --no-locale` → succeeded |
| pgvector | 0.8.6 prebuilt (vector.dll, share/extension, headers) — installed OK |
| Engine venv | Python 3.14.3, psycopg 3.3.4, pgvector 0.5.0, sentence-transformers 5.7.0 |
| Security | **McAfee suite + McAfee WebAdvisor running**; Windows Defender also present. `AppInit_DLLs` empty |
| Network | EDB CDN `get.enterprisedb.com` → **CloudFront 403** for winget/curl/Invoke-WebRequest; `sbp.enterprisedb.com` getfile.jsp tokens **work** |
| Alternatives | **WSL2 present** (default v2); Docker NOT installed |
| Current live state | Postmaster PID 28460 **running**, listening on 5432, "ready to accept connections" (started 12:54; crash-on-connect not retested since clean-PATH run) |

## 3. Timeline of evidence

1. **Portable PG 17.10** extracted, pgvector copied, `initdb` OK. `pg_ctl start` → postmaster logs *"ready to accept connections"*, then first client connect → `LOG: server process (PID …) was terminated by exception 0xC0000142` → `all server processes terminated; reinitializing` → `shutting down due to startup process failure` (3 occurrences, PIDs 16916/58676/56896, `C:\pg17\pg.log`).
2. **Clean-PATH retry** (`PATH = System32;Windows;Wbem;C:\pg17\bin` only) + workdir `C:\pg17\bin` + fresh `tar` extraction to `C:\pg17-fresh\pgsql` (29 DLLs, byte-identical sizes to `C:\pg17`) → **same crash**.
3. **Key isolation test**: `postgres.exe --single -D C:\pg17\data postgres` → **works perfectly** — crash recovery completes, checkpoint runs, `PostgreSQL stand-alone backend 17.10` prompt.
4. **DLL inventory**: all deps present — `libcrypto-3-x64.dll`, `libssl-3-x64.dll`, `zlib1.dll`, `libintl-9.dll`, `libwinpthread-1.dll`, plus system `vcruntime140*.dll`/`msvcp140.dll` in System32. (Earlier "missing libssl" reading was a name mismatch: build uses `-x64` suffixes.)
5. **No WER/Application Error records** for postgres in the last 7 days.

## 4. Analysis

The failure is **not** missing DLLs, bad data dir, or broken binaries (proven by `--single`). It is specific to the **postmaster → child CreateProcess path**: postmaster spawns the backend with restricted context (NULL console handles, inherited security attributes). A DLL whose `DllMain` fails under that restricted spawn → `0xC0000142`.

**Hypotheses (ranked)**

1. **AV injection (strongest)**: McAfee (and Defender) inject into child processes via DLL injection / API hooks. Postmaster's child spawns fail at injected-DLL init; `--single` runs in *our* console context and survives. Classic 0xC0000142 signature.
2. **Console/session context**: postmaster spawned with no console / via redirected streams → CRT or ICU `DllMain` touches console → init fail.
3. **Antimalware policy**: McAfee Access Protection / Defender ASR blocking `CreateProcess` of `postgres.exe` children (would also leave no WER record).
4. **VC runtime mismatch in child**: system `msvcp140.dll` family present but possibly wrong minor version for this msvc-19.44 build (weaker: `--single` uses same DLLs).

## 5. Possible solutions (ranked)

### A. Connect-test the running server — 1 min, zero cost
Postmaster 28460 is up. A single `psql -c "SELECT 1"` decides everything: if the backend survives now, earlier failures were environmental (PATH/workdir), Phase 5 proceeds immediately. **Do this first.**

### B. AV exclusion test — 5 min, diagnostic
Temporarily disable McAfee real-time protection (+ Defender via ASR exclusion for `C:\pg17\bin\postgres.exe`), retest connect. Crash gone → confirm Hypothesis 1 → add permanent exclusions. This is the cheapest way to pin the root cause.

### C. Install official EDB PostgreSQL — ~15 min, highest success probability
The dead path was `get.enterprisedb.com` (CloudFront 403, geo/WAF). But `sbp.enterprisedb.com` tokens **work** (proven: 333 MB binaries zip downloaded). The installer `.exe` tokens are the large fileids mined from the downloads page HTML (350–376 MB range). Plan: identify correct token by PE-header/Content-Length matching or mining the page's embedded RSC payload, download installer, silent-install (`/S --superpassword=... --servicename=postgresql-x64-17`), let it register a proper Windows service (fixes console/session context + keeps service-based spawn, which AV handles better), copy pgvector into `C:\Program Files\PostgreSQL\17`, `CREATE ROLE memoryos` + DB + extension. Then re-verify engine.

### D. WSL2 PostgreSQL — ~15 min, most robust
WSL2 already present. `wsl --install -d Ubuntu` (or existing distro), `apt install postgresql-17 postgresql-17-pgvector` (PGDG repo), bind 5432; build 26200 exposes WSL2 localhost to Windows by default. Engine venv on Windows connects over `localhost:5432` — no Windows-side Postgres at all. Bypasses every Windows DLL/AV/session issue. **Best plan B if A+B fail.**

### E. Docker Desktop + `postgres:17-pgvector` container
Needs Docker Desktop install first (bigger lift, WSL2 backend). Equivalent outcome to D with more moving parts. Only if D uncomfortable.

### F. Run portable PG as registered Windows service
`pg_ctl register` → service session spawns backends differently (separate window station). Cheap try; may dodge Hypothesis 2. Marginal chance but 2 min cost.

### G. Older portable PG (16.x)
Different MSVC build may not exhibit the failing DllMain. Costs a download + re-setup; pgvector 0.8.6 supports PG16. Medium effort, uncertain payoff.

### H. Stub-first for Phase 5 (unblock path, do in parallel)
Build `server/` FastAPI + `ApiMemoryEngine` + live `/playground` against an in-memory stub store **now**; swap real engine in once any DB option lands. Decouples all Phase 5 UI work from this blocker.

### I. Deep diagnostic (only if all above fail)
ProcDump on the dying backend (`procdump -e 1 -x` with gflags), ProcMon CreateProcess filter to see injected DLLs, check McAfee event logs. Highest effort, only to justify a workaround or an upstream bug report.

## 6. Recommended sequence

1. **A** (connect test) → if OK: proceed straight to engine verify (apply_schema → 0.8.6 → admit/ask smoke) → FastAPI + playground. Done.
2. If A crashes: **B** (AV off/exclusion retest) → confirms root cause in minutes.
3. If AV-confirmed: **C** (EDB installer via sbp token) → service-based Postgres is the permanent fix; keep AV exclusions.
4. If C blocked (token hunt fails): **D** (WSL2 Postgres) — practically guaranteed to work.
5. **H running in parallel** regardless, so Phase 5 UI isn't held hostage — engine swap is a config change (`ApiMemoryEngine` DSN toggle).

## 8. Resolution (2026-08-13)

**What actually fixed it — console-attached postmaster.** Started via an interactive
`Start-Process -WindowStyle Normal` (foreground console attached), the postmaster
spawns working backends on port 5433:

```
startup  com: postgres -D C:\pg17\data   (data dir reused from the failed 5432 experiments)
connect  5433 psql -> SELECT 1 -> OK
vector   CREATE EXTENSION vector -> 0.8.6
engine   MemoryStore.apply_schema() -> 0.8.6 ; admit + hybrid search green ; 97/97 tests pass
```

**Relevant findings along the way**

1. `pg_ctl` (detached, console-less) child spawn → `0xC0000142`, consistently.
   `Start-Process` with an attached console → backends live. Supports Hypothesis 2
   (console/session context) over Hypothesis 1 (AV): `--single` also worked, and
   the dividing line is the console, not the AV. AV exclusions were never needed.
2. EDB installer path (solution C) is dead on this network: `get.enterprisedb.com`
   returns CloudFront 403 for every client (winget included). `sbp` token URLs
   work but only for the binaries zip; we never needed the installer.
3. **Probe-script footgun** (phantom psycopg breakage): an old benchmark script
   named `bisect.py` (imports `memory_os.db.store`) sat in
   `C:\Users\CR7\AppData\Local\Temp\opencode\`. Running any script from that
   directory put it first on `sys.path[0]`, so `psycopg_binary`'s compiled `pq`
   module did `import bisect` → loaded the *fake* bisect → `ModuleNotFoundError:
   memory_os` → psycopg reported "couldn't import psycopg 'binary' implementation".
   The retriever itself was never broken. Remedy: stray probes moved to
   `Temp\opencode\scripts\`, out of sys.path.

**Running state (dev profile)**

| Item | Value |
|---|---|
| Port | 5433 (5432 abandoned — crashed detached instance) |
| Start command | `Start-Process C:\pg17\bin\postgres.exe -ArgumentList '-D C:\pg17\data' -WindowStyle Normal` (console-attached) |
| Auth | `memoryos` / trust · DB `memoryos` · vector 0.8.6 |
| Server | FastAPI on :8000, managed by `server/run.ps1 -Restart/-Status` (polls `/healthz`) |
| Caveat | Console-attached instance exits with the owning session — durable options (pg_ctl register service / WSL2) remain documented above if a reboot-persistent server is needed |

## 7. Artifacts

- Crash log: `C:\pg17\pg.log` (3× `0xC0000142`)
- Portable trees: `C:\pg17\`, `C:\pg17-fresh\pgsql\`
- Downloads: `C:\Users\CR7\AppData\Local\Temp\opencode\postgresql-17.10-2-binaries.zip`, `...\pg17-binaries.zip` (333 MB, same build), `...\vector.v0.8.6-pg17.zip`
- Engine venv: `D:\Abhii\Projects\MemoryOS\implementation\MemoryOS-App\.venv`
