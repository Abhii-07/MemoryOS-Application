import type { MemoryEngine } from "./MemoryEngine";
import { DemoMemoryEngine } from "./DemoMemoryEngine";
import { ApiMemoryEngine } from "./ApiMemoryEngine";

/**
 * DEMO ↔ REAL switch (decision S-002).
 *
 *  - "demo" (default): deterministic DemoMemoryEngine — landing page.
 *  - "api" (Phase 5):   ApiMemoryEngine over the FastAPI service — /playground.
 *
 * The UI never references engines directly; call getEngine().
 */
export type EngineMode = "demo" | "api";

export const ENGINE_MODE: EngineMode =
  (process.env.NEXT_PUBLIC_MEMORY_ENGINE as EngineMode | undefined) ?? "demo";

let demo: DemoMemoryEngine | null = null;

export function getEngine(): MemoryEngine {
  if (ENGINE_MODE === "api") {
    return ApiMemoryEngine.instance();
  }
  demo ??= new DemoMemoryEngine();
  return demo;
}
