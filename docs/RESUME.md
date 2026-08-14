# Resume

> Continuity document: where things stand, how to pick the project back up after any break. Read `SESSION_STATE.md` + `STATUS.md` first; this is the short version.

## One-line summary
Premium Next.js marketing site (deterministic demo engine) + future live Playground for the MemoryOS memory engine, per the 70-section spec in the repo root.

## Pick-up instructions (fresh session)
1. Read `MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md` — it is the contract (design + performance, §1–70).
2. Read `docs/SESSION_STATE.md` → `docs/STATUS.md` (where we are) → `docs/DECISIONS.md` (rulings).
3. Read `docs/PROJECT_MEMORY.md` for architecture and the `MemoryEngine` contract.
4. Work in `site/` (Next.js). Run: `npm run dev` / `npm run build`.
5. Landing page must NEVER depend on a backend — `DemoMemoryEngine` only.

## Ground rules (non-negotiable)
- Git stays local-only until user-approved; **never push anywhere without explicit user approval.** (S-016 approval recorded 2026-08-14: push to `Abhii-07/memoryos-portal`, public — gh auth still pending.)
- No WebGL, Three.js, GSAP, or heavy animation deps.
- Real metrics only (11 ms · 0% · 97 tests, from engine `acceptance.json`).
- Update `docs/SESSION_STATE.md` + `docs/STATUS.md` at the end of every session.
- The public MemoryOS repo (`D:\Abhii\Projects\MemoryOS`) is untouched.

## Current state (2026-08-14)
- Phases 0–4 complete: scaffold, tokens, engine interface + demo engine, nav, hero (MemoryCore canvas + coffee→tea narrative), 7-act product story (memory ledger, decision stream, developer, trust, use cases, final CTA), back-to-top, claims-honesty pass.
- Phase 4 (a11y + performance) verified: Lighthouse mobile 96/100/100/100 · desktop 100/100/100/100, CLS 0, no long tasks, no scroll jank; §58 checklist all green.
- Phase 5 (live engine + assistant providers) done: PostgreSQL 0xC0000142 resolved (console-attached postmaster, `:5433`, pgvector 0.8.6), engine verified (smoke + 97/97 tests), FastAPI `server/` (`POST /ingest` · `/ask` · `/memory` · `/audit` · `/assist` · `/assist/providers` · `/healthz`, `run.ps1` lifecycle), `ApiMemoryEngine` implemented, `/playground` live (4 panels: Message · Ask with A/B theater · Chat · Memories+audit). Providers: Ollama (dev, key-less, needs pulled model) + OpenRouter/OpenAI/Anthropic (cloud, keys via `server/.env` only).
- Phase 6 (chat loop) done: `POST /chat` (S-014/S-015) — context-aware LLM query rewrite (double-draw, best-of with prior user texts), grounded never-invent answers (own previous replies excluded from transcript), confirm-to-remember extraction, `ChatPanel.tsx` UI. 12 unit tests green + live probe verified.
- To run locally: start PG (console-attached postmaster on :5433) → `server/run.ps1 -Start` → `site`: `npm run dev`. Playground is always the real engine; landing page stays `DemoMemoryEngine`. Assistant/chat answers: Ollama on :11434 with `llama3.2:latest` (or set `MEMORYOS_OLLAMA_MODEL` / a cloud provider key in `server/.env`).

## Where the project is heading
- Deployment decision pending — cloud providers need keys in `server/.env` (Ollama local only); DB/API/site hosts up to user.
- Push to GitHub pending user `gh auth login` (S-016): `gh repo create Abhii-07/memoryos-portal --public --source D:\Abhii\Projects\MemoryOS-Showcase --push`.
- Known local quirk: after `run.ps1 -Start/-Restart`, agent shells may appear "stuck until timeout" — the spawned server is detached and healthy; the wait is a Windows handle-inheritance artifact of the invoking shell, not a server fault.
