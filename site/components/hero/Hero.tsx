"use client";

import { ArrowRight, PlayCircle } from "lucide-react";

/**
 * Hero — Act 01 (spec §9). Copy + CTAs only in Phase 1.
 * The MemoryCore canvas and the coffee→tea narrative mount here in Phase 2.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-label="Hero">
      {/* ambient background (cheap, CSS-only — spec §32) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 72% -6%, rgba(124,92,255,0.14), transparent 62%), radial-gradient(ellipse 45% 35% at 12% 0%, rgba(143,231,255,0.06), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 118%, rgba(124,92,255,0.07), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="container-site relative flex min-h-[92vh] flex-col items-center justify-center py-28 text-center">
        {/* MemoryCore mounts here (Phase 2) */}
        <div id="memory-core" className="pointer-events-none absolute inset-0" aria-hidden="true" />

        <p className="relative font-mono text-[11px] uppercase tracking-[0.3em] text-secondary">
          Memory infrastructure for AI
        </p>

        <h1 className="relative mt-7 max-w-3xl font-display text-[clamp(44px,7vw,78px)] font-bold leading-[1.05] tracking-[-0.035em]">
          Give your AI{" "}
          <span className="bg-gradient-to-r from-text via-[#c8bfff] to-primary bg-clip-text text-transparent">
            a memory it can trust.
          </span>
        </h1>

        <p className="relative mt-7 max-w-[560px] text-[17px] leading-[1.7] text-muted">
          MemoryOS is the memory infrastructure for AI applications — storing what matters,
          updating what changed, and giving every retrieved memory a reason.
        </p>

        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <a href="#developers" className="btn-primary">
            Build with MemoryOS <ArrowRight size={15} />
          </a>
          <a href="#how-it-works" className="btn-ghost">
            <PlayCircle size={15} /> See how memory works
          </a>
        </div>

        {/* real metrics only (S-004) */}
        <dl className="relative mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {[
            { v: "11 ms", l: "p95 latency" },
            { v: "0.0%", l: "contradictions" },
            { v: "0.0%", l: "PII leakage" },
            { v: "97", l: "passing tests" },
          ].map((m) => (
            <div key={m.l} className="text-center">
              <dt className="sr-only">{m.l}</dt>
              <dd className="font-display text-[22px] font-bold tracking-tight text-text">
                {m.v}
              </dd>
              <dd className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                {m.l}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
