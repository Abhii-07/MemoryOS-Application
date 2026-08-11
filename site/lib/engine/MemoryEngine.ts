/**
 * MemoryEngine — the single contract between the UI and a memory engine.
 *
 * The UI never knows which engine it talks to. Switching DEMO ↔ REAL is a
 * config-level change (lib/engine/config.ts), never UI rewiring.
 *
 * Implementations:
 *  - DemoMemoryEngine (deterministic, used by the landing page — forever)
 *  - ApiMemoryEngine   (Phase 5: real engine over FastAPI, used by /playground)
 *
 * Semantics mirror the real memory_os engine:
 * ingest → extraction → conflict detection → supersession → active memory
 * → retrieval → provenance/audit.
 */

export type MemoryState =
  | "NEW"
  | "ACTIVE"
  | "SUPERSEDED"
  | "DELETED"
  | "REDACTED"
  | "CONFLICT";

export type MemorySource =
  | "user_stated"
  | "assistant_generated"
  | "tool_derived"
  | "retrieved_document";

export type MemoryType =
  | "preference"
  | "goal"
  | "fact"
  | "constraint"
  | "habit"
  | "relationship"
  | "project"
  | "location"
  | "instruction";

export interface Memory {
  id: string;
  type: MemoryType;
  /** Slot key, e.g. "preference.drink" — supersession happens per slot. */
  key: string;
  value: string;
  source: MemorySource;
  confidence: number;
  status: MemoryState;
  createdAt: string;
  updatedAt: string;
  /** Human-readable evidence, e.g. `user stated: "I switched to tea"`. */
  provenance: string;
}

export type MemoryEventKind =
  | "ingest"
  | "extract"
  | "pii"
  | "conflict"
  | "resolution"
  | "update"
  | "retrieval"
  | "explain"
  | "noop";

export interface MemoryEvent {
  id: string;
  kind: MemoryEventKind;
  detail: string;
  slotKey?: string;
  oldValue?: string;
  newValue?: string;
  /** Relative ms offset after ingest start — drives animation sequencing. */
  atMs: number;
}

export interface RetrievalReason {
  memoryId: string;
  score: number;
  reasons: string[];
}

export interface MemoryResponse {
  query: string;
  memories: Memory[];
  explanation: RetrievalReason[];
  latencyMs: number;
}

export interface AuditEvent {
  memoryId: string;
  action: string;
  at: string;
  detail: string;
}

export interface MemoryEngine {
  ingest(input: string): Promise<MemoryEvent[]>;
  ask(query: string): Promise<MemoryResponse>;
  getMemories(): Promise<Memory[]>;
  audit(memoryId: string): Promise<AuditEvent[]>;
}
