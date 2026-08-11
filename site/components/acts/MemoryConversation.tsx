"use client";

import { Reveal } from "@/components/Reveal";

/**
 * Act 02 — The Problem (spec §13).
 * Without memory vs with MemoryOS, 3 weeks apart.
 */
const NAIVE = [
  { who: "user", text: "I prefer tea now." },
  { who: "ai", text: "Got it — anything else?" },
];

const WITH_MEMORYOS = [
  { who: "user", text: "I prefer tea now." },
  { who: "os", text: "+ preference.drink → tea" },
];

export function MemoryConversation() {
  return (
    <section id="product" className="section-gap" aria-label="The problem">
      <div className="container-site">
        <Reveal>
          <p className="kicker-label">Act 02 — The problem</p>
          <h2 className="h2-display max-w-[560px]">
            AI can generate.
            <br />
            It still doesn&rsquo;t remember.
          </h2>
          <p className="lead-text">
            Chat models answer from their training data. Between sessions, they forget
            everything about your user — including what they were just told.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* without memory */}
          <Reveal delay={0.05}>
            <div className="card-surface flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Without memory
                </h3>
                <span className="rounded-md border border-[rgba(255,122,168,0.35)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-danger">
                  forgets
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {NAIVE.map((m) => (
                  <div
                    key={m.text}
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.who === "user"
                        ? "self-end border border-[rgba(124,92,255,0.4)] bg-[rgba(124,92,255,0.1)] text-text"
                        : "self-start border border-[rgba(255,255,255,0.1)] bg-raised text-muted"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                <span className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                3 weeks later
                <span className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="max-w-[85%] self-end rounded-lg border border-[rgba(124,92,255,0.4)] bg-[rgba(124,92,255,0.1)] px-3.5 py-2.5 text-[13px] leading-relaxed text-text">
                  What should I drink?
                </div>
                <div className="max-w-[85%] self-start rounded-lg border border-[rgba(255,255,255,0.1)] bg-raised px-3.5 py-2.5 text-[13px] leading-relaxed text-muted">
                  I&rsquo;m sorry, I don&rsquo;t know what you drink.
                </div>
              </div>

              <p className="mt-auto pt-6 text-[12.5px] leading-relaxed text-faint">
                Every session starts from zero. The AI can generate — but it can&rsquo;t
                carry a preference across a single week.
              </p>
            </div>
          </Reveal>

          {/* with MemoryOS */}
          <Reveal delay={0.12}>
            <div className="relative flex h-full flex-col rounded-xl border border-[rgba(94,230,168,0.22)] bg-surface p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  With MemoryOS
                </h3>
                <span className="rounded-md border border-[rgba(94,230,168,0.4)] bg-[rgba(94,230,168,0.08)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
                  remembers
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {WITH_MEMORYOS.map((m) => (
                  <div
                    key={m.text}
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.who === "user"
                        ? "self-end border border-[rgba(124,92,255,0.4)] bg-[rgba(124,92,255,0.1)] text-text"
                        : "self-start border border-[rgba(94,230,168,0.35)] bg-[rgba(94,230,168,0.06)] font-mono text-[12px] text-success"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                <span className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                3 weeks later
                <span className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="max-w-[85%] self-end rounded-lg border border-[rgba(124,92,255,0.4)] bg-[rgba(124,92,255,0.1)] px-3.5 py-2.5 text-[13px] leading-relaxed text-text">
                  What should I drink?
                </div>
                <div className="max-w-[85%] self-start rounded-lg border border-[rgba(255,255,255,0.1)] bg-raised px-3.5 py-2.5 text-[13px] leading-relaxed text-text">
                  Tea.
                </div>
                <div className="max-w-[85%] self-start font-mono text-[11px] leading-relaxed text-faint">
                  memory retrieved · source <span className="text-secondary">user_stated</span> ·
                  confidence <span className="text-secondary">0.94</span>
                </div>
              </div>

              <p className="mt-auto pt-6 text-[12.5px] leading-relaxed text-faint">
                The engine stored the preference, superseded the old value, and retrieved it
                with a reason — three weeks later.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <p className="mt-14 text-center font-display text-[clamp(26px,3.4vw,38px)] font-bold tracking-[-0.02em]">
            That is memory.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
