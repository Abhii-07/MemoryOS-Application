/**
 * Deterministic demo scenarios — one-click stories for the landing page.
 * Each reproduces a real engine concept. Used by components; the engine
 * itself stays a generic contract (no scenario knowledge inside it).
 */

export interface Scenario {
  id: string;
  title: string;
  description: string;
  /** Inputs fed to engine.ingest() in order. */
  inputs: string[];
  /** Optional query shown after ingests. */
  query?: string;
  tag: "supersession" | "contradiction" | "cold-start" | "pii" | "lineage";
}

export const SCENARIOS: Scenario[] = [
  {
    id: "scn_supersession",
    title: "Supersession",
    description: "A preference changes — the old value is superseded, not duplicated.",
    inputs: ["I prefer coffee.", "Actually, I switched to tea now."],
    query: "What do I like to drink?",
    tag: "supersession",
  },
  {
    id: "scn_contradiction",
    title: "Contradiction",
    description: "Two contradictory statements resolve at write time — never both retrieved.",
    inputs: ["My favourite colour is Blue.", "My favourite colour is Green."],
    query: "What is my favourite colour?",
    tag: "contradiction",
  },
  {
    id: "scn_coldstart",
    title: "Cold start",
    description: "A brand-new session — no memory is injected unless it actually exists.",
    inputs: ["Hello, how are you?"],
    query: "What does the user like to drink?",
    tag: "cold-start",
  },
  {
    id: "scn_pii",
    title: "PII scrub",
    description: "Private data is masked before persistence. It is never stored.",
    inputs: ["My number is +91 98765 43210, you can reach me there."],
    tag: "pii",
  },
  {
    id: "scn_lineage",
    title: "Lineage delete",
    description: "Deleting a memory propagates to every derived record. Nothing survives.",
    inputs: ["I live in Mumbai.", "I moved to Bangalore.", "Delete my location."],
    tag: "lineage",
  },
];
