"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, List, Share2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * Act 03 — Interactive Memory Graph (spec §14–15).
 * 20 nodes / 30 edges, 6 states, hover → tooltip (graph dims),
 * click → memory inspector, "view as list" alternative (§49).
 */

type GState = "NEW" | "ACTIVE" | "SUPERSEDED" | "DELETED" | "REDACTED" | "CONFLICT";

interface GNode {
  id: string;
  type: string;
  key: string;
  value: string;
  source: string;
  confidence: number | null;
  state: GState;
  x: number;
  y: number;
}

// Deterministic demo dataset — mirrors the DemoMemoryEngine slots (§14 examples).
const NODES: GNode[] = [
  { id: "mem_116", type: "preference", key: "drink", value: "tea", source: "user_stated", confidence: 0.94, state: "ACTIVE", x: 250, y: 110 },
  { id: "mem_11d", type: "preference", key: "color", value: "green", source: "user_stated", confidence: 0.91, state: "ACTIVE", x: 700, y: 100 },
  { id: "mem_124", type: "fact", key: "location", value: "Bangalore", source: "user_stated", confidence: 0.97, state: "ACTIVE", x: 480, y: 150 },
  { id: "mem_12b", type: "habit", key: "workout", value: "mornings", source: "user_stated", confidence: 0.88, state: "ACTIVE", x: 150, y: 260 },
  { id: "mem_132", type: "project", key: "memoryos", value: "engine core", source: "user_stated", confidence: 0.92, state: "ACTIVE", x: 830, y: 230 },
  { id: "mem_139", type: "relationship", key: "sister", value: "Anisha", source: "user_stated", confidence: 0.95, state: "ACTIVE", x: 340, y: 420 },
  { id: "mem_140", type: "constraint", key: "nutrition", value: "no dairy", source: "user_stated", confidence: 0.9, state: "ACTIVE", x: 660, y: 420 },
  { id: "mem_117", type: "preference", key: "drink", value: "coffee", source: "user_stated", confidence: 0.88, state: "SUPERSEDED", x: 480, y: 60 },
  { id: "mem_125", type: "fact", key: "location", value: "Mumbai", source: "user_stated", confidence: 0.93, state: "SUPERSEDED", x: 620, y: 200 },
  { id: "mem_147", type: "instruction", key: "respond", value: "be brief", source: "user_stated", confidence: 0.89, state: "ACTIVE", x: 70, y: 150 },
  { id: "mem_14e", type: "fact", key: "availability", value: "evenings", source: "user_stated", confidence: 0.86, state: "ACTIVE", x: 900, y: 370 },
  { id: "mem_155", type: "habit", key: "meditation", value: "nightly", source: "user_stated", confidence: 0.84, state: "NEW", x: 90, y: 400 },
  { id: "mem_15c", type: "preference", key: "music", value: "indie", source: "user_stated", confidence: 0.79, state: "CONFLICT", x: 820, y: 150 },
  { id: "mem_163", type: "constraint", key: "screen", value: "none after 11pm", source: "user_stated", confidence: 0.82, state: "ACTIVE", x: 560, y: 330 },
  { id: "mem_16a", type: "fact", key: "pet", value: "Mochi", source: "user_stated", confidence: 0.87, state: "REDACTED", x: 210, y: 200 },
  { id: "mem_171", type: "fact", key: "payment", value: "[REDACTED]", source: "user_stated", confidence: null, state: "REDACTED", x: 310, y: 80 },
  { id: "mem_178", type: "project", key: "website", value: "showcase", source: "user_stated", confidence: 0.9, state: "ACTIVE", x: 760, y: 320 },
  { id: "mem_17f", type: "fact", key: "birthday", value: "Aug 3", source: "user_stated", confidence: 0.94, state: "DELETED", x: 450, y: 470 },
  { id: "mem_15d", type: "preference", key: "music", value: "jazz", source: "user_stated", confidence: 0.78, state: "SUPERSEDED", x: 710, y: 260 },
  { id: "mem_186", type: "session", key: "context", value: "user_123", source: "system", confidence: 0.99, state: "ACTIVE", x: 560, y: 90 },
];

// [a, b] index pairs: superseded-lineage links + a few structural links.
const LINKS: Array<[number, number]> = [
  [0, 7], // tea ↔ coffee
  [2, 8], // Bangalore ↔ Mumbai
  [12, 18], // indie ↔ jazz
  [2, 10], // location ↔ availability
  [4, 16], // memoryos ↔ website
  [13, 3], // screen ↔ workout
  [5, 14], // sister ↔ pet
];

const HUB = { x: 480, y: 270 };

const VB_W = 960;
const VB_H = 540;

const STATE_COLOR: Record<GState, string> = {
  ACTIVE: "#5EE6A8",
  NEW: "#8FE7FF",
  SUPERSEDED: "#FF7AA8",
  DELETED: "#6F707C",
  REDACTED: "#A5A5B0",
  CONFLICT: "#FF7AA8",
};

export function MemoryGraph() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [listMode, setListMode] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const dimOthers = hovered !== null;
  const hubIn = (i: number) => i % 2 === 0; // hub edge opacity rhythm

  const tooltip = useCallback(
    (n: GNode) => {
      const left = Math.min(Math.max((n.x / VB_W) * 100, 10), 80);
      const top = (n.y / VB_H) * 100;
      return (
        <div
          className="pointer-events-none absolute z-10 w-44 rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(13,13,17,0.92)] p-3 text-left shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
          style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-12px, -118%)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
              Memory
            </span>
            <StateChip state={n.state} />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-secondary">
            {n.type}.{n.key}
          </p>
          <dl className="mt-2 space-y-1 font-mono text-[10.5px] leading-relaxed">
            <div className="flex justify-between gap-2">
              <dt className="text-faint">VALUE</dt>
              <dd className="text-text">{n.value}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-faint">SOURCE</dt>
              <dd className="text-text">{n.source}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-faint">CONFIDENCE</dt>
              <dd className="text-text">{n.confidence === null ? "—" : `${Math.round(n.confidence * 100)}%`}</dd>
            </div>
          </dl>
          <p className="mt-2 font-mono text-[9.5px] text-faint">click to inspect</p>
        </div>
      );
    },
    [],
  );

  return (
    <section id="how-it-works" className="section-gap" aria-label="Memory graph">
      <div className="container-site">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker-label">Act 03 — See inside</p>
              <h2 className="h2-display">Make memory visible.</h2>
              <p className="lead-text">
                Know what your AI remembers, why it remembers it, and what changed.
              </p>
            </div>
            <button
              onClick={() => setListMode((v) => !v)}
              className="btn-ghost !py-2.5 !px-4 text-[13px]"
              aria-pressed={listMode}
            >
              {listMode ? <Share2 size={14} /> : <List size={14} />}
              {listMode ? "View graph" : "View as list"}
            </button>
          </div>
        </Reveal>

        {/* graph */}
        <Reveal delay={0.08}>
          <div className="relative mt-12 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface p-4 sm:p-6">
            {listMode ? (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {NODES.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => setSelected(n)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-raised px-4 py-3 text-left transition-colors hover:border-[rgba(255,255,255,0.18)]"
                    >
                      <span>
                        <span className="block font-mono text-[12px] text-secondary">
                          {n.type}.{n.key}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-faint">
                          {n.value}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <StateChip state={n.state} />
                        <span className="font-mono text-[10px] text-faint">
                          {n.confidence === null ? "—" : `${Math.round(n.confidence * 100)}%`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="relative aspect-[16/9] w-full select-none">
                <svg
                  viewBox={`0 0 ${VB_W} ${VB_H}`}
                  className="h-full w-full"
                  role="img"
                  aria-label="Memory graph: twenty memories connected to the memory engine core. Hover a node for details; click to inspect."
                >
                  {/* hub edges */}
                  {NODES.map((n, i) => (
                    <line
                      key={`h${n.id}`}
                      x1={HUB.x}
                      y1={HUB.y}
                      x2={n.x}
                      y2={n.y}
                      stroke="rgba(124,92,255,0.16)"
                      strokeWidth="1"
                      strokeDasharray={hubIn(i) ? undefined : "2 5"}
                      opacity={dimOthers && hovered !== n.id ? 0.1 : 1}
                      style={{ transition: "opacity 0.25s ease" }}
                    />
                  ))}
                  {/* structural links */}
                  {LINKS.map(([a, b], i) => (
                    <line
                      key={`l${i}`}
                      x1={NODES[a].x}
                      y1={NODES[a].y}
                      x2={NODES[b].x}
                      y2={NODES[b].y}
                      stroke="rgba(143,231,255,0.12)"
                      strokeWidth="1"
                      opacity={dimOthers && hovered !== NODES[a].id && hovered !== NODES[b].id ? 0.1 : 1}
                      style={{ transition: "opacity 0.25s ease" }}
                    />
                  ))}

                  {/* hub */}
                  <circle cx={HUB.x} cy={HUB.y} r="14" fill="rgba(124,92,255,0.12)" />
                  <circle cx={HUB.x} cy={HUB.y} r="4.5" fill="#7C5CFF" />
                  <text
                    x={HUB.x}
                    y={HUB.y - 22}
                    textAnchor="middle"
                    fontFamily='"IBM Plex Mono", monospace'
                    fontSize="10"
                    fill="rgba(247,247,250,0.55)"
                  >
                    MEMORY ENGINE
                  </text>

                  {/* nodes */}
                  {NODES.map((n) => {
                    const isHover = hovered === n.id;
                    const dim = dimOthers && !isHover;
                    const color = STATE_COLOR[n.state];
                    return (
                      <g
                        key={n.id}
                        className="cursor-pointer"
                        style={{ transition: "opacity 0.25s ease" }}
                        opacity={dim ? 0.16 : 1}
                        onMouseEnter={() => setHovered(n.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setSelected(n)}
                      >
                        {n.state === "CONFLICT" && (
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r="9"
                            fill="none"
                            stroke={color}
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            className="conflict-pulse"
                          />
                        )}
                        {n.state === "NEW" && (
                          <circle cx={n.x} cy={n.y} r="7" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
                        )}
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={n.state === "ACTIVE" ? 4.5 : n.state === "CONFLICT" ? 5 : 3.5}
                          fill={color}
                          opacity={n.state === "SUPERSEDED" || n.state === "DELETED" ? 0.5 : 1}
                        />
                        <text
                          x={n.x + (n.x > 830 ? -10 : 10)}
                          y={n.y + 4}
                          textAnchor={n.x > 830 ? "end" : "start"}
                          fontFamily='"IBM Plex Mono", monospace'
                          fontSize="10"
                          fill={n.state === "DELETED" || n.state === "SUPERSEDED" ? "rgba(111,112,124,0.9)" : "rgba(245,245,250,0.42)"}
                          style={n.state === "SUPERSEDED" ? { textDecoration: "line-through", textDecorationColor: "rgba(255,122,168,0.6)" } : undefined}
                        >
                          {n.value}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {hovered && tooltip(NODES.find((n) => n.id === hovered)!)}
              </div>
            )}
          </div>
        </Reveal>

        {/* legend — labels + color, not color alone (§15) */}
        <Reveal delay={0.05}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {(Object.keys(STATE_COLOR) as GState[]).map((s) => (
              <span key={s} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
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

      {/* inspector (glass — spec §54) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Memory inspector"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="relative w-[min(440px,94vw)] rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(13,13,17,0.94)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary">
                Memory inspector
              </span>
              <button
                ref={closeRef}
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-white/5 hover:text-text"
                aria-label="Close inspector"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 font-mono text-[12px]">
              {[
                ["ID", selected.id],
                ["TYPE", selected.type],
                ["KEY", selected.key],
                ["VALUE", selected.value],
                ["SOURCE", selected.source],
                ["CONFIDENCE", selected.confidence === null ? "—" : selected.confidence.toFixed(2)],
                ["CREATED", "Aug 11, 2026"],
                ["UPDATED", "Aug 11, 2026"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-faint">{k}</dt>
                  <dd className="mt-1 break-all text-text">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Status</span>
              <StateChip state={selected.state} />
            </div>
          </div>
        </div>
      )}
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
