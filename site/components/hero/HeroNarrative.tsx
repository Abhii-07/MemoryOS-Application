"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * HeroNarrative — the signature moment (spec §11, §62).
 *
 * A deterministic, DOM-only sequence demonstrating what memory does:
 * input → extract → conflict → supersede → updated → query → answer.
 *  - ~6s run, holds final state, restarts only after a long pause
 *  - pauses offscreen / hidden tab / reduced motion
 *  - reduced motion: static final state (§29) — no animation, no loop
 */

interface Row {
  kind: "log" | "input" | "extract" | "conflict" | "superseded" | "active" | "query" | "answer";
  label?: string;
  text: string;
}

/** Cumulative ms offset at which each step's rows are appended. */
const STEPS: Array<{ at: number; rows: Row[] }> = [
  { at: 500, rows: [{ kind: "log", label: "USER INPUT", text: '"I prefer coffee."' }] },
  {
    at: 1500,
    rows: [{ kind: "extract", label: "EXTRACTING MEMORY", text: "preference.drink → coffee" }],
  },
  { at: 2600, rows: [{ kind: "log", label: "USER INPUT", text: '"I switched to tea."' }] },
  { at: 3700, rows: [{ kind: "conflict", label: "CONFLICT DETECTED", text: "coffee · tea" }] },
  {
    at: 4500,
    rows: [
      { kind: "superseded", label: "MEMORY UPDATED", text: "coffee → superseded" },
      { kind: "active", text: "tea → active" },
    ],
  },
  {
    at: 5400,
    rows: [
      { kind: "log", label: "METADATA", text: "confidence 0.94 · source user_stated" },
    ],
  },
  { at: 6200, rows: [{ kind: "query", label: "QUERY", text: '"What do I drink?"' }] },
  { at: 6900, rows: [{ kind: "answer", label: "RETRIEVED", text: "TEA" }] },
];

const END = STEPS[STEPS.length - 1].at; // 6900
const HOLD = 5200; // remain in final state
const IDLE = 3800; // gap before replay

const TOTAL_CYCLE = END + HOLD + IDLE;

export function HeroNarrative() {
  const { reduced } = useMotionPref();
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(reduced ? STEPS.length : 0);
  const [cycle, setCycle] = useState(0);
  const stepRef = useRef(reduced ? STEPS.length : 0);
  const tRef = useRef(0);
  const activeRef = useRef(true);

  useEffect(() => {
    if (reduced) return;

    stepRef.current = -1; // force a reset on the first tick
    tRef.current = 0;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 120); // clamp tab-lag spikes
      last = now;

      if (!activeRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (stepRef.current === -1) {
        stepRef.current = 0;
        setStep(0);
      }

      tRef.current += dt;
      const t = tRef.current;

      if (t >= TOTAL_CYCLE) {
        tRef.current = 0;
        stepRef.current = 0;
        setStep(0);
        setCycle((c) => c + 1);
      } else if (t <= END) {
        let s = 0;
        for (let i = 0; i < STEPS.length; i++) if (t >= STEPS[i].at) s = i + 1;
        if (s !== stepRef.current) {
          stepRef.current = s;
          setStep(s);
        }
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
      { threshold: 0.25 },
    );
    const el = containerRef.current;
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

  const visibleRows = reduced ? STEPS.length : step;

  return (
    <div ref={containerRef} className="relative mt-14 flex justify-center" aria-hidden="true">
      <div
        key={cycle}
        className="w-[min(430px,92vw)] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(13,13,17,0.7)] shadow-[0_18px_60px_rgba(0,0,0,0.4)] backdrop-blur-md"
        style={{ animation: reduced ? undefined : "panel-in 0.5s ease both" }}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            MemoryCore · live demo
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
            {reduced ? "static" : "deterministic"}
          </span>
        </div>

        {/* rows */}
        <div className="flex flex-col gap-2 px-4 py-4 text-left font-mono text-[12px] leading-relaxed">
          {STEPS.slice(0, visibleRows).map((s, si) =>
            s.rows.map((r, ri) => (
              <div
                key={`${si}-${ri}`}
                className="narrative-row"
                style={{ animation: reduced ? undefined : "row-in 0.35s ease both" }}
              >
                {r.label && (
                  <span
                    className={`mr-2 uppercase tracking-[0.14em] ${
                      r.kind === "conflict"
                        ? "text-danger"
                        : r.kind === "superseded"
                          ? "text-faint"
                          : r.kind === "active" || r.kind === "answer"
                            ? "text-success"
                            : r.kind === "extract"
                              ? "text-secondary"
                              : "text-faint"
                    }`}
                  >
                    {r.label}
                    {" · "}
                  </span>
                )}
                <span
                  className={
                    r.kind === "answer"
                      ? "text-[17px] font-bold tracking-[0.2em] text-success"
                      : r.kind === "input" || r.kind === "query"
                        ? "text-text"
                        : r.kind === "conflict"
                          ? "text-danger"
                          : r.kind === "superseded"
                            ? "text-faint line-through decoration-danger/60"
                            : r.kind === "active"
                              ? "text-success"
                              : "text-muted"
                  }
                >
                  {r.text}
                </span>
              </div>
            )),
          )}

          {/* stable height while rows are animating in */}
          {!reduced && visibleRows === 0 && <div className="h-[156px]" />}
        </div>
      </div>
    </div>
  );
}
