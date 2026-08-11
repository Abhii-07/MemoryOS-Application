# Setup and Run

## Prerequisites
- Node.js 24+ (v24.14.0 verified) with npm 11+
- No backend needed — the landing page runs on deterministic demo data (`DemoMemoryEngine`). Phase 5 adds FastAPI + Postgres for the Playground only.

## Repository layout
```
MemoryOS-Showcase/
├── MEMORYOS_LIVING_MEMORY_INTERFACE_SPEC.md   ← the contract (design + performance)
├── moodboards/                                 ← reference ingredients (3 directions)
├── docs/                                       ← SESSION_STATE · STATUS · PROJECT_MEMORY · DECISIONS · RESUME
├── site/                                       ← Next.js application (Phase 1+)
└── server/                                     ← FastAPI service (Phase 5, deferred)
```

## First-time setup
```powershell
cd D:\Abhii\Projects\MemoryOS-Showcase\site
npm install
```

## Run (dev)
```powershell
npm run dev
# open http://localhost:3000
```

## Build + verify
```powershell
npm run build
npm run start
```

## Commits (local-only git)
```powershell
git add -A
git commit -m "feat(phase-1): ..."
```
> There is NO remote. Do not add one. Nothing is pushed anywhere without explicit user approval.

## Performance verification (Phase 4)
- Chrome DevTools → Performance / Lighthouse (LCP < 2.5 s, INP < 200 ms, CLS < 0.1 per spec §43)
- CPU throttling on a mid-range profile; mobile device mode
- Spec §58 acceptance checklist governs "done"
