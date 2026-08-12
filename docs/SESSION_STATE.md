# Session State

> Canonical, machine-readable/human-readable state of this project. **The repository is the source of truth, not chat context.** If any file contradicts this one, SESSION_STATE.md wins (and the contradiction must be fixed).

## Last Updated
- Date/time: 2026-08-12 (Phase 4 complete — a11y + performance verified)
- Git: local-only repo (`D:\Abhii\Projects\MemoryOS-Showcase`), branch `main`, **no remote ever**, HEAD = Phase 4 commit
- Phase: **Phase 4 complete — Phase 5 (live engine) next** (see `STATUS.md`)

## Project
- Project name: **MemoryOS Showcase** (sibling of the MemoryOS engine repo, `D:\Abhii\Projects\MemoryOS`)
- Objective: A premium product website + interactive Playground for MemoryOS — "The AI you can audit" — built per `MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md` (the spec is the contract).
- Architecture ruling: **landing page runs on `DemoMemoryEngine` (deterministic demo data) forever; the Playground runs on the real engine (`ApiMemoryEngine` → FastAPI → `memory_os`) later.** DEMO ↔ REAL is a config-level switch, never UI rewiring.

## Phase Status (details in `STATUS.md`)
| Phase | Goal | Status |
|---|---|---|
| 0 | Repo setup + docs | [x] done |
| 1 | Foundation (scaffold, tokens, engine interface, nav, hero, footer) | [x] done |
| 2 | Signature visual (MemoryCore canvas + coffee→tea narrative) | [x] done |
| 3 | Product story (7 acts) | [x] done |
| 3a | Memory globe redesign (2.5D knowledge sphere) | [x] done (replaced by 3b) |
| 3b | Memory ledger (Act 03 event-log replay) | [x] done |
| 3c | Claims-honesty audit + Act 07 use cases | [x] done |
| 3d | Back to top button (fixed bottom-right, site-wide) | [x] done |
| 3e | Ledger blank-gap fix (always-visible continuous scroll loop) | [x] done |
| 4 | Polish, a11y, performance (all §58 items verified) | [x] done |
| 5 | FastAPI + ApiMemoryEngine + live Playground (deferred) | pending |

## Decisions (current rulings, full log in `docs/DECISIONS.md`)
- S-001 Demo-data-first: landing uses deterministic `DemoMemoryEngine`; no live backend on the marketing site.
- S-002 `MemoryEngine` interface (`ingest`, `ask`, `getMemories`, `audit`) with `DemoMemoryEngine` + later `ApiMemoryEngine`; switching = config change.
- S-003 Design direction = spec's fourth direction (35% Elegant Modern Dark · 25% Aurora · 20% Hologram HUD · 20% modern interactive patterns); the three moodboards are reference ingredients only.
- S-004 Metrics honesty: only real, provenance-backed numbers (11 ms p95 · 0% contradiction · 0% leak · 97 tests — from the engine's `bench/results/acceptance.json`).
- S-005 Local-only git, no remote; **nothing pushed anywhere without explicit user approval**.
- S-006 Playground page (live engine, A/B theater, assistant-mode providers) comes AFTER the landing site.
- S-007 Nav is homepage-only: anchors + stubs (Developers/Docs/GitHub placeholders) + Playground link.
- S-011 Claims honesty: the site must never claim what the project isn't — no "open source" (repo is all-rights-reserved), no CI claims (none configured), no SDK/API-docs claims (on the roadmap; developer code block is labeled "illustrative"). Metrics come only from `acceptance.json`; footer "GitHub" points to the real public repo.
- S-010 Memory Ledger: Act 03 is a DOM-based "event log" replay (no canvas) — a deterministic ~20s ledger of the engine processing memories (INGEST → CONFLICT → SUPERSEDE → ACTIVATE → AUDIT), coffee→tea as the hero sequence, auto-scroll with hover/touch pause, blinking cursor on the active row, click a row → floating inspector, reduced-motion static. Replaced the 2.5D globe (recoverable from commit `edb2890`); ledger is real DOM text → keyboard/AT accessible, no "view as list" needed (§49). **Rev (3e): all rows are always visible** — no staged reveal, no rewind fade; the view continuously scrolls down over the run phase and back to top (content still visible) then loops. Stage can never go blank.
- S-012 Phase 4 a11y + measured performance: global `:focus-visible` ring; mobile menu Esc-close + focus return + `aria-controls`; ledger inspector focus return to source row; ledger rows name themselves (no aria-label override) and the scroll area has no redundant `role="list"` (ol provides semantics); DecisionStream resolution panel wrapped in `<dl>`; `--text-faint` → `#7a7b87` for AA contrast (DELETE/DELETED state colors follow); NO `content-visibility` on ledger rows (collapses offscreen rows to 1px — overlap bug). Measured: mobile (simulated 4G+CPU) perf 96 · a11y 100 · BP 100 · SEO 100, CLS 0, TBT 13 ms; desktop (real network) 100·100·100·100, LCP 94 ms; 0 long tasks on load; realistic scroll 0 frames > 24 ms; initial JS 230 KB gzip. Simulated LCP ~2.8 s is a throttling artifact — real network 94 ms.

## Constraints (operational)
1. Spec (`MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md`) is the design/performance contract — sections 1–70.
2. Stack: Next.js + TypeScript + Tailwind CSS + Motion + Lucide; Canvas 2D/SVG only where justified; **no WebGL, no Three.js, no GSAP** (spec §34–35, §59).
3. Performance rules: transform/opacity only, rAF, DPR ≤ 2, node caps (desktop 20–40 / mobile 8–18), IntersectionObserver + tab-visibility pauses, `prefers-reduced-motion` + manual Motion toggle, blur ≤ 12px sparingly, no preloader, static-graph fallback (spec §25–33, §55–56).
4. Accessibility: keyboard nav, focus states, semantic headings, screen-reader labels, graph has "view as list" alternative (spec §49).
5. Fonts: Space Grotesk (400–700) / Inter (400–600) / IBM Plex Mono (400–500), `font-display: swap`.
6. Metrics displayed must match real engine results; otherwise use capability labels (AUDITABLE · DETERMINISTIC · TRACEABLE · PRIVACY-AWARE).
7. The public MemoryOS repo (`D:\Abhii\Projects\MemoryOS`) is untouched by this project.

## Test / Verification Status
- `npm run build` + `npm run lint` — passing (all phases). Routes: `/` + `/playground` (static).
- Memory ledger smoke test (served HTML): 200 OK; event-log strip, CONFLICT DETECTED, coffee↔tea, AUDIT · 97 tests rows all present in server HTML (DOM content, not canvas).
- Claims-honesty smoke test: "Open source core" absent; "Where it fits", "Not a chat-log store", "Illustrative" (SDK note), "Postgres + pgvector core", "18 memories", "D3 replay suite", real GitHub link present.
- Back to top smoke test: 200 OK, `aria-label="Back to top"` present (mounted in layout, site-wide).
- Ledger blank-gap fix: all rows present in server HTML (no `opacity`/`translateY(10px)` reveal styles, no `step`/`stepShown` machinery) — the stage renders content from first paint and never blanks; continuous scroll with scroll-back loop.
- Lighthouse (Phase 4): mobile (simulated 4G + CPU throttle) perf 96 · a11y 100 · best-practices 100 · SEO 100 — CLS 0, TBT 13 ms, LCP ~2.8 s simulated (artifact); desktop (real network) 100 · 100 · 100 · 100 — LCP 94 ms. Load long-tasks: 0. Realistic scripted scroll: 0 frames > 24 ms (212 frames). Tab-order probe: logo → nav toggle → CTAs → ledger rows, all named.
- Spec §58 acceptance checklist — ALL items verified (scroll jank: none; hero responsive during animation: TBT ≤ 20 ms; offscreen/hidden-tab pauses: IO + visibilitychange in MemoryCore/HeroNarrative/ledger; reduced motion: static fallbacks verified; keyboard nav: focus-visible + Esc + focus return; CLS: 0; no React render loops: refs + direct DOM writes; bundle: 230 KB gzip initial, motion + lucide only; no full-screen WebGL: Canvas 2D only).
- Spec §58 acceptance checklist — pending (Phase 4).

## Next Actions
1. Phase 5: FastAPI service (`POST /ingest` · `POST /ask` · `GET /memory` · `GET /audit`) reusing `memory_os` from the engine repo; implement `ApiMemoryEngine` (same contract); wire `/playground` to the real engine; A/B theater; assistant-mode providers (Ollama · OpenAI · Anthropic · OpenRouter).
2. If deploying: static export/CDN (prefers Vercel — but engine repo stays local; nothing pushed without user approval).
