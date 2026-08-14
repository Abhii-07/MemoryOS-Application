# MemoryOS Application

Premium marketing site + live playground for [MemoryOS](https://github.com/Abhii-07/MemoryOS) — a Postgres-native memory engine with hybrid retrieval (BM25 + dense embeddings), supersession, provenance, and an auditable memory lifecycle.

The landing page is a self-contained Next.js site (no backend dependency). The `/playground` page connects to a live FastAPI server that wraps the real engine.

## Repository layout

```
site/    Next.js + TypeScript + Tailwind marketing site and playground UI
server/  FastAPI service (ingest / ask / chat / assist / memory / audit / healthz)
docs/    Spec mirror, decisions (S-001…), session state, status, run notes
```

The engine itself lives in its own repository: [Abhii-07/MemoryOS](https://github.com/Abhii-07/MemoryOS).

## Run locally

Prerequisites: Python 3.11+, Node 20+, PostgreSQL 17 with the pgvector extension, and (optional, for assistant/chat mode) [Ollama](https://ollama.com) with `llama3.2:latest`.

```powershell
# 1. Database — PostgreSQL on port 5433, database `memoryos`, role `memoryos`
#    (see docs/PHASE5-POSTGRES-ISSUE.md if pg_ctl fails on Windows)

# 2. API server — http://127.0.0.1:8000
cd server
pip install -r requirements.txt
.\run.ps1 -Start        # readiness = /healthz poll; -Restart / -Status / -Logs

# 3. Site — http://localhost:3000
cd site
npm install
npm run dev
```

Open `http://localhost:3000/playground`. The playground is always wired to the real engine via `ApiMemoryEngine`; the landing page uses the deterministic `DemoMemoryEngine` and never depends on the backend.

## API surface

| Endpoint | Purpose |
| --- | --- |
| `POST /ingest` | Admit a memory (ADD / UPDATE supersession) |
| `POST /ask` | Hybrid retrieval query, naive baseline included for A/B |
| `POST /chat` | Conversational loop: context-aware query rewrite, best-of retrieval, grounded answer, fact extraction |
| `POST /assist` | Single-shot grounded assistant answer |
| `GET /assist/providers` | Configured providers + active one |
| `GET /memory` · `GET /audit` | Memories and per-memory audit trail |
| `GET /healthz` | Readiness |

## Providers (assistant / chat mode)

Keys live only in `server/.env` (never client-side, never committed; `server/.env.example` is the template). The registry auto-picks the first configured provider; set `MEMORYOS_ASSIST_PROVIDER` to force one.

- **Ollama** — local, key-less, dev default (model must be present in `/api/tags`)
- **OpenRouter / OpenAI / Anthropic** — hosted, one key each

## Tests

```powershell
cd server
$env:PYTHONPATH="<engine-repo>\src;$PWD"
python -m pytest tests -q
```

The engine suite (97 tests) runs from its own repository.

## Docs

- `docs/STATUS.md` — phase-by-phase build checklist
- `docs/DECISIONS.md` — architecture rulings (S-001 … S-016)
- `docs/SESSION_STATE.md` — detailed state, verification notes, footguns
- `docs/PHASE5-POSTGRES-ISSUE.md` — Windows pg_ctl crash root cause + console-attached fix
