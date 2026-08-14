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

## S-012 � Phase 4 a11y pass & measured performance
**Date:** 2026-08-12
**Ruling:** (1) Every interactive element gets a visible :focus-visible ring; mobile menu closes on Esc and returns focus to the toggle; the memory inspector returns focus to the clicked ledger row on close; ledger rows use their visible text as the accessible name (no ria-label override); ledger scroll area is a plain container (the ol supplies list semantics); --text-faint raised to #7a7b87 (AA = 4.5:1 on background/surface); DELETE/DELETED colors match the new faint token. (2) No content-visibility on ledger rows (collapses offscreen rows to 1px, causing overlap; pointless on 20 small rows). (3) Measured: Lighthouse mobile (simulated 4G + CPU) perf 96 / a11y 100 / best-practices 100 / SEO 100, CLS 0, TBT 13 ms; desktop (real network) 100 / 100 / 100 / 100, LCP 94 ms; load = 0 long tasks; realistic scroll = 0 frames > 24 ms.
**Rationale:** Spec �49 (keyboard, focus, contrast, semantics) and �58 (no jank, no layout shift, keyboard works). The simulated-network LCP (~2.8 s) is a Lighthouse simulation artifact � real network LCP is 94 ms, so no font/bundle restructuring is warranted.


## S-013 — Assistant providers: Ollama dev, cloud prod
**Date:** 2026-08-13
**Ruling:** POST /assist runs an LLM grounded on retrieved memory evidence. Provider order: Ollama (local, key-less) for development; OpenRouter (one key, free models) / OpenAI / Anthropic for hosted deployments. Keys live only in server/.env (never client, never committed; .env.example is the committed template). Registry auto-picks the first configured provider; env MEMORYOS_ASSIST_PROVIDER forces one. is_configured must be honest — cloud = key present, Ollama = endpoint up AND model present in /api/tags.
**Rationale:** A hosted site cannot reach a local Ollama, so deployment needs a cloud provider; free tier keeps it costless. Real gate checks prevent a 502-class lie where the provider is "configured" but unusable (empty model list was exactly that).

## S-014 — Chat loop with confirm-to-remember
**Date:** 2026-08-14
**Ruling:** POST /chat runs a stateful conversation loop: (1) LLM rewrites the query with conversation context (see S-015); (2) hybrid retrieval; (3) LLM answer grounded strictly on retrieved evidence — never invents, says plainly when nothing relevant; (4) a SECOND LLM call extracts candidate personal facts from the user's message (I/my/we statements only; questions/requests return []); the UI shows them as "remember?" chips and saving calls the existing POST /ingest. The assistant's own previous reply is excluded from the model transcript so the model never imitates a prior "no evidence" line while evidence exists.
**Rationale:** Never auto-write to memory without the user confirming (candidate facts are guesses about what matters). Two-stage extraction is format-independent — a question answered from memory must not pollute the fact stream. Verified live: "I've started drinking chai every morning" -> candidate ["drinks chai every morning"]; next turn "what do I drink now?" -> rewritten, chai retrieved, grounded answer.

## S-015 — Context-aware query rewrite, best-of retrieval
**Date:** 2026-08-14
**Ruling:** Before retrieval, an LLM rewrites the query into two keyword-rich variants (short phrases, never single words — single tokens score under the 0.5 relevance floor). Retrieval is best-of: raw query + variants + prior user texts from the session; the highest-scoring query wins. Double-draw: two stochastic rewrite attempts are unioned (deduped, capped at 3) so one bad draw cannot kill the rewrite.
**Rationale:** Natural-language questions ("what do I drink now?") share few lexical tokens with stored facts ("drinks chai every morning"); the floor rejects both raw query and single-keyword variants. Prior user texts are near-verbatim to stored facts and reliably clear the floor — verified live (chai turn). Single-word variants measured at cosine ~0.44 vs floor 0.5.

## S-016 — Public GitHub push (approval supersedes S-005)
**Date:** 2026-08-14
**Ruling:** On the user's explicit approval ("push all the code to github if working fine"), the Showcase repository is pushed to GitHub as Abhii-07/memoryos-portal (public). The engine repo (Abhii-07/MemoryOS) is already public and untouched. Secrets stay out: .env gitignored, .env.example committed, logs/caches ignored. S-005's "no pushes without approval" remains in force for any future repo until revoked.
**Rationale:** The project reached a verified, documented state (chat loop + assistant providers + full engine test suite green); user wants it public. Public repo is the requested visibility level; no deploy target is configured yet.
