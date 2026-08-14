"use client";

import { useState } from "react";
import type { Memory } from "@/lib/engine/MemoryEngine";
import { ApiMemoryEngine } from "@/lib/engine/ApiMemoryEngine";

/**
 * ChatPanel — the chat loop (S-014/S-015).
 *
 * Server side: retrieval → grounded LLM answer → candidate personal facts.
 * Client side: user CONFIRMS a candidate to remember (POST /ingest) — nothing
 * is auto-written. Query rewrite happens server-side; the searched phrasing is
 * shown as a hint so the demo is honest about what the engine matched on.
 */

interface Turn {
  id: number;
  user: string;
  answer: string;
  candidates: string[];
  memories: Memory[];
  rewrite: string;
  rewritten: boolean;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  remembered: Record<number, boolean>;
}

interface Props {
  engine: ApiMemoryEngine;
  connected: boolean | null;
  onError: (message: string) => void;
}

const SUGGESTED_STARTERS = [
  "I've started drinking chai every morning",
  "what do I drink now?",
  "I'm planning to run a half marathon in March",
  "do you know my plans?",
];

let nextId = 1;

export function ChatPanel({ engine, connected, onError }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<{ turn: number; cand: number } | null>(
    null,
  );

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    onError("");
    try {
      const res = await engine.chat(trimmed);
      setTurns((prev) => [
        ...prev,
        {
          id: nextId++,
          user: trimmed,
          answer: res.answer,
          candidates: res.candidates,
          memories: res.memories,
          rewrite: res.rewrite,
          rewritten: res.rewritten,
          provider: res.provider,
          model: res.model,
          latencyMs: res.latencyMs,
          remembered: {},
        },
      ]);
      setInput("");
    } catch (e) {
      onError(e instanceof Error ? e.message : "chat failed");
    } finally {
      setBusy(false);
    }
  }

  async function remember(turnId: number, candIdx: number, fact: string) {
    setSaving({ turn: turnId, cand: candIdx });
    onError("");
    try {
      await engine.ingest(fact);
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? { ...t, remembered: { ...t.remembered, [candIdx]: true } }
            : t,
        ),
      );
    } catch (e) {
      onError(e instanceof Error ? e.message : "remember failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="card-surface flex flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Chat — talk to your memory
          </h2>
          <button
            onClick={() => {
              engine.resetChat();
              setTurns([]);
            }}
            className="rounded-md border border-[rgba(255,255,255,0.12)] px-2.5 py-1.5 font-mono text-[11px] text-faint outline-none transition-colors hover:text-text focus-visible:ring focus-visible:ring-[rgba(124,92,255,0.5)]"
            aria-label="Reset conversation"
          >
            reset
          </button>
        </div>

        <div className="mt-4 flex min-h-[280px] flex-1 flex-col gap-4" aria-live="polite">
          {turns.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
              <p className="max-w-sm text-center font-mono text-[12px] leading-relaxed text-faint">
                each turn is grounded in retrieved evidence · the model never
                invents · new facts appear as candidate chips — you choose what
                to remember
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy || connected === false}
                    className="rounded-full border border-[rgba(255,255,255,0.14)] bg-raised px-3 py-1.5 font-mono text-[11px] text-muted outline-none transition-colors hover:border-[rgba(124,92,255,0.5)] hover:text-text focus-visible:ring focus-visible:ring-[rgba(124,92,255,0.5)] disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t) => (
            <article key={t.id} className="animate-[panel-in_0.25s_ease]">
              <p className="text-right font-mono text-[11px] text-faint">{t.user}</p>
              <div className="mt-1.5 rounded-lg border border-[rgba(124,92,255,0.3)] bg-[rgba(124,92,255,0.06)] p-4">
                <p className="text-[14px] leading-relaxed text-text">{t.answer}</p>
                <p className="mt-2.5 font-mono text-[10.5px] text-faint">
                  <span className="text-secondary">
                    {t.provider}/{t.model}
                  </span>{" "}
                  · engine {t.latencyMs} ms· searched{" "}
                  <span className="text-muted">
                    “{t.rewrite}”{t.rewritten ? " (rewritten)" : ""}
                  </span>
                  {t.memories.length
                    ? ` · ${t.memories.length} memory(ies) grounded`
                    : " · no relevant memory — answered honestly"}
                </p>

                {t.memories.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5 border-t border-[rgba(255,255,255,0.08)] pt-3">
                    {t.memories.map((m) => (
                      <li key={m.id} className="font-mono text-[11px] text-muted">
                        · {m.value}{" "}
                        <span className="text-faint">
                          ({m.provenance.slice(0, 42)}
                          {m.provenance.length > 42 ? "…" : ""})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {t.candidates.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-faint">
                      remember?
                    </span>
                    {t.candidates.map((c, i) =>
                      t.remembered[i] ? (
                        <span
                          key={i}
                          className="font-mono text-[11px] text-success"
                        >
                          ✓ saved
                        </span>
                      ) : (
                        <button
                          key={i}
                          onClick={() => remember(t.id, i, c)}
                          disabled={saving !== null}
                          className="rounded-full border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.07)] px-2.5 py-1 font-mono text-[11px] text-success outline-none transition-colors hover:border-[rgba(74,222,128,0.7)] focus-visible:ring focus-visible:ring-[rgba(74,222,128,0.5)] disabled:opacity-50"
                        >
                          {saving?.turn === t.id && saving.cand === i
                            ? "…"
                            : "+ remember"}
                          <span className="ml-1 opacity-70">{c}</span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            disabled={busy || connected === false}
            placeholder="tell it something, or ask it to recall…"
            aria-label="Chat message"
            className="min-w-0 flex-1 rounded-md border border-[rgba(255,255,255,0.12)] bg-raised px-3.5 py-2.5 text-[13.5px] text-text outline-none placeholder:text-faint focus:border-[rgba(124,92,255,0.5)] disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={busy || connected === false || !input.trim()}
            className="btn-primary !px-5 !py-2.5 text-[13px] disabled:opacity-50"
          >
            {busy ? "…" : "Send"}
          </button>
        </div>
      </div>

      <aside className="card-surface h-fit p-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          How the loop works
        </h2>
        <ul className="mt-4 flex flex-col gap-3 text-[13px] leading-relaxed text-muted">
          <li>
            <span className="text-secondary">1 · Rewrite</span> — your query is
            rephrased into keyword-rich variants; the retriever scores all and
            keeps the best (floor still applies — no hallucinated hits).
          </li>
          <li>
            <span className="text-secondary">2 · Ground</span> — evidence block
            (provenance, confidence, scores) is injected into the model prompt
            verbatim; answer comes from evidence only, never invented.
          </li>
          <li>
            <span className="text-secondary">3 · Extract</span> — personal facts
            you stated this turn become candidate chips. Nothing is written
            until you click — memory writes stay explicit (S-014).
          </li>
          <li>
            <span className="text-secondary">4 · Remember</span> — saved facts
            go through the real pipeline: extraction → conflict detection →
            supersession. Ask again next turn and it retrieves instantly.
          </li>
        </ul>
      </aside>
    </section>
  );
}