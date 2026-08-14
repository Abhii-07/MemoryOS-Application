"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Memory,
  MemoryEvent,
  MemoryResponse,
  AuditEvent,
} from "@/lib/engine/MemoryEngine";
import { ApiMemoryEngine } from "@/lib/engine/ApiMemoryEngine";
import { ENGINE_MODE } from "@/lib/engine/config";
import { ChatPanel } from "./ChatPanel";

/**
 * LivePlayground — the REAL engine (Phase 5).
 *
 * Four panels, all driven through the MemoryEngine contract:
 *   - Message  : ingest a turn -> live admission event stream
 *   - Ask      : hybrid retrieval -> memories + reasons + real latency
 *   - Chat     : grounded LLM loop (query rewrite, confirm-to-remember)
 *   - Memories : active store -> per-memory audit trail
 *
 * Runs on ApiMemoryEngine when NEXT_PUBLIC_MEMORY_ENGINE=api and the FastAPI
 * service is up (server/run.ps1 -Start); otherwise honest "api offline".
 */

type Panel = "message" | "ask" | "chat" | "memories";

const SUGGESTED_MESSAGES = [
  "I prefer coffee over tea.",
  "Actually I switched to tea now.",
  "My favourite colour is green.",
  "I moved to Bangalore.",
];

const SUGGESTED_QUERIES = [
  "I prefer tea",
  "coffee or tea?",
  "building AI memory",
  "my favourite colour",
];

const EVENT_ICON: Record<string, string> = {
  ingest: "in",
  extract: "ex",
  pii: "pii",
  conflict: "cf",
  resolution: "rs",
  update: "up",
  noop: "no",
  retrieval: "rt",
  explain: "xp",
};

const EVENT_COLOR: Record<string, string> = {
  ingest: "text-muted",
  extract: "text-secondary",
  pii: "text-danger",
  conflict: "text-amber-400",
  resolution: "text-success",
  update: "text-success",
  noop: "text-faint",
  retrieval: "text-secondary",
  explain: "text-muted",
};

export function LivePlayground() {
  const [panel, setPanel] = useState<Panel>("message");
  const [connected, setConnected] = useState<boolean | null>(null);

  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<MemoryEvent[]>([]);
  const [ingesting, setIngesting] = useState(false);

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<MemoryResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const [ab, setAb] = useState<"idle" | "done">("idle");

  const [memories, setMemories] = useState<Memory[]>([]);
  const [audit, setAudit] = useState<AuditEvent[] | null>(null);
  const [auditFor, setAuditFor] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const eventBox = useRef<HTMLDivElement>(null);

  /* Playground is ALWAYS the real engine (S-001: landing page stays demo
     forever; getEngine()/ENGINE_MODE governs the landing page only). */
  const engine = ApiMemoryEngine.instance();

  /* connectivity probe: GET /healthz via the API engine base url */
  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_MEMORY_API_URL ?? "http://127.0.0.1:8000";
    fetch(`${base}/healthz`)
      .then((r) => setConnected(r.ok))
      .catch(() => setConnected(false));
  }, []);

  useEffect(() => {
    if (eventBox.current) {
      eventBox.current.scrollTop = eventBox.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    if (panel === "memories" && memories.length === 0 && connected) {
      engine
        .getMemories()
        .then(setMemories)
        .catch((e: Error) => setError(e.message));
    }
  }, [panel, connected, memories.length, engine]);

  async function handleIngest() {
    if (!message.trim() || ingesting) return;
    setIngesting(true);
    setError(null);
    try {
      const evts = await engine.ingest(message.trim());
      setEvents((prev) => [...prev, ...evts]);
      setMessage("");
      engine
        .getMemories()
        .then(setMemories)
        .catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ingest failed");
    } finally {
      setIngesting(false);
    }
  }

  async function handleAsk() {
    if (!query.trim() || asking) return;
    setAsking(true);
    setAb("idle");
    setError(null);
    try {
      setResponse(await engine.ask(query.trim()));
      setAb("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ask failed");
    } finally {
      setAsking(false);
    }
  }

  async function handleAudit(memoryId: string) {
    setAuditFor(memoryId);
    setAudit(null);
    try {
      setAudit(await engine.audit(memoryId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "audit failed");
    }
  }

  return (
    <main className="container-site flex flex-1 flex-col py-16">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker-label">Playground · live engine</p>
          <h1 className="mt-3 font-display text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">
            Talk to your memory.
          </h1>
          <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-muted">
            Every message hits the real engine — PostgreSQL 17 + pgvector,
            hybrid BM25 + dense retrieval, deterministic admission.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${
              connected === null
                ? "border-[rgba(255,255,255,0.15)] text-faint"
                : connected
                  ? "border-[rgba(94,230,168,0.4)] bg-[rgba(94,230,168,0.08)] text-success"
                  : "border-[rgba(255,122,168,0.35)] bg-[rgba(255,122,168,0.07)] text-danger"
            }`}
          >
            {connected === null
              ? "probing…"
              : connected
                ? `engine: ${ENGINE_MODE} · api online`
                : `engine: ${ENGINE_MODE} · api offline`}
          </span>
          {ENGINE_MODE !== "api" && (
            <p className="font-mono text-[10.5px] leading-relaxed text-faint">
              set NEXT_PUBLIC_MEMORY_ENGINE=api at build time
            </p>
          )}
        </div>
      </div>

      {/* panel switch */}
      <div className="mt-10 flex gap-2" role="tablist" aria-label="Playground panels">
        {(
          [
            ["message", "Message"],
            ["ask", "Ask"],
            ["chat", "Chat"],
            ["memories", "Memories"],
          ] as [Panel, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={panel === id}
            onClick={() => setPanel(id)}
            className={`rounded-md border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              panel === id
                ? "border-[rgba(124,92,255,0.5)] bg-[rgba(124,92,255,0.12)] text-text"
                : "border-[rgba(255,255,255,0.1)] bg-transparent text-faint hover:text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* error banner */}
      {error && (
        <div className="mt-6 rounded-lg border border-[rgba(255,122,168,0.35)] bg-[rgba(255,122,168,0.07)] px-4 py-3 font-mono text-[12px] text-danger">
          {error}
          <button
            className="ml-3 text-faint underline hover:text-text"
            onClick={() => setError(null)}
          >
            dismiss
          </button>
        </div>
      )}

      {/* panel: message */}
      {panel === "message" && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card-surface flex flex-col p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Ingest — admission pipeline
            </h2>
            <div
              ref={eventBox}
              className="mt-4 flex h-[380px] flex-col gap-2 overflow-y-auto pr-2"
              aria-live="polite"
            >
              {events.length === 0 && (
                <p className="pt-8 text-center font-mono text-[12px] text-faint">
                  no turns yet — say something below
                </p>
              )}
              {events.map((ev, i) => (
                <div
                  key={`${i}_${ev.detail}`}
                  className="flex items-start gap-2.5 animate-[panel-in_0.25s_ease]"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${
                      EVENT_COLOR[ev.kind] ?? "text-muted"
                    } border-current/20`}
                  >
                    {EVENT_ICON[ev.kind] ?? ev.kind.slice(0, 2)}
                  </span>
                  <p className="font-mono text-[12px] leading-relaxed text-muted">
                    {ev.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleIngest()}
                disabled={ingesting || connected === false}
                placeholder="e.g. Actually I switched to tea now."
                aria-label="Message for the engine"
                className="min-w-0 flex-1 rounded-md border border-[rgba(255,255,255,0.12)] bg-raised px-3.5 py-2.5 text-[13.5px] text-text outline-none placeholder:text-faint focus:border-[rgba(124,92,255,0.5)] disabled:opacity-50"
              />
              <button
                onClick={handleIngest}
                disabled={ingesting || connected === false || !message.trim()}
                className="btn-primary !px-5 !py-2.5 text-[13px] disabled:opacity-50"
              >
                {ingesting ? "…" : "Send"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_MESSAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setMessage(s)}
                  className="rounded-full border border-[rgba(255,255,255,0.1)] px-3 py-1 font-mono text-[10.5px] text-faint transition-colors hover:border-[rgba(124,92,255,0.4)] hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <aside className="card-surface h-fit p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              What happens per turn
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-[13px] leading-relaxed text-muted">
              <li>
                <span className="text-secondary">1 · PII pre-guardrail</span> —
                secrets are redacted before anything is stored, never after.
              </li>
              <li>
                <span className="text-secondary">2 · Admission</span> — ADD if
                new, UPDATE (supersede the slot) if a newer statement wins,
                NOOP for chit-chat, DELETE on consent.
              </li>
              <li>
                <span className="text-secondary">3 · Determinism</span> — no LLM
                anywhere on this path. Grammar + slot rules only.
              </li>
              <li>
                <span className="text-secondary">4 · Evidence</span> — provenance,
                confidence, and the superseded row are recorded, not just the
                outcome.
              </li>
            </ul>
          </aside>
        </section>
      )}

      {/* panel: ask */}
      {panel === "ask" && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card-surface flex flex-col p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Ask — hybrid retrieval
            </h2>
            <div className="mt-4 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                disabled={asking || connected === false}
                placeholder="e.g. coffee or tea?"
                aria-label="Query the engine"
                className="min-w-0 flex-1 rounded-md border border-[rgba(255,255,255,0.12)] bg-raised px-3.5 py-2.5 text-[13.5px] text-text outline-none placeholder:text-faint focus:border-[rgba(124,92,255,0.5)] disabled:opacity-50"
              />
              <button
                onClick={handleAsk}
                disabled={asking || connected === false || !query.trim()}
                className="btn-primary !px-5 !py-2.5 text-[13px] disabled:opacity-50"
              >
                {asking ? "…" : "Ask"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border border-[rgba(255,255,255,0.1)] px-3 py-1 font-mono text-[10.5px] text-faint transition-colors hover:border-[rgba(124,92,255,0.4)] hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3" aria-live="polite">
              {response === null && (
                <p className="pt-6 text-center font-mono text-[12px] text-faint">
                  ask a question — retrieval is tenant-scoped and deterministic
                </p>
              )}

              {/* A/B theater: same question, no-memory baseline vs MemoryOS */}
              {ab === "done" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[rgba(255,122,168,0.25)] bg-[rgba(255,122,168,0.05)] p-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-danger">
                      Baseline · no memory
                    </h3>
                    <p className="mt-2.5 font-mono text-[12.5px] leading-relaxed text-muted">
                      session resets every turn —{" "}
                      <span className="text-faint">nothing retained</span>
                    </p>
                    {response?.memories.length ? (
                      <p className="mt-2 font-mono text-[12px] text-faint">
                        I don&rsquo;t remember that — I can&rsquo;t.
                      </p>
                    ) : (
                      <p className="mt-2 font-mono text-[12px] text-faint">
                        I don&rsquo;t remember that — and nothing relevant
                        exists to remember anyway.
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-[rgba(94,230,168,0.3)] bg-[rgba(94,230,168,0.05)] p-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-success">
                      MemoryOS · real engine
                    </h3>
                    {response?.memories.length ? (
                      <ul className="mt-2.5 flex flex-col gap-1.5">
                        {response.memories.map((m) => (
                          <li key={m.id} className="font-mono text-[12.5px] text-text">
                            {m.value}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2.5 font-mono text-[12.5px] text-muted">
                        nothing above the relevance floor — said out loud,
                        never invented
                      </p>
                    )}
                  </div>
                </div>
              )}
              {response?.memories.map((m) => {
                const expl = response.explanation.find(
                  (x) => x.memoryId === m.id,
                );
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-[rgba(124,92,255,0.3)] bg-[rgba(124,92,255,0.06)] p-4 animate-[panel-in_0.25s_ease]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] leading-relaxed text-text">
                        {m.value}
                      </p>
                      <span className="shrink-0 rounded border border-[rgba(94,230,168,0.4)] bg-[rgba(94,230,168,0.08)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
                        {(expl?.score ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-faint">
                      {m.provenance} · conf {m.confidence.toFixed(2)} ·{" "}
                      <span className="text-secondary">{m.key}</span>
                    </p>
                    {expl && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {expl.reasons.map((r) => (
                          <li
                            key={r}
                            className="font-mono text-[10.5px] text-muted"
                          >
                            · {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {response && response.memories.length === 0 && (
                <p className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-raised p-4 font-mono text-[12px] text-faint">
                  nothing above the relevance floor — the engine said so, out
                  loud. EC-13 is a feature, not an error.
                </p>
              )}
              {response && (
                <p className="font-mono text-[10.5px] text-faint">
                  engine latency {response.latencyMs} ms · local embedder ·
                  fused rank (BM25 + dense, RRF)
                </p>
              )}
            </div>
          </div>

          <aside className="card-surface h-fit p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Why it answers this way
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-[13px] leading-relaxed text-muted">
              <li>
                <span className="text-secondary">Tenant pre-filter</span> —
                candidates only from your partition. No cross-tenant leakage,
                ever.
              </li>
              <li>
                <span className="text-secondary">Two signals</span> — BM25
                (lexical) and dense cosine (semantic), fused by RRF.
              </li>
              <li>
                <span className="text-secondary">Relevance floor</span> — a hit
                needs cosine ≥ 0.5 and shared terms; paraphrases need ≥ 0.75.
                Quiet rejection beats confident guessing.
              </li>
              <li>
                <span className="text-secondary">No LLM</span> — the retrieval
                path is fully deterministic.
              </li>
            </ul>
          </aside>
        </section>
      )}

      {panel === "chat" && (
        <ChatPanel engine={engine} connected={connected} onError={setError} />
      )}

      {/* panel: memories */}
      {panel === "memories" && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card-surface p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Active memory store
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {memories.length === 0 && (
                <p className="pt-6 text-center font-mono text-[12px] text-faint">
                  store empty — ingest a message first
                </p>
              )}
              {memories.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleAudit(m.id)}
                  className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    auditFor === m.id
                      ? "border-[rgba(124,92,255,0.5)] bg-[rgba(124,92,255,0.1)]"
                      : "border-[rgba(255,255,255,0.08)] bg-raised hover:border-[rgba(124,92,255,0.35)]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] text-text">{m.value}</p>
                    <p className="mt-1 font-mono text-[10.5px] text-faint">
                      {m.key} · {m.source} · conf {m.confidence.toFixed(2)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-[rgba(94,230,168,0.4)] bg-[rgba(94,230,168,0.08)] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-success">
                    {m.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="card-surface h-fit p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Audit trail
            </h2>
            {auditFor === null && (
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                Select a memory to open its lifecycle: every write is a fact —
                created, superseded, active, with timestamps.
              </p>
            )}
            {auditFor !== null && audit === null && (
              <p className="mt-4 font-mono text-[12px] text-faint">
                loading…
              </p>
            )}
            {audit && (
              <ol className="mt-4 flex flex-col gap-2.5">
                {audit.map((ev, i) => (
                  <li
                    key={`${ev.at}_${i}`}
                    className="flex gap-2.5 font-mono text-[11.5px] animate-[panel-in_0.25s_ease]"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                        ev.action === "ACTIVE"
                          ? "border-[rgba(94,230,168,0.4)] text-success"
                          : ev.action === "SUPERSEDED"
                            ? "border-[rgba(255,122,168,0.35)] text-danger"
                            : "border-[rgba(124,92,255,0.4)] text-secondary"
                      }`}
                    >
                      {ev.action}
                    </span>
                    <span className="text-muted">
                      <span className="text-faint">
                        {ev.at.slice(0, 16).replace("T", " ")}
                      </span>
                      <br />
                      {ev.detail}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}