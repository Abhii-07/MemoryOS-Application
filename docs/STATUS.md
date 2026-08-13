# Status

> Phase-by-phase build checklist for the MemoryOS Showcase. Updated at the end of every working session/phase. `[ ]` = pending · `[x]` = done · `[~]` = in progress.

Last updated: 2026-08-13

## Phase 0 — Repo Setup (done)
- [x] `git init` local-only (`main`, no remote)
- [x] `.gitignore`
- [x] `docs/` full mirror (SESSION_STATE, STATUS, PROJECT_MEMORY, DECISIONS, RESUME, SETUP_AND_RUN)
- [x] Spec + moodboards preserved at repo root

## Phase 1 — Foundation (done)
- [x] Scaffold `site/` (Next.js + TypeScript + Tailwind, App Router)
- [x] Dependencies: `motion`, `lucide-react` only
- [x] Design tokens (§53) → Tailwind theme (`--background`, `--surface`, `--primary`, …)
- [x] Fonts: Space Grotesk / Inter / IBM Plex Mono (limited weights, `font-display: swap`)
- [x] `lib/engine/MemoryEngine.ts` interface (`ingest`, `ask`, `getMemories`, `audit`)
- [x] `lib/engine/DemoMemoryEngine.ts` (deterministic dataset)
- [x] `lib/engine/config.ts` (DEMO ↔ REAL switch) + `ApiMemoryEngine` stub (Phase 5)
- [x] `lib/demo-data/scenarios.ts` (supersession · contradiction · cold-start · PII · lineage delete)
- [x] `components/navigation/Navbar.tsx` (glass pill on scroll; anchors + stubs + Playground)
- [x] Hero section (copy + 2 CTAs, real metrics strip, no animation yet)
- [x] Footer
- [x] `/playground` stub page
- [x] Build + lint pass (`npm run build`, `npm run lint`)
- [x] Docs updated + committed

## Phase 2 — Signature Visual (done)
- [x] `MemoryCore` hero canvas (24 desktop / 12 mobile nodes, DPR ≤ 2 / ≤ 1.5, cursor lerp ~0.05 + gentle push, soft radial highlight, precomputed edge pairs)
- [x] Visibility pausing (IntersectionObserver + tab visibility) for canvas and narrative
- [x] 4–6 s coffee→tea narrative sequence (input → extract → conflict → supersede → updated → query → answer; holds final state, restarts after long pause only)
- [x] Reduced-motion fallback: static SVG graph + static narrative final state
- [x] Manual Motion On/Off control (footer toggle, persisted; `lib/motion/motion-context.tsx`)
- [x] Docs updated + committed

## Phase 3 — Product Story (done)
- [x] Act 02 Problem: `MemoryConversation` ("AI can generate. It still doesn't remember." — without-memory vs with-MemoryOS, 3-weeks-later, "That is memory.")
- [x] Act 03 `MemoryGraph` (20 nodes / 30 edges, 6 states, hover → tooltip + dim, click → inspector, "view as list", state legend)
- [x] Act 04 `DecisionStream` + "Why did this memory win?" resolution explainer
- [x] Act 05 Developer: `CodeExample` + `Pipeline` (single traveling particle, reduced-motion aware)
- [x] Act 06 Trust: 4 interactive cards (Provenance · Supersession · Forgetting · Privacy)
- [x] Real-metrics band (11 ms · 0% · 97) + capability labels — from engine acceptance benchmark
- [x] Final CTA (slow ambient glow only) + anchor map (#product #how-it-works #developers)
- [x] Docs updated + committed

## Phase 4 — Polish, Performance, A11y (done)
- [x] Section reveals (Reveal — opacity/transform only, one-shot, §52), hover micro-states ±1–2 px only (color/border/opacity/1px translate; no scale, no magnetic — §51)
- [x] Reduced-motion support (static fallbacks: hero SVG, narrative final state, ledger static, Reveal static, CSS override) + manual Motion On/Off control (footer toggle, persisted)
- [x] Keyboard/focus/screen-reader pass: global `:focus-visible` ring; mobile menu Esc-close + focus return + `aria-controls`; ledger inspector focus return to source row; ledger row accessible names from visible text; `ol` list semantics (no redundant `role="list"`); DecisionStream resolution panel wrapped in `<dl>`; `--text-faint` → `#7a7b87` (AA); DELETE/DELETED state colors match; hero canvas + narrative `aria-hidden` (decorative, equivalent content elsewhere); heading order h1→h2→h3; tab-order probe clean
- [x] Lighthouse + CPU-throttled profiling: mobile (simulated 4G + CPU) perf 96 · a11y 100 · best-practices 100 · SEO 100, CLS 0, TBT 13 ms; desktop (real network) 100 · 100 · 100 · 100, LCP 94 ms; load long-tasks 0; realistic scripted scroll 0 frames > 24 ms; initial JS 230 KB gzip total (motion + lucide only)
- [x] Spec §58 acceptance checklist — all items verified (see SESSION_STATE)
- [x] Docs updated + committed

## Phase 5 — Live Engine (done, except assistant-mode providers)
- [x] PostgreSQL blocker resolved — portable PG 17.10 + pgvector 0.8.6 running console-attached on `:5433` (root cause + fix: `docs/PHASE5-POSTGRES-ISSUE.md`)
- [x] Engine verified against real DB: smoke (ADD/UPDATE supersession, hybrid retrieval) + full 97-test suite green
- [x] FastAPI service (`POST /ingest` · `POST /ask` · `GET /memory` · `GET /audit` · `GET /healthz`) reusing `memory_os` — `server/app.py` + `server/mapping.py` + `server/run.ps1` (readiness-polled lifecycle, no guess-timing)
- [x] `ApiMemoryEngine` (same `MemoryEngine` contract) — `site/lib/engine/ApiMemoryEngine.ts`
- [x] `/playground` live: real input → real engine (3 panels: Message · Ask · Memories+audit)
- [x] A/B theater (naive no-memory baseline vs MemoryOS) in the Ask panel
- [ ] Assistant-mode providers (Ollama · OpenAI · Anthropic · OpenRouter) — deferred, keys via `.env` only
