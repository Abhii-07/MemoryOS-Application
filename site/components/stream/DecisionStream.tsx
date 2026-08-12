"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * Act 04 — Decision Stream (spec §16–17).
 * Terminal-style trace of one ingestion, with the interactive
 * "Why did this memory win?" resolution explainer.
 */

const TRACE: Array<[string, string, string]> = [
  ["ingest", "input", '"Actually I switched to tea now."'],
  ["extract", "slot", "preference.drink"],
  ["pii", "scan", "clean"],
  ["conflict", "existing", "coffee"],
  ["resolution", "rule", "coffee → superseded"],
  ["update", "write", "tea → active"],
  ["provenance", "source", "user_stated"],
  ["confidence", "score", "0.94"],
];

export function DecisionStream() {
  const [open, setOpen] = useState(false);

  return (
    <section id="decision" className="section-gap" aria-label="Decision stream">
      <div className="container-site">
        <Reveal>
          <p className="kicker-label">Act 04 — Explainability</p>
          <h2 className="h2-display">See every choice it makes.</h2>
          <p className="lead-text">
            Every write and every retrieval can be traced to a decision — extracted slot,
            detected conflict, resolution rule, provenance, confidence. Nothing happens
            silently.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0a0a0e] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            {/* terminal header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-5 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                MemoryOS / SESSION 001
              </span>
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-[#ff7aa8]/70" />
                <span className="h-2 w-2 rounded-full bg-[#8fe7ff]/70" />
                <span className="h-2 w-2 rounded-full bg-[#5ee6a8]/70" />
              </span>
            </div>

            {/* trace */}
            <div className="px-5 py-5 font-mono text-[12.5px] leading-[2.05]">
              {TRACE.map(([op, label, value], i) => (
                <div key={op} className="stream-row" style={{ animationDelay: `${i * 90}ms` }}>
                  <span className="text-primary">&gt;</span>{" "}
                  <span className="text-secondary">{op}</span>{" "}
                  <span className="text-faint">[{label}]</span>{" "}
                  <span className="text-text">{value}</span>
                </div>
              ))}
              <div className="stream-row flex items-center gap-2 pt-2" style={{ animationDelay: `${TRACE.length * 90}ms` }}>
                <CheckCircle2 size={13} className="text-success" />
                <span className="text-success">memory updated</span>
              </div>
            </div>

            {/* why did this memory win? */}
            <div className="border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left text-[13px] font-semibold text-secondary transition-colors hover:bg-white/[0.03]"
                aria-expanded={open}
                aria-controls="resolution-panel"
              >
                Why did this memory win?
                <ChevronDown
                  size={15}
                  className="text-faint transition-transform duration-200"
                  style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {open && (
                <dl id="resolution-panel" className="grid gap-3 border-t border-[rgba(255,255,255,0.08)] bg-white/[0.02] px-5 py-4 sm:grid-cols-2">
                  {[
                    ["NEW MEMORY", "tea"],
                    ["EXISTING MEMORY", "coffee"],
                    ["CONFLICT", "same semantic slot (preference.drink)"],
                    ["RESOLUTION", "newer explicit user statement"],
                    ["EVIDENCE", '"user stated" · direct input'],
                    ["CONFIDENCE", "0.94"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">{k}</dt>
                      <dd className="mt-1 font-mono text-[12px] text-text">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
