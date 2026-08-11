# Project Memory

> Durable knowledge only — NOT a chronological journal. High-signal facts a future agent needs to understand and continue this project.

## Project Purpose
MemoryOS Showcase = the public face of the **MemoryOS** memory engine (engine lives at `D:\Abhii\Projects\MemoryOS`). Two surfaces:

1. **Landing page** (`/`) — a premium 2026 AI-infrastructure marketing site per `MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md`. Always runs on **deterministic demo data** (`DemoMemoryEngine`) — fast, reliable, backend-independent, reproducible.
2. **Playground** (`/playground`, Phase 5) — the real product: type a message, watch the **actual engine** (FastAPI + `memory_os` + Postgres/pgvector) store, supersede, and retrieve memories; includes A/B theater and assistant-mode providers.

Positioning: **memory infrastructure for AI** — NOT a chatbot, RAG UI, or vector DB. Tagline: *"Give your AI a memory it can trust."* Motto: *"The AI you can audit."*

## Architecture

```
MemoryOS Website
    ├── Landing page ── DemoMemoryEngine ── deterministic scenarios
    └── Playground ──── ApiMemoryEngine ── FastAPI ── memory_os engine ── Postgres 17 + pgvector
```

### The engine contract (the critical piece — nothing couples to the backend)
```ts
interface MemoryEngine {
  ingest(input: string): Promise<MemoryEvent[]>;
  ask(query: string): Promise<MemoryResponse>;
  getMemories(): Promise<Memory[]>;
  audit(memoryId: string): Promise<AuditEvent[]>;
}
```
- `DemoMemoryEngine`: deterministic, predefined events/scenarios. Used by landing page **forever**.
- `ApiMemoryEngine`: same contract against the Phase-5 FastAPI. Used by Playground.
- Switching = a config flag in `lib/engine/config.ts`. The UI never knows which engine it talks to.

### Demo scenarios (must mirror real engine semantics exactly)
- **Supersession**: "I prefer coffee." → preference.drink = coffee → "I switched to tea." → CONFLICT → coffee SUPERSEDED, tea ACTIVE
- **Contradiction**: favourite colour Blue → Green (resolved at write time — no both-memories)
- **Cold-start**: new user query → no false memory injection
- **PII**: phone/email scrubbed → REDACTED, content `[PHONE]`
- **Lineage delete**: deleting a memory propagates to derived records

Real engine concepts the demo reproduces: `ingest → extraction → conflict detection → supersession → active memory → retrieval → provenance/audit`.

## Memory state model (UI must support all six, icon + label + color — never color alone)
NEW · ACTIVE · SUPERSEDED · DELETED · REDACTED · CONFLICT

## Key Design Decisions
1. **Fourth design direction** (spec §1): 35% Elegant Modern Dark + 25% Aurora Nebula + 20% Hologram HUD + 20% modern React/Tailwind patterns. The three moodboards in `moodboards/` are ingredients, not the final look.
2. **Demo-first** (S-001): landing never calls a backend; demo engine interface designed so real wiring is a drop-in later.
3. **Metrics honesty** (spec §21, S-004): only real numbers. Real ones available: p95 11 ms · 0% contradiction · 0% leak · 97 tests (engine `bench/results/acceptance.json`, committed `991d9f6` in the engine repo).
4. **Performance discipline** (spec §24–35): no WebGL/Three.js/GSAP; Canvas 2D only where justified; transform/opacity; rAF; DPR ≤ 2; node caps 20–40 desktop / 8–18 mobile; visibility + tab pauses; `prefers-reduced-motion` + manual Motion toggle; blur ≤ 12 px sparingly; no preloader; static fallbacks.
5. **Signature moment** (spec §62): `"I prefer coffee." → preference.drink → "I switched to tea." → CONFLICT → coffee superseded → tea active → "What do I drink?" → TEA (source: user_stated)`. The website's product demo.
6. **Local-only git, nothing pushed anywhere** without explicit user approval (S-005). The public MemoryOS repo must stay untouched.

## Important Constraints
- `D:\Abhii\Projects\MemoryOS-Showcase` is local-only git (`main`, no remote). Never add a remote.
- Fonts: Space Grotesk 400–700 · Inter 400–600 · IBM Plex Mono 400–500, `font-display: swap`.
- Design tokens live in the Tailwind theme, sourced from spec §53 (`#07070A`, `#7C5CFF` indigo, `#8FE7FF` ice blue, `#5EE6A8` success, `#FF7AA8` superseded).
- Accent colors = state, not decoration (indigo=active system, blue=retrieval, green=success, pink=superseded/conflict).
- A11y: graph must have a "view as list" alternative; keyboard nav; focus states.
- No preloader, no autoplay hero video, no full-screen WebGL.
