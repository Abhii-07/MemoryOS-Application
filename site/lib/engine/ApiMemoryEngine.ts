import type {
  Memory,
  MemoryEvent,
  MemoryResponse,
  AuditEvent,
  MemoryEngine,
} from "./MemoryEngine";

/**
 * ApiMemoryEngine — Phase 5.
 *
 * Implements the exact same MemoryEngine contract against the FastAPI
 * service (POST /ingest · POST /ask · GET /memory · GET /audit), which wraps
 * the real memory_os engine + Postgres/pgvector. Used by /playground only;
 * the landing page stays on DemoMemoryEngine forever.
 *
 * Not implemented yet — constructing it throws.
 */
export class ApiMemoryEngine implements MemoryEngine {
  private constructor() {}

  static instance(): ApiMemoryEngine {
    throw new Error(
      "ApiMemoryEngine is not implemented yet (Phase 5). Set NEXT_PUBLIC_MEMORY_ENGINE=api only when the FastAPI service exists.",
    );
  }

  ingest(input: string): Promise<MemoryEvent[]> {
    throw new Error(`ApiMemoryEngine.ingest is not implemented yet (Phase 5) — got: "${input}"`);
  }
  ask(query: string): Promise<MemoryResponse> {
    throw new Error(`ApiMemoryEngine.ask is not implemented yet (Phase 5) — got: "${query}"`);
  }
  getMemories(): Promise<Memory[]> {
    throw new Error("ApiMemoryEngine.getMemories is not implemented yet (Phase 5)");
  }
  audit(memoryId: string): Promise<AuditEvent[]> {
    throw new Error(`ApiMemoryEngine.audit is not implemented yet (Phase 5) — got: "${memoryId}"`);
  }
}
