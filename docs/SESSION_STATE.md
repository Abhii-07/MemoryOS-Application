# Session State

> Canonical, machine-readable/human-readable state of this project. **The repository is the source of truth, not chat context.** If any file contradicts this one, SESSION_STATE.md wins (and the contradiction must be fixed).

## Last Updated
- Date/time: 2026-08-11 (project kickoff)
- Git: local-only repo (`D:\Abhii\Projects\MemoryOS-Showcase`), branch `main`, **no remote ever**
- Phase: **Step 0 complete — Phase 1 in progress** (see `STATUS.md`)

## Project
- Project name: **MemoryOS Showcase** (sibling of the MemoryOS engine repo, `D:\Abhii\Projects\MemoryOS`)
- Objective: A premium product website + interactive Playground for MemoryOS — "The AI you can audit" — built per `MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md` (the spec is the contract).
- Architecture ruling: **landing page runs on `DemoMemoryEngine` (deterministic demo data) forever; the Playground runs on the real engine (`ApiMemoryEngine` → FastAPI → `memory_os`) later.** DEMO ↔ REAL is a config-level switch, never UI rewiring.

## Phase Status (details in `STATUS.md`)
| Phase | Goal | Status |
|---|---|---|
| 0 | Repo setup + docs | [x] done |
| 1 | Foundation (scaffold, tokens, engine interface, nav, hero, footer) | in progress |
| 2 | Signature visual (MemoryCore canvas + coffee→tea narrative) | pending |
| 3 | Product story (7 acts) | pending |
| 4 | Polish, a11y, performance | pending |
| 5 | FastAPI + ApiMemoryEngine + live Playground (deferred) | pending |

## Decisions (current rulings, full log in `docs/DECISIONS.md`)
- S-001 Demo-data-first: landing uses deterministic `DemoMemoryEngine`; no live backend on the marketing site.
- S-002 `MemoryEngine` interface (`ingest`, `ask`, `getMemories`, `audit`) with `DemoMemoryEngine` + later `ApiMemoryEngine`; switching = config change.
- S-003 Design direction = spec's fourth direction (35% Elegant Modern Dark · 25% Aurora · 20% Hologram HUD · 20% modern interactive patterns); the three moodboards are reference ingredients only.
- S-004 Metrics honesty: only real, provenance-backed numbers (11 ms p95 · 0% contradiction · 0% leak · 97 tests — from the engine's `bench/results/acceptance.json`).
- S-005 Local-only git, no remote; **nothing pushed anywhere without explicit user approval**.
- S-006 Playground page (live engine, A/B theater, assistant-mode providers) comes AFTER the landing site.
- S-007 Nav is homepage-only: anchors + stubs (Developers/Docs/GitHub placeholders) + Playground link.

## Constraints (operational)
1. Spec (`MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md`) is the design/performance contract — sections 1–70.
2. Stack: Next.js + TypeScript + Tailwind CSS + Motion + Lucide; Canvas 2D/SVG only where justified; **no WebGL, no Three.js, no GSAP** (spec §34–35, §59).
3. Performance rules: transform/opacity only, rAF, DPR ≤ 2, node caps (desktop 20–40 / mobile 8–18), IntersectionObserver + tab-visibility pauses, `prefers-reduced-motion` + manual Motion toggle, blur ≤ 12px sparingly, no preloader, static-graph fallback (spec §25–33, §55–56).
4. Accessibility: keyboard nav, focus states, semantic headings, screen-reader labels, graph has "view as list" alternative (spec §49).
5. Fonts: Space Grotesk (400–700) / Inter (400–600) / IBM Plex Mono (400–500), `font-display: swap`.
6. Metrics displayed must match real engine results; otherwise use capability labels (AUDITABLE · DETERMINISTIC · TRACEABLE · PRIVACY-AWARE).
7. The public MemoryOS repo (`D:\Abhii\Projects\MemoryOS`) is untouched by this project.

## Test / Verification Status
- `npm run build` + `npm run dev` — in progress (Phase 1).
- Spec §58 acceptance checklist — pending (Phase 4).

## Next Actions
1. Scaffold `site/` (create-next-app: TS, Tailwind, App Router).
2. Install only `motion` + `lucide-react`.
3. Design tokens (§53) → Tailwind theme; fonts wired.
4. `lib/engine/MemoryEngine.ts` + `DemoMemoryEngine.ts` + `lib/demo-data/scenarios.ts`.
5. Navbar, hero, footer, `/playground` stub.
6. Update SESSION_STATE/STATUS + commit.
