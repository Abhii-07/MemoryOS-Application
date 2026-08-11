# Decisions

> Ruling log for the MemoryOS Showcase project. Append-only. Each entry: ID, date, ruling, rationale. Reversing a decision requires a new entry.

## S-001 — Demo-data first for the landing page
**Date:** 2026-08-11
**Ruling:** The landing page runs on a deterministic `DemoMemoryEngine`; no live backend is wired into the marketing site, now or later.
**Rationale:** The website is a product experience, not a console. Deterministic demo = fast, reliable, reproducible, deployable independently, immune to backend/database outages. The spec itself describes a narrative demonstration.

## S-002 — MemoryEngine abstraction (Demo / Api)
**Date:** 2026-08-11
**Ruling:** All memory access flows through a single `MemoryEngine` interface — `ingest(input): Promise<MemoryEvent[]>`, `ask(query): Promise<MemoryResponse>`, `getMemories(): Promise<Memory[]>`, `audit(memoryId): Promise<AuditEvent[]>` — with `DemoMemoryEngine` and later `ApiMemoryEngine` implementing it. DEMO ↔ REAL is a configuration-level switch (`lib/engine/config.ts`), never UI rewiring.
**Rationale:** Avoids fake API calls and backend coupling; guarantees the demo can later be replaced by the real engine without touching components.

## S-003 — Fourth design direction ("Living Memory Interface")
**Date:** 2026-08-11
**Ruling:** Ship the spec's combined direction: 35% Elegant Modern Dark + 25% Aurora Nebula + 20% Hologram HUD + 20% modern React/Tailwind interactive patterns. The three moodboards in `moodboards/` are reference ingredients only.
**Rationale:** A premium 2026 AI-infrastructure feel — credible, restrained, alive; not generic AI-landing, Web3, cyberpunk, gaming, or template-like.

## S-004 — Metrics honesty
**Date:** 2026-08-11
**Ruling:** Show only real, provenance-backed metrics (p95 11 ms · 0% contradiction · 0% PII leak · 97 tests — sourced from the engine's `bench/results/acceptance.json`). If a metric can't be proven, use capability labels (AUDITABLE · DETERMINISTIC · TRACEABLE · PRIVACY-AWARE) instead.
**Rationale:** Credibility (spec §21). The engine genuinely measures these numbers.

## S-005 — Local-only git; no pushes without approval
**Date:** 2026-08-11
**Ruling:** `MemoryOS-Showcase` is a local-only git repo (`main`, no remote, ever). Nothing in this project is pushed to GitHub or anywhere else without explicit user approval. The public MemoryOS repo is untouched.
**Rationale:** Established user requirement after a prior unwanted push in the engine repo.

## S-006 — Playground after landing
**Date:** 2026-08-11
**Ruling:** Build the landing site first (Phases 1–4). The Playground (real engine, A/B theater, assistant-mode providers) is Phase 5.
**Rationale:** Landing must be polished and deterministic first; Playground needs the FastAPI + ApiMemoryEngine layer.

## S-007 — Nav: homepage-only anchors + stubs
**Date:** 2026-08-11
**Ruling:** Product / How it works scroll to on-page acts; Developers / Docs / GitHub are placeholder links; Playground link points to `/playground`. No secondary pages in this build.
**Rationale:** Scope discipline; spec describes the homepage.

## S-008 — No WebGL / Three.js / GSAP
**Date:** 2026-08-11
**Ruling:** Render with CSS, SVG, Canvas 2D, Motion. WebGL only if (1) CSS/SVG/Canvas 2D can't do it, (2) it materially improves the product story, (3) mobile performance is measured, (4) fallback + reduced-motion exist.
**Rationale:** Spec §34–35, §59. MemoryOS is infrastructure; the site should communicate precision/trust, not "3D graphics demo".

## S-009 — Fonts & identity
**Date:** 2026-08-11
**Ruling:** Space Grotesk (display) · Inter (body) · IBM Plex Mono (machine) — limited weights (400–700 / 400–600 / 400–500), `font-display: swap`. Accent colors represent memory state, not decoration (indigo=active system, ice blue=retrieval, green=success, pink=superseded/conflict).
**Rationale:** Spec §5, §4.2. Typography splits human interface vs machine memory visually.
