"use client";

import { Bot, HeartHandshake, Building2, Server } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * Act 07 — Where memory belongs (product use cases, grounded in the engine
 * PRD personas). Claims are kept honest: no feature is promised that the
 * engine does not already do (deterministic admission, slot-key
 * supersession, PII scrubbing, lineage delete, tenant isolation).
 */

const CARDS = [
  {
    icon: Bot,
    title: "Assistants & copilots",
    body: "Project context, decisions and preferences that survive sessions. Hybrid retrieval with provenance-weighted ranking — what the user stated always outranks what the assistant inferred.",
  },
  {
    icon: HeartHandshake,
    title: "Health · finance · family",
    body: "Allergies, budgets, constraints. Correct facts win at write time, and PII is scrubbed to placeholders before it ever reaches the store.",
  },
  {
    icon: Building2,
    title: "Organizations",
    body: "Retention and deletion accountability. Deletion is lineage-aware and physical, memory is per-tenant isolated, and every decision leaves a trace.",
  },
  {
    icon: Server,
    title: "Platform operators",
    body: "Deterministic admission and retrieval — p95 well under the 150 ms budget, zone-budgeted context injection, and no LLM calls on any write, read or delete path.",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="section-gap" aria-label="Where memory belongs">
      <div className="container-site">
        <Reveal>
          <p className="kicker-label">Act 07 — Where it fits</p>
          <h2 className="h2-display max-w-[620px]">
            Memory belongs in the stack,
            <br />
            not in the prompt.
          </h2>
          <p className="lead-text">
            A memory layer between your model and your users — for anything where a forgotten
            preference is a real cost.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <Reveal key={card.title} delay={i * 0.06}>
                <div className="card-surface h-full p-6 transition-colors hover:border-[rgba(255,255,255,0.18)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(124,92,255,0.35)] bg-[rgba(124,92,255,0.1)] text-primary">
                    <Icon size={17} />
                  </span>
                  <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight text-text">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.75] text-muted">{card.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            Not a chat-log store · not vector-only · not a full assistant — a memory layer
          </p>
        </Reveal>
      </div>
    </section>
  );
}
