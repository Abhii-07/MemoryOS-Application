import type {
  Memory,
  MemoryEvent,
  MemoryEventKind,
  MemoryResponse,
  MemorySource,
  MemoryState,
  AuditEvent,
  MemoryEngine,
  MemoryType,
} from "./MemoryEngine";

/**
 * DemoMemoryEngine — deterministic, seed-data-backed implementation of the
 * MemoryEngine contract. Used by the landing page (forever). Reproduces real
 * engine semantics: ingest → extraction → conflict → supersession → active →
 * retrieval → provenance/audit. No randomness, no dates, no network.
 */

interface SlotRecord {
  memory: Memory;
  history: { value: string; until: string }[];
}

const NOW = "2026-08-11T09:00:00Z";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?\d[\d\s-]{8,}\d)/;

class DemoMemoryEngine implements MemoryEngine {
  private slots = new Map<string, SlotRecord>();
  private seq = 0;

  constructor() {
    this.seed();
  }

  /* ── seed graph (deterministic starter memories) ─────────── */
  private seed(): void {
    this.put(
      "mem_8f3a92",
      "preference",
      "preference.drink",
      "tea",
      "user_stated",
      0.94,
      "ACTIVE",
      'user stated: "Actually I switched to tea now."',
      [{ value: "coffee", until: "2026-07-21T14:02:00Z" }],
    );
    this.put(
      "mem_b21c44",
      "preference",
      "preference.color",
      "green",
      "user_stated",
      0.88,
      "ACTIVE",
      'user stated: "my favourite colour is Green."',
      [{ value: "blue", until: "2026-06-03T10:11:00Z" }],
    );
    this.put(
      "mem_77e0b1",
      "fact",
      "fact.location",
      "Bangalore",
      "user_stated",
      0.96,
      "ACTIVE",
      'user stated: "I moved to Bangalore."',
      [{ value: "Mumbai", until: "2026-04-18T18:45:00Z" }],
    );
    this.put(
      "mem_1d9c02",
      "habit",
      "habit.workout",
      "daily morning run",
      "assistant_generated",
      0.72,
      "ACTIVE",
      "derived from 3 conversations about fitness",
    );
    this.put(
      "mem_5e4a77",
      "project",
      "project.memoryos",
      "building memory infrastructure for AI",
      "user_stated",
      0.9,
      "ACTIVE",
      'user stated: "I am building memory infrastructure for AI."',
    );
    this.put(
      "mem_9b6d10",
      "relationship",
      "relationship.sister",
      "Anisha",
      "user_stated",
      0.91,
      "ACTIVE",
      'user stated: "my sister Anisha studies design."',
    );
    this.put(
      "mem_c3e8f5",
      "constraint",
      "constraint.nutrition",
      "avoids dairy",
      "user_stated",
      0.83,
      "ACTIVE",
      'user stated: "I avoid dairy, it does not suit me."',
    );
  }

  private put(
    mid: string,
    type: MemoryType,
    key: string,
    value: string,
    source: MemorySource,
    confidence: number,
    status: MemoryState,
    provenance: string,
    history: { value: string; until: string }[] = [],
  ): void {
    this.slots.set(key, {
      memory: {
        id: mid,
        type,
        key,
        value,
        source,
        confidence,
        status,
        createdAt: "2026-07-21T14:02:00Z",
        updatedAt: NOW,
        provenance,
      },
      history,
    });
  }

  /* ── extraction rules (deterministic, regex-based) ───────── */
  private extract(input: string): { type: MemoryType; key: string; value: string } | null {
    const t = input.toLowerCase();
    const drink = t.match(/(?:like|love|prefer|enjoy|drink|switched to|stopped)\s+(?:drinking\s+)?(coffee|tea|milk|juice|water)/);
    if (drink) return { type: "preference", key: "preference.drink", value: drink[1] };

    const color = t.match(/(?:favourite|favorite|like|love)\s*(?:colour|color)[^.]*?(blue|green|red|black|white)/);
    if (color) return { type: "preference", key: "preference.color", value: color[1] };

    const location = t.match(/(?:live in|moved to|shifted to|now in)\s+([a-z][a-z\s]{1,20})/);
    if (location) return { type: "fact", key: "fact.location", value: location[1].trim() };

    const goal = t.match(/(?:want to|aiming to|planning to|going to)\s+(.{4,40})/);
    if (goal) return { type: "goal", key: "goal.next", value: goal[1].trim() };

    return null;
  }

  private scrub(input: string): { pii: boolean; clean: string; found: string[] } {
    const found: string[] = [];
    let clean = input;
    if (EMAIL_RE.test(input)) {
      clean = clean.replace(EMAIL_RE, "[EMAIL]");
      found.push("EMAIL");
    }
    if (PHONE_RE.test(input)) {
      clean = clean.replace(PHONE_RE, "[PHONE]");
      found.push("PHONE");
    }
    return { pii: found.length > 0, clean, found };
  }

  /* ── MemoryEngine contract ───────────────────────────────── */
  async ingest(input: string): Promise<MemoryEvent[]> {
    const events: MemoryEvent[] = [];
    let t = 0;
    const push = (kind: MemoryEventKind, detail: string, extra?: Partial<MemoryEvent>) => {
      events.push({ id: `evt_${++this.seq}`, kind, detail, atMs: t, ...extra });
      t += 240;
    };

    push("ingest", `ingest: "${input}"`);

    const { pii, clean, found } = this.scrub(input);
    if (pii) {
      push("pii", `pii scan → ${found.join(", ")} masked: "${clean}"`);
      push("extract", "no memory extracted from scrubbed content");
      push("noop", "nothing stored · private content never persisted");
      return events;
    }

    const ext = this.extract(clean);
    if (!ext) {
      push("extract", "no long-term memory detected");
      push("noop", "chit-chat · admission: NOOP");
      return events;
    }

    const slotKey = ext.key;
    push("extract", `extract → ${slotKey} = "${ext.value}"`, { slotKey });

    const existing = this.slots.get(slotKey);
    if (!existing) {
      const mid = `mem_${(0x100 + this.seq * 7).toString(16)}`;
      const mem: Memory = {
        id: mid,
        type: ext.type,
        key: slotKey,
        value: ext.value,
        source: "user_stated",
        confidence: 0.94,
        status: "NEW",
        createdAt: NOW,
        updatedAt: NOW,
        provenance: `user stated: "${input}"`,
      };
      this.slots.set(slotKey, { memory: mem, history: [] });
      push("update", `NEW stored · ${slotKey} = "${ext.value}"`, { slotKey, newValue: ext.value });
      push("update", "provenance: user_stated · confidence 0.94", { slotKey });
      return events;
    }

    if (existing.memory.value.toLowerCase() === ext.value.toLowerCase()) {
      push("conflict", `no change · "${ext.value}" already active`, { slotKey });
      push("noop", "admission: NOOP · slot unchanged");
      return events;
    }

    push("conflict", `conflict · existing "${existing.memory.value}"`, {
      slotKey,
      oldValue: existing.memory.value,
      newValue: ext.value,
    });
    push("resolution", `resolution · newer explicit user statement wins`, {
      slotKey,
      oldValue: existing.memory.value,
      newValue: ext.value,
    });

    const oldMem = existing.memory;
    oldMem.status = "SUPERSEDED";
    const updated: Memory = {
      id: `mem_${(0x100 + this.seq * 7 + 1).toString(16)}`,
      type: ext.type,
      key: slotKey,
      value: ext.value,
      source: "user_stated",
      confidence: 0.94,
      status: "ACTIVE",
      createdAt: oldMem.createdAt,
      updatedAt: NOW,
      provenance: `user stated: "${input}"`,
    };
    existing.history.push({ value: oldMem.value, until: NOW });
    this.slots.set(slotKey, { memory: updated, history: existing.history });

    push("update", `superseded "${oldMem.value}" → "${ext.value}" active`, {
      slotKey,
      oldValue: oldMem.value,
      newValue: ext.value,
    });
    push("update", "provenance: user_stated · confidence 0.94", { slotKey });
    return events;
  }

  async ask(query: string): Promise<MemoryResponse> {
    const q = query.toLowerCase();
    const hits: Memory[] = [];
    const explanation: MemoryResponse["explanation"] = [];

    for (const { memory } of this.slots.values()) {
      if (memory.status !== "ACTIVE") continue;
      let score = 0;
      const reasons: string[] = [];
      const terms = q.split(/\s+/).filter((w) => w.length > 2);

      const anyTerm = terms.some((w) => memory.key.includes(w) || memory.value.toLowerCase().includes(w));
      if (anyTerm) {
        score += 0.55;
        reasons.push("slot-key overlap (BM25)");
      }
      if (memory.key.includes("preference") && /like|prefer|drink|colour|color/.test(q)) {
        score += 0.25;
        reasons.push("semantic affinity (dense)");
      }
      if (memory.type === "fact" && /where|live|location/.test(q)) {
        score += 0.3;
        reasons.push("type-matched intent");
      }
      if (memory.source === "user_stated") {
        score += 0.2;
        reasons.push("provenance: user_stated");
      }
      if (score >= 0.5) {
        hits.push(memory);
        explanation.push({
          memoryId: memory.id,
          score: Math.min(0.98, Math.round((0.55 + score / 4) * 100) / 100),
          reasons,
        });
      }
    }

    return {
      query,
      memories: hits,
      explanation: explanation.sort((a, b) => b.score - a.score).slice(0, 3),
      latencyMs: 11,
    };
  }

  async getMemories(): Promise<Memory[]> {
    return [...this.slots.values()]
      .map((s) => s.memory)
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async audit(memoryId: string): Promise<AuditEvent[]> {
    for (const { memory, history } of this.slots.values()) {
      if (memory.id !== memoryId) continue;
      const trail: AuditEvent[] = [];
      for (const h of history) {
        trail.push({
          memoryId,
          action: "SUPERSEDED",
          at: h.until,
          detail: `${memory.key} = "${h.value}" → superseded`,
        });
      }
      trail.push({ memoryId, action: "CREATED", at: memory.createdAt, detail: `${memory.key} = "${memory.value}"` });
      trail.push({ memoryId, action: "ACTIVE", at: memory.updatedAt, detail: `latest update · confidence ${memory.confidence}` });
      return trail;
    }
    return [];
  }
}

export { DemoMemoryEngine };
