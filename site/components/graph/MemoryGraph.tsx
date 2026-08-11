"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * Act 03 — Memory Ledger (spec §14–15, §49).
 *
 * The engine's event log, live: a deterministic replay of MemoryOS
 * processing memories — INGEST coffee → CONFLICT DETECTED → SUPERSEDE
 * coffee → ACTIVATE tea — as an audit-friendly ledger. Every row is a
 * traceable event: timestamp, op code, type.key, value, provenance.
 *
 * DOM-only, mirroring the HeroNarrative pattern:
 *  - all rows in the DOM from first paint; reveal is opacity/transform
 *    only, so the fixed-height stage never moves (zero layout shift)
 *  - rAF drives reveal + a lerped auto-scroll; no React state per frame
 *  - hover / touch pauses auto-scroll (native wheel/touch scroll resumes)
 *  - IntersectionObserver + tab-visibility pauses (§27–28)
 *  - reduced motion → static ledger, fully revealed, manual scroll (§29)
 *  - rows are real DOM text → keyboard/AT accessible; click a memory row
 *    for the floating Memory Inspector
 */

type GState = "NEW" | "ACTIVE" | "SUPERSEDED" | "DELETED" | "REDACTED" | "CONFLICT";

interface NodeData {
  id: string;
  type: string;
  key: string;
  value: string;
  source: string;
  confidence: number | null;
  state: GState;
}

// Deterministic demo dataset — mirrors the DemoMemoryEngine slots (§14).
const NODES: NodeData[] = [
  { id: "mem_116", type: "preference", key: "drink", value: "tea", source: "user_stated", confidence: 0.94, state: "ACTIVE" },
  { id: "mem_117", type: "preference", key: "drink", value: "coffee", source: "user_stated", confidence: 0.88, state: "SUPERSEDED" },
  { id: "mem_11d", type: "preference", key: "color", value: "green", source: "user_stated", confidence: 0.91, state: "ACTIVE" },
  { id: "mem_15c", type: "preference", key: "music", value: "indie", source: "user_stated", confidence: 0.79, state: "CONFLICT" },
  { id: "mem_15d", type: "preference", key: "music", value: "jazz", source: "user_stated", confidence: 0.78, state: "SUPERSEDED" },
  { id: "mem_12b", type: "habit", key: "workout", value: "mornings", source: "user_stated", confidence: 0.88, state: "ACTIVE" },
  { id: "mem_155", type: "habit", key: "meditation", value: "nightly", source: "user_stated", confidence: 0.84, state: "NEW" },
  { id: "mem_124", type: "fact", key: "location", value: "Bangalore", source: "user_stated", confidence: 0.97, state: "ACTIVE" },
  { id: "mem_125", type: "fact", key: "location", value: "Mumbai", source: "user_stated", confidence: 0.93, state: "SUPERSEDED" },
  { id: "mem_14e", type: "fact", key: "availability", value: "evenings", source: "user_stated", confidence: 0.86, state: "ACTIVE" },
  { id: "mem_132", type: "project", key: "memoryos", value: "engine core", source: "user_stated", confidence: 0.92, state: "ACTIVE" },
  { id: "mem_178", type: "project", key: "website", value: "showcase", source: "user_stated", confidence: 0.9, state: "ACTIVE" },
  { id: "mem_139", type: "relationship", key: "sister", value: "Anisha", source: "user_stated", confidence: 0.95, state: "ACTIVE" },
  { id: "mem_16a", type: "fact", key: "pet", value: "Mochi", source: "user_stated", confidence: 0.87, state: "REDACTED" },
  { id: "mem_171", type: "fact", key: "payment", value: "[REDACTED]", source: "user_stated", confidence: null, state: "REDACTED" },
  { id: "mem_17f", type: "fact", key: "birthday", value: "Aug 3", source: "user_stated", confidence: 0.94, state: "DELETED" },
  { id: "mem_186", type: "session", key: "context", value: "user_123", source: "system", confidence: 0.99, state: "ACTIVE" },
  { id: "mem_147", type: "instruction", key: "respond", value: "be brief", source: "user_stated", confidence: 0.89, state: "ACTIVE" },
];

const STATE_COLOR: Record<GState, string> = {
  ACTIVE: "#5EE6A8",
  NEW: "#8FE7FF",
  SUPERSEDED: "#FF7AA8",
  DELETED: "#6F707C",
  REDACTED: "#A5A5B0",
  CONFLICT: "#FF7AA8",
};

// ── ledger events ────────────────────────────────────────────
type Op = "INGEST" | "INDEX" | "CONFLICT" | "SUPERSEDE" | "ACTIVATE" | "REDACT" | "DELETE" | "AUDIT" | "COMPLETE";

const OP_COLOR: Record<Op, string> = {
  INGEST: "#8FE7FF",
  INDEX: "#9C9CAC",
  CONFLICT: "#FF7AA8",
  SUPERSEDE: "#FF7AA8",
  ACTIVATE: "#5EE6A8",
  REDACT: "#A5A5B0",
  DELETE: "#6F707C",
  AUDIT: "#7C5CFF",
  COMPLETE: "#8FE7FF",
};

interface LedgerEvent {
  t: number; // ms offset in the replay cycle
  op: Op;
  kind: string;
  value: string;
  detail: string;
  memId?: string; // row opens the inspector for this memory
  hero?: boolean; // part of the coffee → tea sequence
}

// Deterministic replay — mirrors the engine's processing order.
const EVENTS: LedgerEvent[] = [
  { t: 0, op: "INGEST", kind: "preference.drink", value: "coffee", detail: "user_stated · 88%", memId: "mem_117", hero: true },
  { t: 850, op: "INDEX", kind: "slot", value: "mem_117", detail: "deterministic slot assignment" },
  { t: 1700, op: "INGEST", kind: "fact.location", value: "Bangalore", detail: "user_stated · 97%", memId: "mem_124" },
  { t: 2550, op: "INGEST", kind: "preference.color", value: "green", detail: "user_stated · 91%", memId: "mem_11d" },
  { t: 3400, op: "INGEST", kind: "preference.drink", value: "tea", detail: "user_stated · 94%", memId: "mem_116", hero: true },
  { t: 4250, op: "CONFLICT", kind: "preference.drink", value: "coffee ↔ tea", detail: "same key · different values", hero: true },
  { t: 5100, op: "SUPERSEDE", kind: "mem_117", value: "coffee", detail: "resolved by mem_116", memId: "mem_117", hero: true },
  { t: 5950, op: "ACTIVATE", kind: "mem_116", value: "tea", detail: "confidence 0.94 · index rebuilt", memId: "mem_116", hero: true },
  { t: 6800, op: "AUDIT", kind: "integrity", value: "PASS", detail: "97 tests · 0% contradictions · 0% leak" },
  { t: 7650, op: "INGEST", kind: "habit.workout", value: "mornings", detail: "user_stated · 88%", memId: "mem_12b" },
  { t: 8500, op: "INGEST", kind: "relationship.sister", value: "Anisha", detail: "user_stated · 95%", memId: "mem_139" },
  { t: 9350, op: "REDACT", kind: "fact.payment", value: "[REDACTED]", detail: "privacy · auto-scrub", memId: "mem_171" },
  { t: 10200, op: "DELETE", kind: "fact.birthday", value: "Aug 3", detail: "consent · user requested", memId: "mem_17f" },
  { t: 11050, op: "INGEST", kind: "preference.music", value: "indie", detail: "user_stated · 79%", memId: "mem_15c" },
  { t: 11900, op: "INGEST", kind: "preference.music", value: "jazz", detail: "user_stated · 78%", memId: "mem_15d" },
  { t: 12750, op: "CONFLICT", kind: "preference.music", value: "indie ↔ jazz", detail: "same key · different values" },
  { t: 13600, op: "SUPERSEDE", kind: "mem_15d", value: "jazz", detail: "resolved by mem_15c", memId: "mem_15d" },
  { t: 14450, op: "INGEST", kind: "habit.meditation", value: "nightly", detail: "user_stated · 84% · NEW", memId: "mem_155" },
  { t: 15300, op: "COMPLETE", kind: "index", value: "18 memories", detail: "6 states · deterministic" },
  { t: 16150, op: "AUDIT", kind: "integrity", value: "PASS", detail: "97 tests · 0% contradictions · 0% leak" },
];

const REWIND_AT = 18400; // rows fade + scroll returns to top
const CYCLE = 20000;
const STAGE_HEIGHT = "clamp(480px, 62vh, 620px)";

const fmt = (t: number) => (t / 1000).toFixed(3).padStart(6, "0");

function RowContent({ e, active }: { e: LedgerEvent; active: boolean }) {
  const valueClass =
    e.op === "CONFLICT"
      ? "text-danger"
      : e.op === "SUPERSEDE"
        ? "text-danger/80 line-through decoration-danger/50"
        : e.op === "ACTIVATE"
          ? "text-success"
          : e.op === "AUDIT" || e.op === "COMPLETE"
            ? "text-secondary"
            : "text-text";
  return (
    <>
      <span className="w-[54px] shrink-0 text-[10.5px] tabular-nums text-faint">{fmt(e.t)}</span>
      <span
        className="w-[96px] shrink-0 text-[9.5px] font-medium uppercase tracking-[0.16em]"
        style={{ color: OP_COLOR[e.op] }}
      >
        {e.op}
      </span>
      <span className="hidden w-[150px] shrink-0 truncate text-secondary sm:block">{e.kind}</span>
      <span className={valueClass}>
        {e.value}
        {active && (
          <span
            aria-hidden="true"
            className="ml-1.5 inline-block h-[11px] w-[6px] translate-y-[1px] animate-pulse bg-[#8fe7ff]"
          />
        )}
      </span>
      <span className="ml-auto hidden shrink-0 pl-4 text-right text-[10.5px] text-faint sm:block">{e.detail}</span>
    </>
  );
}

export function MemoryGraph() {
  const { reduced } = useMotionPref();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [selected, setSelected] = useState<NodeData | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeIdxRef = useRef(-1);
  const tRef = useRef(0);
  const activeRef = useRef(true);
  const hoverRef = useRef(false);
  const manualRef = useRef(false);

  // continuous auto-scroll loop — rows are ALWAYS visible, so the stage is
  // never blank: the view scrolls down over the run phase, then back up to
  // the top (all content still visible) and loops. scrollTop is a direct
  // DOM write; the cursor index only changes on event boundaries.
  useEffect(() => {
    if (reduced) return;

    tRef.current = 0;
    activeIdxRef.current = -1;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 120); // clamp tab-lag spikes
      last = now;

      if (!activeRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      tRef.current += dt;
      const t = tRef.current;

      if (t >= CYCLE) {
        tRef.current = 0; // loop: scroll-back already returned to the top
      }

      // cursor tracks the active event during the run phase only
      let idx = -1;
      if (t < REWIND_AT) {
        for (let i = 0; i < EVENTS.length; i++) if (t >= EVENTS[i].t) idx = i;
      }
      if (idx !== activeIdxRef.current) {
        activeIdxRef.current = idx;
        setActiveIdx(idx);
      }

      const vp = viewportRef.current;
      if (vp && !hoverRef.current && !manualRef.current) {
        const max = Math.max(0, vp.scrollHeight - vp.clientHeight);
        const target = t < REWIND_AT ? (t / REWIND_AT) * max : 0;
        const cur = vp.scrollTop;
        if (Math.abs(target - cur) > 0.5) vp.scrollTop = cur + (target - cur) * 0.12;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // pause offscreen / hidden tab (§27–28)
  useEffect(() => {
    if (reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
      },
      { threshold: 0.12 },
    );
    const el = viewportRef.current;
    if (el) io.observe(el);

    const onVis = () => {
      if (document.visibilityState === "hidden") activeRef.current = false;
      else if (el && el.getBoundingClientRect().top < window.innerHeight) activeRef.current = true;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  // Esc closes inspector; focus the close button when it opens
  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // supersession counterpart for the inspector
  const counterpart = selected
    ? NODES.find((n) => n.type === selected.type && n.key === selected.key && n.id !== selected.id)
    : null;

  return (
    <section id="how-it-works" className="section-gap" aria-label="Memory ledger">
      <div className="container-site">
        <Reveal>
          <div>
            <p className="kicker-label">Act 03 — See inside</p>
            <h2 className="h2-display">Make memory visible.</h2>
            <p className="lead-text">
              Know what your AI remembers, why it remembers it, and what changed.
            </p>
          </div>
        </Reveal>
      </div>

      {/* ledger — fixed height, borderless, zero layout shift */}
      <div className="relative mt-10" style={{ height: STAGE_HEIGHT }}>
        {/* strip */}
        <div className="mx-auto mb-3 flex max-w-[960px] items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
          <span>memoryos // event log</span>
          <span className="flex items-center gap-2 text-secondary">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#8fe7ff]" />
            {reduced ? "static" : "live"}
          </span>
        </div>

        <div
          ref={viewportRef}
          className="absolute inset-x-0 bottom-0 top-[42px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%_-_24px),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%_-_24px),transparent)]"
          role="list"
          aria-label="MemoryOS event log — deterministic replay of memory processing. Hover to pause the live scroll."
          onPointerEnter={() => {
            hoverRef.current = true;
          }}
          onPointerLeave={() => {
            hoverRef.current = false;
            manualRef.current = false;
          }}
          onPointerDown={() => {
            manualRef.current = true;
          }}
        >
          <ol className="mx-auto max-w-[960px] divide-y divide-[rgba(255,255,255,0.05)] px-6">
            {EVENTS.map((e, i) => {
              const activeRow = !reduced && i === activeIdx;
              const rowClass = `flex items-baseline gap-3 px-2 py-3 font-mono text-[12px] ${
                e.hero ? "bg-white/[0.015]" : ""
              }`;
              return (
                <li key={e.t} className="[content-visibility:auto]">
                  {e.memId ? (
                    <button
                      onClick={() => setSelected(NODES.find((n) => n.id === e.memId) ?? null)}
                      className={`${rowClass} w-full text-left transition-colors hover:bg-white/[0.03]`}
                      aria-label={`Inspect memory ${e.kind} ${e.value}`}
                    >
                      <RowContent e={e} active={activeRow} />
                    </button>
                  ) : (
                    <div className={rowClass}>
                      <RowContent e={e} active={activeRow} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* floating memory inspector (non-modal, glass §54) */}
        {selected && (
          <div
            role="region"
            aria-label="Memory inspector"
            className="absolute right-4 bottom-4 w-[min(300px,calc(100%-32px))] rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(13,13,17,0.92)] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md md:right-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                Memory
              </span>
              <button
                ref={closeRef}
                onClick={() => setSelected(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-white/5 hover:text-text"
                aria-label="Close inspector"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-2 font-mono text-[12.5px] text-secondary">
              {selected.type}.{selected.key}
            </p>
            <p
              className="mt-1 font-display text-[26px] font-bold tracking-tight"
              style={{ color: STATE_COLOR[selected.state] }}
            >
              {selected.value}
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <StateChip state={selected.state} />
              {selected.confidence !== null && (
                <span className="font-mono text-[11px] text-faint">
                  {Math.round(selected.confidence * 100)}% confidence
                </span>
              )}
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-[rgba(255,255,255,0.08)] pt-3.5 font-mono text-[11.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-faint">source</dt>
                <dd className="text-text">{selected.source}</dd>
              </div>
              {counterpart && counterpart.state === "SUPERSEDED" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">supersedes</dt>
                  <dd className="text-danger/70 line-through decoration-danger/50">
                    {counterpart.value}
                  </dd>
                </div>
              )}
              {counterpart && counterpart.state !== "SUPERSEDED" && selected.state === "SUPERSEDED" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">superseded by</dt>
                  <dd className="text-success">{counterpart.value}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* legend — labels + color, not color alone (§15) */}
      <div className="container-site">
        <Reveal delay={0.05}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {(Object.keys(STATE_COLOR) as GState[]).map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: STATE_COLOR[s],
                    opacity: s === "SUPERSEDED" || s === "DELETED" ? 0.5 : 1,
                  }}
                />
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StateChip({ state }: { state: GState }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]"
      style={{
        color: STATE_COLOR[state],
        borderColor: `${STATE_COLOR[state]}66`,
        background: `${STATE_COLOR[state]}14`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: STATE_COLOR[state], opacity: state === "SUPERSEDED" || state === "DELETED" ? 0.5 : 1 }}
        aria-hidden="true"
      />
      {state}
    </span>
  );
}
