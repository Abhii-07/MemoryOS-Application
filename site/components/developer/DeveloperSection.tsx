"use client";

import { Reveal } from "@/components/Reveal";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * Act 05 — Developer Experience (spec §18–19).
 * One API call, the pipeline with a single traveling particle,
 * and the resulting memory as JSON.
 */

const PIPELINE = ["Extract", "Resolve", "Store", "Retrieve", "Explain"];

const CODE = `import { MemoryOS } from "@memoryos/sdk";

const memory = await memoryOS.remember({
  userId: "user_123",
  input: message
});`;

const RESULT = `{
  "type": "preference",
  "key": "drink",
  "value": "tea",
  "confidence": 0.94,
  "source": "user_stated"
}`;

export function DeveloperSection() {
  const { reduced } = useMotionPref();

  return (
    <section id="developers" className="section-gap" aria-label="Developer experience">
      <div className="container-site">
        <Reveal>
          <p className="kicker-label">Act 05 — Developer experience</p>
          <h2 className="h2-display">
            One API call.
            <br />
            Persistent memory.
          </h2>
          <p className="lead-text">
            MemoryOS is a layer, not a rewrite. One call extracts, resolves, stores, retrieves
            and explains — your app keeps its existing stack.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
          {/* pipeline */}
          <Reveal delay={0.05}>
            <div className="card-surface flex flex-col items-center gap-0 p-8">
              <PipelineNode label="APP" tone="text" />
              <Connector particle={!reduced} />
              <PipelineNode label="MemoryOS" tone="primary" />
              {PIPELINE.map((step, i) => (
                <div key={step} className="flex flex-col items-center">
                  <Connector particle={!reduced} delay={i % 2 === 1} />
                  <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-raised px-4 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.16em] text-secondary">
                    {step}
                  </div>
                </div>
              ))}
              <Connector particle={!reduced} delay />
              <PipelineNode label="LLM" tone="muted" />
            </div>
          </Reveal>

          {/* code */}
          <Reveal delay={0.12}>
            <div className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0a0a0e] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-5 py-3">
                  <span className="font-mono text-[11px] tracking-[0.12em] text-faint">
                    app / memory.ts
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-success">
                    typescript
                  </span>
                </div>
                <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.85]">
                  <code>{CODE}</code>
                </pre>
              </div>

              <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface">
                <div className="border-b border-[rgba(255,255,255,0.08)] px-5 py-3">
                  <span className="font-mono text-[11px] tracking-[0.12em] text-faint">
                    memory (result)
                  </span>
                </div>
                <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.85]">
                  <code>{RESULT}</code>
                </pre>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PipelineNode({ label, tone }: { label: string; tone: "text" | "primary" | "muted" }) {
  return (
    <div
      className={`rounded-lg border px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.18em] ${
        tone === "primary"
          ? "border-[rgba(124,92,255,0.5)] bg-[rgba(124,92,255,0.12)] text-primary"
          : tone === "muted"
            ? "border-[rgba(255,255,255,0.12)] bg-raised text-muted"
            : "border-[rgba(255,255,255,0.18)] bg-surface-raised-2 text-text"
      }`}
    >
      {label}
    </div>
  );
}

/** Vertical connector with a single traveling particle (§19). */
function Connector({ particle, delay = false }: { particle: boolean; delay?: boolean }) {
  return (
    <div className="relative h-8 w-px bg-[rgba(255,255,255,0.14)]" aria-hidden="true">
      {particle && (
        <span
          className="pipeline-dot absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-secondary"
          style={delay ? { animationDelay: "0.8s" } : undefined}
        />
      )}
    </div>
  );
}
