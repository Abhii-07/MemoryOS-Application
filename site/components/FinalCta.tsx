"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/** Final CTA (spec §22) — simple, one slow ambient glow. */
export function FinalCta() {
  return (
    <section className="section-gap" aria-label="Get started">
      <div className="container-site">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface px-8 py-16 text-center sm:py-20">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 46% 60% at 50% 0%, rgba(124,92,255,0.14), transparent 65%)",
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 slow-glow"
              aria-hidden="true"
            />

            <h2 className="relative font-display text-[clamp(30px,4.4vw,46px)] font-bold leading-[1.1] tracking-[-0.03em]">
              Your AI is getting smarter.
              <br />
              Give it a memory.
            </h2>

            <div className="relative mt-9 flex justify-center">
              <a href="#developers" className="btn-primary">
                Build with MemoryOS <ArrowRight size={15} />
              </a>
            </div>

            <p className="relative mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11.5px] uppercase tracking-[0.16em] text-faint">
              <span>Open source core</span>
              <span aria-hidden="true">·</span>
              <span>API docs</span>
              <span aria-hidden="true">·</span>
              <span>GitHub</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
