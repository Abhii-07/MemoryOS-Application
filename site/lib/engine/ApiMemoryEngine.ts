import type {
  Memory,
  MemoryEvent,
  MemoryEventKind,
  MemoryResponse,
  AuditEvent,
  AssistResponse,
  MemoryEngine,
} from "./MemoryEngine";

/**
 * ApiMemoryEngine — Phase 5 REAL engine client.
 *
 * Implements the exact same MemoryEngine contract against the FastAPI
 * service (POST /ingest · POST /ask · GET /memory · GET /audit), which wraps
 * the real memory_os engine + Postgres/pgvector. Used by /playground only;
 * the landing page stays on DemoMemoryEngine forever.
 *
 * Event pacing: the server returns a deterministic ordered event stream; atMs
 * offsets are synthesized here (240 ms steps) to drive the same animation
 * sequencing the demo engine produces.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_MEMORY_API_URL ?? "http://127.0.0.1:8000";

const EVENT_KIND: Record<string, MemoryEventKind> = {
  ingest: "ingest",
  extract: "extract",
  pii: "pii",
  conflict: "conflict",
  resolution: "resolution",
  update: "update",
  retrieval: "retrieval",
  explain: "explain",
  noop: "noop",
};

interface ServerEvent {
  kind: string;
  detail: string;
  slotKey?: string;
  oldValue?: string;
  newValue?: string;
}

interface ServerMemory {
  id: string;
  type: Memory["type"];
  key: string;
  value: string;
  source: Memory["source"];
  confidence: number;
  status: Memory["status"];
  createdAt: string;
  updatedAt: string;
  provenance: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`api ${res.status} ${path}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export class ApiMemoryEngine implements MemoryEngine {
  private static _instance: ApiMemoryEngine | null = null;

  static instance(): ApiMemoryEngine {
    ApiMemoryEngine._instance ??= new ApiMemoryEngine();
    return ApiMemoryEngine._instance;
  }

  async ingest(input: string): Promise<MemoryEvent[]> {
    const res = await request<{ events: ServerEvent[] }>("/ingest", {
      method: "POST",
      body: JSON.stringify({ input }),
    });
    return res.events.map((e, i) => ({
      id: `evt_api_${i}`,
      kind: EVENT_KIND[e.kind] ?? "update",
      detail: e.detail,
      slotKey: e.slotKey,
      oldValue: e.oldValue,
      newValue: e.newValue,
      atMs: i * 240,
    }));
  }

  async ask(query: string): Promise<MemoryResponse> {
    const res = await request<{
      query: string;
      memories: ServerMemory[];
      explanation: { memoryId: string; score: number; reasons: string[] }[];
      latency_ms: number;
    }>("/ask", { method: "POST", body: JSON.stringify({ query }) });
    return {
      query: res.query,
      memories: res.memories.map((m) => this.toMemory(m)),
      explanation: res.explanation,
      latencyMs: res.latency_ms,
    };
  }

  async getMemories(): Promise<Memory[]> {
    const res = await request<{ memories: ServerMemory[] }>("/memory");
    return res.memories.map((m) => this.toMemory(m));
  }

  async audit(memoryId: string): Promise<AuditEvent[]> {
    const res = await request<{ events: AuditEvent[] }>(
      `/audit?memory_id=${encodeURIComponent(memoryId)}`,
    );
    return res.events;
  }

  async assist(query: string, provider?: string): Promise<AssistResponse> {
    const res = await request<{
      query: string;
      answer: string;
      provider: string | null;
      model: string | null;
      memories: ServerMemory[];
      latency_ms: number;
    }>("/assist", {
      method: "POST",
      body: JSON.stringify(provider ? { query, provider } : { query }),
    });
    return {
      query: res.query,
      answer: res.answer,
      provider: res.provider,
      model: res.model,
      memories: res.memories.map((m) => this.toMemory(m)),
      latencyMs: res.latency_ms,
    };
  }

  async listProviders(): Promise<
    { name: string; model: string; configured: boolean }[]
  > {
    const res = await request<{
      providers: { name: string; model: string; configured: boolean }[];
      active: string | null;
    }>("/assist/providers");
    return res.providers;
  }

  private toMemory(m: ServerMemory): Memory {
    return {
      id: m.id,
      type: m.type,
      key: m.key,
      value: m.value,
      source: m.source,
      confidence: m.confidence,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      provenance: m.provenance,
    };
  }
}