"use client";

import { useState } from "react";
import { ScrollText, GitCompareArrows, Trash2, EyeOff, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * Act 06 — Trust / Proof (spec §20).
 * Four interactive capability cards; each opens a technical explanation.
 */

const CARDS = [
  {
    icon: ScrollText,
    title: "Provenance",
    question: "Where did this memory come from?",
    body: "Every memory records its source (user_stated, system, or derived), a confidence score and a timestamp. Retrieval returns the memory together with the reason it was selected — so an answer can always be traced back to a specific stored record.",
  },
  {
    icon: GitCompareArrows,
    title: "Supersession",
    question: "What changed?",
    body: "When a new statement conflicts with an existing one in the same semantic slot, the engine resolves at write time: the newer explicit statement becomes ACTIVE and the old value is marked SUPERSEDED — it stays in history for audit, but it can never be retrieved as current fact.",
  },
  {
    icon: Trash2,
    title: "Forgetting",
    question: "What was deleted?",
    body: "Deletion is lineage-aware. Removing a memory also removes every derived or related record that references it, and leaves a tombstone in the audit log. What was deleted stays deleted — and the deletion itself is documented.",
  },
  {
    icon: EyeOff,
    title: "Privacy",
    question: "What was never stored?",
    body: "PII is masked before persistence. Email addresses and phone numbers are detected during extraction and stored as [EMAIL] / [PHONE] placeholders — the raw value never reaches the store, so it cannot leak later.",
  },
];

export function TrustSection() {
  const [openCard, setOpenCard] = useState<string | null>(null);

  return (
    <section id="trust" className="section-gap" aria-label="Trust and proof">
      <div className="container-site">
        <Reveal>
          <p className="kicker-label">Act 06 — Trust</p>
          <h2 className="h2-display max-w-[620px]">
            Your AI remembers.
            <br />
            But can you prove what it remembers?
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {CARDS.map((card, i) => {
            const open = openCard === card.title;
            const Icon = card.icon;
            return (
              <Reveal key={card.title} delay={i * 0.06}>
                <div
                  className={`card-surface h-full p-6 transition-colors ${
                    open ? "border-[rgba(124,92,255,0.4)]" : "hover:border-[rgba(255,255,255,0.18)]"
                  }`}
                >
                  <button
                    onClick={() => setOpenCard(open ? null : card.title)}
                    className="flex w-full items-start gap-4 text-left"
                    aria-expanded={open}
                    aria-controls={`card-${card.title}`}
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(124,92,255,0.35)] bg-[rgba(124,92,255,0.1)] text-primary">
                      <Icon size={17} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between">
                        <span className="font-display text-[17px] font-semibold tracking-tight text-text">
                          {card.title}
                        </span>
                        <ChevronDown
                          size={15}
                          className="text-faint transition-transform duration-200"
                          style={{ transform: open ? "rotate(180deg)" : "none" }}
                        />
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-muted">
                        {card.question}
                      </span>
                    </span>
                  </button>

                  {open && (
                    <p
                      id={`card-${card.title}`}
                      className="mt-4 border-t border-[rgba(255,255,255,0.08)] pt-4 text-[13px] leading-[1.75] text-muted"
                    >
                      {card.body}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* metrics band — real numbers only (§21) */}
        <Reveal delay={0.1}>
          <div className="mt-16 rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary">
                  Measured, not marketed
                </p>
                <p className="mt-3 max-w-[380px] text-[13.5px] leading-relaxed text-muted">
                  Numbers below come from the engine&rsquo;s own acceptance benchmark — the
                  D3 replay suite that ships with the repository.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {[
                  ["11 ms", "p95 retrieval"],
                  ["0.0%", "contradictions"],
                  ["0.0%", "PII leakage"],
                  ["97", "passing tests"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dd className="font-display text-[30px] font-bold tracking-tight text-text">{v}</dd>
                    <dt className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
                      {l}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mt-8 border-t border-[rgba(255,255,255,0.08)] pt-5 font-mono text-[11px] leading-relaxed text-faint">
              AUDITABLE · DETERMINISTIC · TRACEABLE · PRIVACY-AWARE
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
