# Status

> Phase-by-phase build checklist for the MemoryOS Showcase. Updated at the end of every working session/phase. `[ ]` = pending · `[x]` = done · `[~]` = in progress.

Last updated: 2026-08-11

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

## Phase 2 — Signature Visual
- [ ] `MemoryCore` hero canvas (20–30 nodes, DPR ≤ 2, cursor interpolation)
- [ ] Visibility pausing (IntersectionObserver + tab visibility)
- [ ] 4–6 s coffee→tea narrative sequence (input → extract → conflict → supersede → updated; holds final state, no loop)
- [ ] Reduced-motion fallback (static graph)
- [ ] Docs updated + committed

## Phase 3 — Product Story
- [ ] Act 02 Problem: `MemoryConversation` ("AI can generate. It still doesn't remember." + 3-weeks-later)
- [ ] Act 03 `MemoryGraph` (15–30 nodes, 6 states, hover dim, click → inspector, "view as list")
- [ ] Act 04 `DecisionStream` + "Why did this memory win?" explainer
- [ ] Act 05 Developer: `CodeExample` + `Pipeline` (single traveling particle)
- [ ] Act 06 Trust: 4 cards (Provenance · Supersession · Forgetting · Privacy)
- [ ] Real-metrics strip (11 ms · 0% · 97 — from engine acceptance.json)
- [ ] Final CTA + footer polish
- [ ] Docs updated + committed

## Phase 4 — Polish, Performance, A11y
- [ ] Section reveals, hover micro-states (±1–2 px, no magnetic/scale)
- [ ] Reduced-motion support + manual Motion On/Off control
- [ ] Keyboard/focus/screen-reader pass
- [ ] Lighthouse + CPU-throttled profiling (mid-range profile)
- [ ] Spec §58 acceptance checklist complete
- [ ] Docs updated + committed

## Phase 5 — Live Engine (deferred)
- [ ] FastAPI service (`POST /ingest` · `POST /ask` · `GET /memory` · `GET /audit`) reusing `memory_os`
- [ ] `ApiMemoryEngine` (same `MemoryEngine` contract)
- [ ] `/playground` live: real input → real engine
- [ ] A/B theater (naive baseline vs MemoryOS)
- [ ] Assistant-mode providers (Ollama · OpenAI · Anthropic · OpenRouter)
