# Setup and Run

> How to run the full MemoryOS Application **100% locally**: landing page + live Playground (Postgres + API + Ollama). Phase 5/6 complete — the playground is the real engine.

## Repository layout
```
MemoryOS-Application/
├── docs/                                       ← SESSION_STATE · STATUS · PROJECT_MEMORY · DECISIONS · RESUME
├── site/                                       ← Next.js application (marketing + playground)
└── server/                                     ← FastAPI service (engine wrapper + chat/assist)
```
The engine itself is a separate repo: `D:\Abhii\Projects\MemoryOS` (public: Abhii-07/MemoryOS).

## Components
| Component | Path / how | Port |
| --- | --- | --- |
| PostgreSQL 17 + pgvector | `C:\pg17\` portable, console-attached postmaster | 5433 |
| Ollama (chat/assist only) | tray app or `ollama serve` | 11434 |
| FastAPI server | `server/run.ps1 -Start` | 8000 |
| Next.js site | `site/` → `npm run dev` | 3000 |

Landing page (`/`) needs only the site. `/playground` needs site + API + PG; the Chat/Assist panels additionally need Ollama with a pulled model.

---

## A. Daily run (machine already set up) — in order

### 1. PostgreSQL — keep the window open
```powershell
C:\pg17\bin\postgres.exe -D C:\pg17\data
```
Console-attached is the only reliable mode on this box (`pg_ctl`/service spawns die with 0xC0000142 — see `docs/PHASE5-POSTGRES-ISSUE.md`). Verify (new terminal):
```powershell
C:\pg17\bin\pg_isready.exe -p 5433
# → ":5433 - accepting connections"
```
If it says "another one might be running" — a postmaster is already up; skip.

### 2. Ollama — only for Chat / Assist panels
Skip if the tray app is running. Otherwise:
```powershell
ollama serve
```
Verify: `ollama list` → must show `llama3.2:latest` (if missing: `ollama pull llama3.2`).

### 3. API server
```powershell
cd D:\Abhii\Projects\MemoryOS-Showcase\server
.\run.ps1 -Start
```
- Wait for `READY: server running (pid ...) on http://127.0.0.1:8000`
- Verify: `.\run.ps1 -Status` → `RUNNING | /healthz: ok`
- Already running → prints "server already RUNNING — use -Restart"; fine.
- **No `.env` needed for local Ollama mode.** `server/.env` (copy of `.env.example`, gitignored) is only required for hosted providers (OpenRouter/OpenAI/Anthropic keys).
- Note: when run from an agent shell the command may look "stuck" after READY — a Windows pipe quirk of the invoking shell, not a server fault. The server is detached and healthy; `run.ps1 -Status` confirms.

### 4. Site
```powershell
cd D:\Abhii\Projects\MemoryOS-Showcase\site
npm run dev
```
Open http://localhost:3000

### 5. Use it
- `/` landing page — standalone (deterministic `DemoMemoryEngine`, no backend).
- `/playground` — real engine (hard-wired `ApiMemoryEngine`), 4 panels:
  - **Message** — ingest facts (needs API + PG only)
  - **Ask** — retrieval + A/B theater naive-vs-MemoryOS (needs API + PG only)
  - **Chat** — needs Ollama. Try: "I drink chai every morning" → click the "remember?" chip → "what do I drink now?" → grounded answer with evidence
  - **Memories** — ledger + per-memory audit trail

### 6. Stop (reverse order)
1. Site terminal: `Ctrl+C`
2. `cd D:\Abhii\Projects\MemoryOS-Showcase\server; .\run.ps1 -Stop`
3. PG + Ollama windows: `Ctrl+C` (or leave running)

---

## B. Fresh machine (first-time setup, once)

### Prerequisites
- Python 3.11+, Node 20+, Git, [Ollama](https://ollama.com)
- PostgreSQL 17 with pgvector (portable install fine)

### 1. Clone
```powershell
git clone https://github.com/Abhii-07/MemoryOS-Application.git
git clone https://github.com/Abhii-07/MemoryOS.git
```

### 2. Engine + server deps (shared venv)
```powershell
cd MemoryOS\implementation\MemoryOS-App
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt

cd ..\..\..\MemoryOS-Application\server
..\..\MemoryOS\implementation\MemoryOS-App\.venv\Scripts\pip install -r requirements.txt
```

### 3. Site
```powershell
cd ..\site
npm install
```

### 4. Ollama
```powershell
ollama pull llama3.2
```

### 5. PostgreSQL
```powershell
# init (once)
C:\pg17\bin\initdb.exe -D C:\pg17\data
# set port = 5433 in C:\pg17\data\postgresql.conf (append; it is appended on this machine)
# create role + db
C:\pg17\bin\postgres.exe -D C:\pg17\data   # console-attached; leave open
C:\pg17\bin\psql.exe -p 5433 -d postgres -c "CREATE ROLE memoryos LOGIN;"
C:\pg17\bin\psql.exe -p 5433 -U memoryos -d postgres -c "CREATE DATABASE memoryos OWNER memoryos;"
C:\pg17\bin\psql.exe -p 5433 -U memoryos -d memoryos -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 6. Run
Follow Section A steps 3–5 (daily run).

---

## Tests & verification
```powershell
# server unit tests (chat/rewrite/extraction/sessions) — run from server dir
cd D:\Abhii\Projects\MemoryOS-Showcase\server
$env:PYTHONPATH="D:\Abhii\Projects\MemoryOS\implementation\MemoryOS-App\src;$PWD"
& "D:\Abhii\Projects\MemoryOS\implementation\MemoryOS-App\.venv\Scripts\python.exe" -m pytest tests -q

# frontend
cd ..\site
npm run build
npm run lint
```
Engine's own suite (97 tests) runs from the engine repo.

## Commits (local-only git unless approved)
```powershell
git add -A
git commit -m "feat: ..."
git push   # only after explicit user approval (S-016 governs; origin = Abhii-07/MemoryOS-Application)
```
> `.env`, logs, caches, the design spec, and moodboards are gitignored — never commit secrets.
