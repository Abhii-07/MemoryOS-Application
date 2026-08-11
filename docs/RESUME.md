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
- Local-only git, no remote. **Never push anything anywhere without explicit user approval.**
- No WebGL, Three.js, GSAP, or heavy animation deps.
- Real metrics only (11 ms · 0% · 97 tests, from engine `acceptance.json`).
- Update `docs/SESSION_STATE.md` + `docs/STATUS.md` at the end of every session.
- The public MemoryOS repo (`D:\Abhii\Projects\MemoryOS`) is untouched.

## Current state (2026-08-11)
- Step 0 complete: git init, `.gitignore`, full `docs/` mirror, spec + moodboards preserved.
- Phase 1 (Foundation) in progress — scaffold `site/`, tokens, fonts, engine interface + demo engine, nav, hero, footer.

## Where the project is heading
- Phase 2 — `MemoryCore` hero canvas + coffee→tea signature sequence.
- Phase 3 — the 7 acts (problem, graph, decision stream, developer, trust, final CTA).
- Phase 4 — polish/performance/a11y + spec §58 checklist.
- Phase 5 — FastAPI service, `ApiMemoryEngine`, live Playground + A/B theater + assistant-mode providers.
