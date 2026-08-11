"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { X, List, Share2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * Act 03 — Interactive Memory Globe (spec §14–15).
 *
 * A compact, approximately spherical "knowledge sphere": Canvas 2D with a
 * lightweight 2.5D projection. MEMORY ENGINE sits at the center, five
 * semantic category hubs (PREFERENCES · HABITS · LOCATION · PROJECTS ·
 * CONTEXT) sit at mid-depth, and memories cluster around their category —
 * dense toward the core, sparser at the organic, irregular rim.
 *
 * Depth illusion: nearer nodes are larger / brighter, farther nodes smaller
 * and dimmer. The whole sphere very slowly rotates (~0.4°/s) plus a faint
 * tilt, so clusters move as one living system.
 *
 * The coffee → tea story plays as a demo timeline: coffee appears ("I prefer
 * coffee."), tea enters ("I switched to tea."), CONFLICT DETECTED flashes the
 * coffee↔tea edge, then coffee is visually superseded (smaller, dimmer,
 * struck, pink) while tea brightens — the product's core story.
 *
 * Perf / a11y rules honored:
 *  - no React state per frame (refs only inside the rAF loop)
 *  - IntersectionObserver + tab-visibility pauses (§27–28)
 *  - reduced motion → static sphere, final demo state, no loop (§29)
 *  - mobile: node subset, no hover/proximity, tap to inspect (§30)
 *  - fixed-height centered stage → zero layout shift
 *  - "view as list" stays as the keyboard alternative (§49)
 */

type GState = "NEW" | "ACTIVE" | "SUPERSEDED" | "DELETED" | "REDACTED" | "CONFLICT";

interface NodeData {
  id: string;
  type: string;
  key: string;
  value: string;
  source: string;
  confidence: number | null;
  state: GState;
  cat: string;
}

const CATEGORIES = ["PREFERENCES", "HABITS", "LOCATION", "PROJECTS", "CONTEXT"];

// Deterministic demo dataset — mirrors the DemoMemoryEngine slots (§14).
// Every leaf belongs to one semantic category; ids match the engine's `mem_*`.
const NODES: NodeData[] = [
  { id: "mem_116", type: "preference", key: "drink", value: "tea", source: "user_stated", confidence: 0.94, state: "ACTIVE", cat: "PREFERENCES" },
  { id: "mem_117", type: "preference", key: "drink", value: "coffee", source: "user_stated", confidence: 0.88, state: "SUPERSEDED", cat: "PREFERENCES" },
  { id: "mem_11d", type: "preference", key: "color", value: "green", source: "user_stated", confidence: 0.91, state: "ACTIVE", cat: "PREFERENCES" },
  { id: "mem_15c", type: "preference", key: "music", value: "indie", source: "user_stated", confidence: 0.79, state: "CONFLICT", cat: "PREFERENCES" },
  { id: "mem_15d", type: "preference", key: "music", value: "jazz", source: "user_stated", confidence: 0.78, state: "SUPERSEDED", cat: "PREFERENCES" },
  { id: "mem_12b", type: "habit", key: "workout", value: "mornings", source: "user_stated", confidence: 0.88, state: "ACTIVE", cat: "HABITS" },
  { id: "mem_155", type: "habit", key: "meditation", value: "nightly", source: "user_stated", confidence: 0.84, state: "NEW", cat: "HABITS" },
  { id: "mem_124", type: "fact", key: "location", value: "Bangalore", source: "user_stated", confidence: 0.97, state: "ACTIVE", cat: "LOCATION" },
  { id: "mem_125", type: "fact", key: "location", value: "Mumbai", source: "user_stated", confidence: 0.93, state: "SUPERSEDED", cat: "LOCATION" },
  { id: "mem_14e", type: "fact", key: "availability", value: "evenings", source: "user_stated", confidence: 0.86, state: "ACTIVE", cat: "LOCATION" },
  { id: "mem_132", type: "project", key: "memoryos", value: "engine core", source: "user_stated", confidence: 0.92, state: "ACTIVE", cat: "PROJECTS" },
  { id: "mem_178", type: "project", key: "website", value: "showcase", source: "user_stated", confidence: 0.9, state: "ACTIVE", cat: "PROJECTS" },
  { id: "mem_139", type: "relationship", key: "sister", value: "Anisha", source: "user_stated", confidence: 0.95, state: "ACTIVE", cat: "CONTEXT" },
  { id: "mem_16a", type: "fact", key: "pet", value: "Mochi", source: "user_stated", confidence: 0.87, state: "REDACTED", cat: "CONTEXT" },
  { id: "mem_171", type: "fact", key: "payment", value: "[REDACTED]", source: "user_stated", confidence: null, state: "REDACTED", cat: "CONTEXT" },
  { id: "mem_17f", type: "fact", key: "birthday", value: "Aug 3", source: "user_stated", confidence: 0.94, state: "DELETED", cat: "CONTEXT" },
  { id: "mem_186", type: "session", key: "context", value: "user_123", source: "system", confidence: 0.99, state: "ACTIVE", cat: "CONTEXT" },
  { id: "mem_147", type: "instruction", key: "respond", value: "be brief", source: "user_stated", confidence: 0.89, state: "ACTIVE", cat: "CONTEXT" },
];

// Semantic links — supersession pairs plus grounded intra-cluster bonds.
// No filler: every link is a real memory relationship.
const LINKS: Array<[string, string]> = [
  ["mem_116", "mem_117"], // tea ↔ coffee (supersession)
  ["mem_124", "mem_125"], // Bangalore ↔ Mumbai (supersession)
  ["mem_15c", "mem_15d"], // indie ↔ jazz (supersession)
  ["mem_11d", "mem_15c"], // color ↔ music (preference cluster)
  ["mem_12b", "mem_155"], // workout ↔ meditation (habits)
  ["mem_124", "mem_14e"], // location ↔ availability (facts)
  ["mem_132", "mem_178"], // memoryos ↔ website (projects)
  ["mem_139", "mem_16a"], // sister ↔ pet (relationship)
  ["mem_186", "mem_147"], // session ↔ instruction
];

// Mobile subset (~10 leaves): the story pair plus varied, meaningful memories.
const MOBILE_IDS = new Set([
  "mem_116", "mem_117", "mem_11d", "mem_124", "mem_125",
  "mem_12b", "mem_132", "mem_139", "mem_186", "mem_147",
]);

const HUB: NodeData = {
  id: "hub",
  type: "system",
  key: "core",
  value: "MEMORY ENGINE",
  source: "system",
  confidence: 0.99,
  state: "ACTIVE",
  cat: "engine",
};

const STAGE_HEIGHT = "clamp(480px, 68vh, 680px)";
const ROT_SPEED = 0.0000075; // rad/ms ≈ 0.43°/s — imperceptibly slow
const C_INDIGO = "#7c5cff";
const C_CYAN = "#8fe7ff";

const STATE_COLOR: Record<GState, string> = {
  ACTIVE: "#5EE6A8",
  NEW: "#8FE7FF",
  SUPERSEDED: "#FF7AA8",
  DELETED: "#6F707C",
  REDACTED: "#A5A5B0",
  CONFLICT: "#FF7AA8",
};

const NODE_ALPHA: Record<GState, number> = {
  ACTIVE: 1,
  NEW: 0.95,
  SUPERSEDED: 0.45,
  DELETED: 0.4,
  REDACTED: 0.55,
  CONFLICT: 0.95,
};

const NODE_SCALE: Record<GState, number> = {
  ACTIVE: 1,
  NEW: 0.9,
  SUPERSEDED: 0.78,
  DELETED: 0.7,
  REDACTED: 0.85,
  CONFLICT: 1,
};

const BASE_RADIUS: Record<GState, number> = {
  ACTIVE: 4.5,
  NEW: 4,
  SUPERSEDED: 3.6,
  DELETED: 3.2,
  REDACTED: 3.8,
  CONFLICT: 4.5,
};

// ── demo timeline (ms, from cycle start) ─────────────────────
const TEA_IN = 2400;
const TEA_IN_DUR = 900;
const CONFLICT_AT = 4300;
const CONFLICT_DUR = 800;
const SUPERSEDE_AT = 5600;
const SUPERSEDE_DUR = 1100;
const CYCLE = 17000;

// ── deterministic helpers ────────────────────────────────────
function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function mixHex(a: string, b: string, p: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Demo visual overrides — coffee replays its appearance then supersession;
// tea enters later. After the supersession settles, values equal the data
// defaults (muted coffee), so the cycle restarts seamlessly.
function coffeeVisual(t: number): { alpha: number; scale: number; color: string; state: GState } {
  const pink = STATE_COLOR.SUPERSEDED;
  const green = STATE_COLOR.ACTIVE;
  if (t >= 0 && t < SUPERSEDE_AT) {
    const a = clamp01(t / 900); // "I prefer coffee." — appears as ACTIVE
    return { alpha: lerp(0.45, 1, a), scale: lerp(0.8, 1, a), color: mixHex(pink, green, a), state: "ACTIVE" };
  }
  if (t >= SUPERSEDE_AT) {
    const s = clamp01((t - SUPERSEDE_AT) / SUPERSEDE_DUR); // coffee → SUPERSEDED
    return {
      alpha: lerp(1, 0.45, s),
      scale: lerp(1, 0.78, s),
      color: mixHex(green, pink, s),
      state: s < 1 ? "ACTIVE" : "SUPERSEDED",
    };
  }
  return { alpha: 0.45, scale: 0.78, color: pink, state: "SUPERSEDED" };
}

function teaVisual(t: number): { alpha: number; scale: number; color: string; state: GState } | null {
  if (t < TEA_IN) return null;
  const a = clamp01((t - TEA_IN) / TEA_IN_DUR);
  let scale = lerp(0.4, 1, a);
  if (t >= SUPERSEDE_AT && t < SUPERSEDE_AT + 1200) {
    scale += 0.1 * (1 - clamp01((t - SUPERSEDE_AT) / 1200)); // brief emphasis
  }
  return { alpha: a, scale, color: STATE_COLOR.ACTIVE, state: "ACTIVE" };
}

function captionFor(t: number): { text: string; color: string } | null {
  if (t < 0) return null;
  if (t < 2100) return { text: "I prefer coffee.", color: "rgba(247,247,250,0.6)" };
  if (t < CONFLICT_AT) return { text: "I switched to tea.", color: "rgba(247,247,250,0.6)" };
  if (t < CONFLICT_AT + CONFLICT_DUR + 700) {
    return { text: "CONFLICT DETECTED — coffee \u2194 tea", color: "#FF7AA8" };
  }
  if (t < SUPERSEDE_AT + SUPERSEDE_DUR + 1100) {
    return { text: "coffee \u2192 SUPERSEDED \u00b7 tea \u2192 ACTIVE", color: "#5EE6A8" };
  }
  return null;
}

interface LiveNode extends NodeData {
  sx: number;
  sy: number;
  sz: number;
}

interface Proj {
  id: string;
  x: number;
  y: number;
  r: number;
  d: number;
  isLeaf: boolean;
}

// Sphere placement: category hubs at mid-depth, leaves biased inward so the
// globe is dense near the core and sparse at the organic rim. Deterministic.
function buildSphere(): LiveNode[] {
  const cats: LiveNode[] = CATEGORIES.map((c, i) => {
    const az = (i / CATEGORIES.length) * Math.PI * 2 + (hashId(c + ":az") * 2 - 1) * 0.25;
    const el = (hashId(c + ":el") * 2 - 1) * 0.3;
    return {
      ...HUB,
      id: `cat:${c.toLowerCase()}`,
      type: "category",
      key: c.toLowerCase(),
      value: c,
      state: "ACTIVE",
      cat: c,
      sx: Math.cos(el) * Math.cos(az) * 0.3,
      sy: Math.sin(el) * 0.3,
      sz: Math.cos(el) * Math.sin(az) * 0.3,
    };
  });
  const catOf = (c: string) => cats[CATEGORIES.indexOf(c)];

  const leaves: LiveNode[] = NODES.map((n) => {
    const c = catOf(n.cat);
    const az = Math.atan2(c.sz, c.sx) + (hashId(n.id + ":az") * 2 - 1) * 0.62;
    const el = Math.asin(Math.max(-1, Math.min(1, c.sy / 0.3))) + (hashId(n.id + ":el") * 2 - 1) * 0.55;
    const r = 0.42 + hashId(n.id + ":r") * 0.3;
    return {
      ...n,
      sx: Math.cos(el) * Math.cos(az) * r,
      sy: Math.sin(el) * r,
      sz: Math.cos(el) * Math.sin(az) * r,
    };
  });

  // gentle 3D separation so clusters stay legible (deterministic)
  const all = [...leaves, ...cats];
  for (let iter = 0; iter < 70; iter++) {
    let moved = 0;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        const dx = b.sx - a.sx;
        const dy = b.sy - a.sy;
        const dz = b.sz - a.sz;
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        if (d < 0.15) {
          const push = ((0.15 - d) / d) * 0.5;
          a.sx -= dx * push;
          a.sy -= dy * push;
          a.sz -= dz * push;
          b.sx += dx * push;
          b.sy += dy * push;
          b.sz += dz * push;
          moved++;
        }
      }
    }
    if (moved === 0) break;
  }
  for (const n of all) {
    const m = Math.hypot(n.sx, n.sy, n.sz);
    if (m > 1) {
      n.sx /= m;
      n.sy /= m;
      n.sz /= m;
    }
  }
  return [...cats, ...leaves];
}

export function MemoryGraph() {
  const { reduced } = useMotionPref();
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hover, setHover] = useState<{ id: string; state: GState; xPct: number; yPx: number } | null>(null);
    const [selected, setSelected] = useState<{ node: NodeData; state: GState; x: number; y: number; W: number; H: number } | null>(null);
    const [listMode, setListMode] = useState(false);
    const [caption, setCaption] = useState<{ text: string; color: string; key: number } | null>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const hoverRef = useRef<{ id: string; state: GState; xPct: number; yPx: number } | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const captionRef = useRef<{ text: string; color: string } | null>(null);
  const captionKeyRef = useRef(0);

  // ── canvas engine ──────────────────────────────────────────
  useEffect(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    const G = g; // non-null aliases for use inside closures
    const box = area;
    const cv = canvas;

    let W = 0;
    let H = 0;
    let R = 0;
    let dpr = 1;
    let isMobile = false;
    let leaves: LiveNode[] = [];
    const cats: LiveNode[] = [];
    let catEdges: Array<{ a: number; b: number }> = [];
    let semEdges: Array<{ a: number; b: number; flow: boolean }> = [];
    let demoEdge = -1;
    const adj = new Map<number, number[]>();

    const projected = { current: [] as Proj[] };
    const mouse = { current: null as { x: number; y: number } | null };
    const demoStart = { current: null as number | null };
    const demoNow = { current: CYCLE };

    function layout() {
      const rect = box.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      R = Math.min(W, H) * 0.44;
      isMobile = W < 768;
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      G.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pool = buildSphere();
      leaves = pool.filter((n) => n.type !== "category");
      cats.length = 0;
      for (const n of pool) if (n.type === "category") cats.push(n);
      if (isMobile) leaves = leaves.filter((n) => MOBILE_IDS.has(n.id));
      const idxOf = (id: string) => leaves.findIndex((n) => n.id === id);

      // edges: hub(-2)→cats(-3 - catIdx), cats→leaves, semantic pairs
      catEdges = [];
      cats.forEach((c, ci) => catEdges.push({ a: -2, b: -3 - ci }));
      for (const c of cats) {
        for (const m of leaves.filter((n) => n.cat === c.cat)) {
          catEdges.push({ a: -3 - CATEGORIES.indexOf(c.cat), b: idxOf(m.id) });
        }
      }

      semEdges = [];
      demoEdge = -1;
      for (const [idA, idB] of LINKS) {
        const a = idxOf(idA);
        const b = idxOf(idB);
        if (a < 0 || b < 0) continue;
        const flow = true;
        semEdges.push({ a, b, flow });
        if ((idA === "mem_116" || idA === "mem_117") && (idB === "mem_116" || idB === "mem_117")) {
          demoEdge = semEdges.length - 1;
        }
      }

      adj.clear();
      for (const e of catEdges) {
        if (e.a >= 0 && e.b >= 0) {
          const la = adj.get(e.a) ?? [];
          const lb = adj.get(e.b) ?? [];
          if (!la.includes(e.b)) la.push(e.b);
          if (!lb.includes(e.a)) lb.push(e.a);
          adj.set(e.a, la);
          adj.set(e.b, lb);
        }
      }
      for (const e of semEdges) {
        const la = adj.get(e.a) ?? [];
        const lb = adj.get(e.b) ?? [];
        if (!la.includes(e.b)) la.push(e.b);
        if (!lb.includes(e.a)) lb.push(e.a);
        adj.set(e.a, la);
        adj.set(e.b, lb);
      }
    }

    let raf = 0;
    let running = false;
    let inView = true;
    let tabHidden = document.visibilityState === "hidden";
    let lastNow = performance.now();
    let dashPhase = 0;

    // projected endpoints for every drawn node (drawn far→near)
    const projOf = (n: LiveNode): { x: number; y: number; d: number } => {
      const { x, y, d } = projected.current.find((p) => p.id === n.id) ?? { x: 0, y: 0, d: 0.5 };
      return { x, y, d };
    };

    function endpoint(leafIdx: number): { x: number; y: number; d: number } {
      if (leafIdx === -2) return { x: W / 2, y: H / 2 + 0.02 * H, d: 0.5 };
      if (leafIdx < -2) {
        const cat = cats[-3 - leafIdx];
        return cat ? projOf(cat) : { x: W / 2, y: H / 2, d: 0.5 };
      }
      if (leafIdx < 0) return { x: W / 2, y: H / 2, d: 0.5 };
      return projOf(leaves[leafIdx]);
    }

    function draw(now: number) {
      G.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const theta = reduced ? 0 : now * ROT_SPEED;
      const tilt = reduced ? 0 : 0.07 * Math.sin(now * 0.00009);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const cosA = Math.cos(tilt);
      const sinA = Math.sin(tilt);

      // demo time — absolute so pauses resume seamlessly
      let t = CYCLE;
      if (demoStart.current !== null && !reduced) {
        t = (now - demoStart.current) % CYCLE;
      }
      demoNow.current = t;

      // project every node once per frame
      const allNodes = [...cats, ...leaves];
      const proj = new Map<string, { x: number; y: number; d: number }>();
      for (const n of allNodes) {
        const x1 = n.sx * cosT + n.sz * sinT;
        const z1 = -n.sx * sinT + n.sz * cosT;
        const x2 = x1 * cosA - n.sy * sinA;
        const y2 = x1 * sinA + n.sy * cosA;
        const d = clamp01((z1 + 1) / 2);
        proj.set(n.id, { x: cx + x2 * R, y: cy + y2 * R * 0.9, d });
      }
      projected.current = allNodes.map((n) => {
        const p = proj.get(n.id)!;
        return { id: n.id, ...p, r: BASE_RADIUS[n.state], isLeaf: n.type !== "category" };
      });
      // drawn far → near
      projected.current.sort((a, b) => b.d - a.d);

      // faint sphere aura — sells the globe silhouette, nothing more
      const aura = G.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.06);
      aura.addColorStop(0, "rgba(124,92,255,0.05)");
      aura.addColorStop(0.6, "rgba(124,92,255,0.025)");
      aura.addColorStop(1, "rgba(124,92,255,0)");
      G.fillStyle = aura;
      G.beginPath();
      G.arc(cx, cy, R * 1.06, 0, Math.PI * 2);
      G.fill();

      const hov = hoverRef.current;
      const hoverIdx = hov ? leaves.findIndex((n) => n.id === hov.id) : -1;
      const highlight = new Set<number>();
      if (hoverIdx >= 0) {
        highlight.add(hoverIdx);
        for (const nb of adj.get(hoverIdx) ?? []) highlight.add(nb);
      }

      const conflictOn = t >= CONFLICT_AT && t < CONFLICT_AT + CONFLICT_DUR + 700;
      const supersedeOn = t >= SUPERSEDE_AT && t < SUPERSEDE_AT + SUPERSEDE_DUR + 1000;
      const demoCoffee = coffeeVisual(t);
      const demoTea = teaVisual(t);

      // ── edges ──────────────────────────────────────────────
      const depthAlpha = (d: number) => 0.45 + 0.55 * d;
      const drawEdge = (
        pA: { x: number; y: number; d: number },
        pB: { x: number; y: number; d: number },
        color: string,
        alpha: number,
        width: number,
        dashed: boolean,
        offset: number,
      ) => {
        const avgD = (pA.d + pB.d) / 2;
        G.strokeStyle = color;
        G.globalAlpha = Math.max(0, Math.min(1, alpha * depthAlpha(avgD)));
        G.lineWidth = width;
        if (dashed) {
          G.setLineDash([3, 5]);
          G.lineDashOffset = -offset;
        } else {
          G.setLineDash([]);
        }
        G.beginPath();
        G.moveTo(pA.x, pA.y);
        G.lineTo(pB.x, pB.y);
        G.stroke();
        G.globalAlpha = 1;
        G.setLineDash([]);
      };

      // category + engine edges (indigo)
      for (const e of catEdges) {
        const a = endpoint(e.a);
        const b = endpoint(e.b);
        let alpha = 0.09;
        if (hoverIdx >= 0) {
          const lit =
            (e.a >= 0 && highlight.has(e.a) && e.b >= 0 && highlight.has(e.b)) ||
            (e.a >= 0 && highlight.has(e.a) && e.b < 0) ||
            (e.b >= 0 && highlight.has(e.b) && e.a < 0);
          alpha = lit ? alpha * 2.4 : alpha * 0.3;
        }
        if (mouse.current && !isMobile) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dist = Math.hypot(mx - mouse.current.x, my - mouse.current.y);
          alpha *= 1 + Math.max(0, 1 - dist / 150) * 0.6;
        }
        drawEdge(a, b, C_INDIGO, alpha, 1, false, 0);
      }

      // semantic edges (cyan, slow dash flow)
      for (let i = 0; i < semEdges.length; i++) {
        const e = semEdges[i];
        const a = endpoint(e.a);
        const b = endpoint(e.b);
        let alpha = 0.13;
        let width = 1;
        let color = C_CYAN;
        const dashed = true;
        let offset = dashPhase;

        if (i === demoEdge) {
          const aAlpha = e.a >= 0 ? (leaves[e.a].id === "mem_117" ? demoCoffee.alpha : 1) : 1;
          const bAlpha = e.b >= 0 ? (leaves[e.b].id === "mem_117" ? demoCoffee.alpha : 1) : 1;
          const minA = Math.min(aAlpha, bAlpha);
          if (conflictOn) {
            color = "#FF7AA8";
            alpha = 0.5;
            width = 1.4;
            offset = dashPhase * 3;
          } else if (supersedeOn) {
            color = C_CYAN;
            alpha = 0.5;
            width = 1.4;
          }
          alpha *= minA;
        } else if (hoverIdx >= 0) {
          const lit = highlight.has(e.a) && highlight.has(e.b);
          alpha = lit ? alpha * 2.4 : alpha * 0.3;
        }
        if (mouse.current && !isMobile) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dist = Math.hypot(mx - mouse.current.x, my - mouse.current.y);
          alpha *= 1 + Math.max(0, 1 - dist / 150) * 0.6;
        }
        drawEdge(a, b, color, alpha, width, dashed, offset);
      }
      G.setLineDash([]);

      // ── category hubs ──────────────────────────────────────
      for (const c of cats) {
        const p = proj.get(c.id)!;
        const s = 0.55 + 0.5 * p.d;
        const alpha = 0.5 * depthAlpha(p.d);
        const r = 2.6 * s;
        G.fillStyle = `rgba(124,92,255,${alpha})`;
        G.beginPath();
        G.arc(p.x, p.y, r, 0, Math.PI * 2);
        G.fill();
        if (!isMobile) {
          G.font = '500 8.5px "IBM Plex Mono", monospace';
          G.textAlign = "center";
          G.fillStyle = `rgba(185,185,199,${0.28 * depthAlpha(p.d)})`;
          G.fillText(c.value, p.x, p.y + r + 11);
        }
      }

      // ── leaves (far → near) ────────────────────────────────
      const mouseBoost = (x: number, y: number) => {
        if (!mouse.current || isMobile) return 0;
        const dist = Math.hypot(x - mouse.current.x, y - mouse.current.y);
        return Math.max(0, 1 - dist / 140) * 0.35;
      };

      for (const p of projected.current) {
        if (!p.isLeaf) continue;
        const n = leaves.find((l) => l.id === p.id)!;
        const demo =
          n.id === "mem_117" ? demoCoffee : n.id === "mem_116" ? demoTea : null;
        const state = demo ? demo.state : n.state;
        let alpha = NODE_ALPHA[state] * (demo ? demo.alpha : 1);
        let scale = NODE_SCALE[state] * (demo ? demo.scale : 1);
        const color = demo ? demo.color : STATE_COLOR[state];

        const isHover = hov?.id === n.id;
        if (isHover) {
          alpha = 1;
          scale *= 1.35;
        } else if (hov) {
          alpha = highlight.has(leaves.indexOf(n)) ? 1 : alpha * 0.22;
        }

        const depth = p.d;
        const dAlpha = depthAlpha(depth);
        const dScale = 0.55 + 0.5 * depth;
        const boost = mouseBoost(p.x, p.y);
        alpha = Math.min(1, alpha * dAlpha + boost * 0.3);
        const r = BASE_RADIUS[state] * dScale * scale * (1 + boost);
        const pulse = reduced ? 1 : 1 + 0.05 * Math.sin(now / 900 + hashId(n.id) * Math.PI * 2);
        const rr = r * pulse;

        // rings
        if (state === "NEW") {
          G.strokeStyle = `rgba(143,231,255,${0.6 * alpha})`;
          G.setLineDash([2, 2]);
          G.beginPath();
          G.arc(p.x, p.y, rr + 3, 0, Math.PI * 2);
          G.stroke();
          G.setLineDash([]);
        }
        if (state === "CONFLICT" && !reduced) {
          const pr = 1 + 0.35 * Math.sin(now / 900 + hashId(n.id) * Math.PI * 2);
          G.strokeStyle = `rgba(255,122,168,${0.5 * alpha})`;
          G.setLineDash([3, 3]);
          G.beginPath();
          G.arc(p.x, p.y, rr + 3.5 * pr, 0, Math.PI * 2);
          G.stroke();
          G.setLineDash([]);
        }
        // spawn ping — coffee enters / tea enters
        const pingAt = n.id === "mem_117" ? 0 : n.id === "mem_116" ? TEA_IN : -1;
        if (pingAt >= 0 && t >= pingAt && t < pingAt + 800 && !reduced) {
          const pp = clamp01((t - pingAt) / 800);
          G.strokeStyle = `rgba(143,231,255,${(1 - pp) * 0.6})`;
          G.lineWidth = 1.2;
          G.beginPath();
          G.arc(p.x, p.y, rr + 4 + 12 * pp, 0, Math.PI * 2);
          G.stroke();
          G.lineWidth = 1;
        }
        // conflict pulse rings on the story pair
        if (conflictOn && (n.id === "mem_116" || n.id === "mem_117") && !reduced) {
          const cp = 1 + 0.3 * Math.sin(now / 70);
          G.strokeStyle = `rgba(255,122,168,${0.5 * alpha})`;
          G.setLineDash([3, 3]);
          G.beginPath();
          G.arc(p.x, p.y, rr + 4 * cp, 0, Math.PI * 2);
          G.stroke();
          G.setLineDash([]);
        }
        // selected ring
        if (selectedIdRef.current === n.id) {
          G.strokeStyle = `rgba(143,231,255,${0.55 * alpha})`;
          G.beginPath();
          G.arc(p.x, p.y, rr + 4.5, 0, Math.PI * 2);
          G.stroke();
        }
        // hover soft halo for ACTIVE
        if (state === "ACTIVE" && isHover) {
          G.fillStyle = `rgba(94,230,168,${0.08 * alpha})`;
          G.beginPath();
          G.arc(p.x, p.y, rr + 6, 0, Math.PI * 2);
          G.fill();
        }

        G.fillStyle = color;
        G.globalAlpha = Math.max(0, Math.min(1, alpha));
        G.beginPath();
        G.arc(p.x, p.y, rr, 0, Math.PI * 2);
        G.fill();
        G.globalAlpha = 1;

        // label (desktop only — mobile stays clean)
        if (!isMobile) {
          G.font = '500 9px "IBM Plex Mono", monospace';
          const right = p.x > W * 0.82;
          G.textAlign = right ? "end" : "start";
          const muted = state === "SUPERSEDED" || state === "DELETED";
          const labelBase = muted ? 0.3 : 0.45;
          const labelAlpha = labelBase * dAlpha * (isHover ? 2 : 1);
          G.fillStyle = `rgba(245,245,250,${Math.min(0.95, labelAlpha)})`;
          G.fillText(n.value, right ? p.x - 9 : p.x + 9, p.y + 3.5);
          if (state === "SUPERSEDED") {
            const w = G.measureText(n.value).width;
            G.strokeStyle = `rgba(255,122,168,${0.5 * dAlpha})`;
            G.beginPath();
            G.moveTo(right ? p.x - 9 - w : p.x + 9, p.y + 0.5);
            G.lineTo(right ? p.x - 9 : p.x + 9 + w, p.y + 0.5);
            G.stroke();
          }
        }
      }

      // ── MEMORY ENGINE core ─────────────────────────────────
      const hp = reduced ? 1 : 1 + 0.12 * Math.sin(now / 1400);
      G.fillStyle = `rgba(124,92,255,${0.1 + 0.04 * hp})`;
      G.beginPath();
      G.arc(cx, cy + 0.02 * H, 13 * hp, 0, Math.PI * 2);
      G.fill();
      G.fillStyle = "#7c5cff";
      G.beginPath();
      G.arc(cx, cy + 0.02 * H, 4.2, 0, Math.PI * 2);
      G.fill();
      G.fillStyle = "rgba(247,247,250,0.9)";
      G.beginPath();
      G.arc(cx, cy + 0.02 * H, 1.3, 0, Math.PI * 2);
      G.fill();
      G.font = '500 9.5px "IBM Plex Mono", monospace';
      G.textAlign = "center";
      G.fillStyle = "rgba(247,247,250,0.5)";
      G.fillText("MEMORY ENGINE", cx, cy + 0.02 * H - 21);

      // story caption
      const cap = reduced ? null : captionFor(t);
      const prev = captionRef.current;
      if (cap !== null || prev !== null) {
        const same = cap !== null && prev !== null && cap.text === prev.text && cap.color === prev.color;
        if (!same) {
          captionRef.current = cap;
          captionKeyRef.current++;
          setCaption(cap ? { ...cap, key: captionKeyRef.current } : null);
        }
      }
    }

    function step(now: number) {
      const dt = Math.min(now - lastNow, 64);
      lastNow = now;
      dashPhase = (dashPhase + dt * 0.02) % 16;
      draw(now);
      raf = requestAnimationFrame(step);
    }

    function sync() {
      const shouldRun = inView && !tabHidden && !reduced;
      if (shouldRun && !running) {
        running = true;
        lastNow = performance.now();
        if (demoStart.current === null) demoStart.current = lastNow + 900;
        raf = requestAnimationFrame(step);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
      if (!shouldRun) draw(performance.now()); // static frame (reduced / paused)
    }

    // ── pointer interaction ──────────────────────────────────
    const hit = (px: number, py: number) => {
      for (let i = projected.current.length - 1; i >= 0; i--) {
        const p = projected.current[i];
        if (!p.isLeaf) continue;
        if (Math.hypot(px - p.x, py - p.y) <= p.r + 8) return p;
      }
      return null;
    };

    const pendingTap = { current: null as null | { id: string; x: number; y: number } };

    const onPointerDown = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const p = hit(px, py);
      if (!p) return;
      pendingTap.current = { id: p.id, x: px, y: py };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      mouse.current = { x: px, y: py };

      if (e.pointerType !== "mouse") return;
      const p = hit(px, py);
      const id = p ? p.id : null;
      if (id !== (hoverRef.current?.id ?? null)) {
        const state =
          p && p.id === "mem_117"
            ? coffeeVisual(demoNow.current).state
            : p
              ? (leaves.find((n) => n.id === p.id)?.state ?? "ACTIVE")
              : "ACTIVE";
        const next = p ? { id: p.id, state, xPct: (p.x / W) * 100, yPx: p.y } : null;
        hoverRef.current = next;
        setHover(next);
        cv.style.cursor = p ? "pointer" : "default";
        if (reduced) draw(performance.now());
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pendingTap.current) return;
      const { id, x, y } = pendingTap.current;
      pendingTap.current = null;
      const rect = cv.getBoundingClientRect();
      const moved = Math.hypot(e.clientX - rect.left - x, e.clientY - rect.top - y);
      if (moved >= 8) return; // ignore taps that became scrolls
      const n = leaves.find((l) => l.id === id);
      if (!n) return;
      const state = n.id === "mem_117" ? coffeeVisual(demoNow.current).state : n.state;
      selectedIdRef.current = id;
      setSelected({ node: n, state, x, y, W, H });
      if (reduced) draw(performance.now());
    };

    const onPointerCancel = () => {
      pendingTap.current = null;
    };

    const onPointerLeave = () => {
      mouse.current = null;
      if (hoverRef.current) {
        hoverRef.current = null;
        setHover(null);
        cv.style.cursor = "default";
        if (reduced) draw(performance.now());
      }
    };

    // ── visibility ───────────────────────────────────────────
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.06 },
    );
    const onVisibility = () => {
      tabHidden = document.visibilityState === "hidden";
      sync();
    };

    layout();
    io.observe(area);
    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointermove", onPointerMove);
    cv.addEventListener("pointerup", onPointerUp);
    cv.addEventListener("pointercancel", onPointerCancel);
    cv.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    sync();

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        if (reduced) draw(performance.now());
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerup", onPointerUp);
      cv.removeEventListener("pointercancel", onPointerCancel);
      cv.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [reduced, listMode]);

  // Esc closes inspector; focus the close button when it opens
  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // supersession counterpart for the inspector
  const counterpart = selected
    ? NODES.find((n) => n.type === selected.node.type && n.key === selected.node.key && n.id !== selected.node.id)
    : null;

  const tooltipNode = hover ? NODES.find((n) => n.id === hover.id) : null;

  // inspector placement — beside the node, clamped + flipped within the stage
    let insStyle: CSSProperties = { right: 16, bottom: 16 };
  if (selected) {
    const pw = 264;
    const left = selected.x < selected.W * 0.52;
    const above = selected.y > selected.H * 0.5;
    const x = left ? Math.min(selected.x + 18, selected.W - pw - 12) : Math.max(selected.x - pw - 18, 12);
    const y = above ? Math.max(selected.y - 216, 12) : Math.min(selected.y + 18, selected.H - 220);
    insStyle = { left: x, top: y, width: pw };
  }

  return (
    <section id="how-it-works" className="section-gap" aria-label="Memory graph">
      <div className="container-site">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker-label">Act 03 — See inside</p>
              <h2 className="h2-display">Make memory visible.</h2>
              <p className="lead-text">
                Know what your AI remembers, why it remembers it, and what changed.
              </p>
            </div>
            <button
              onClick={() => setListMode((v) => !v)}
              className="btn-ghost !py-2.5 !px-4 text-[13px]"
              aria-pressed={listMode}
            >
              {listMode ? <Share2 size={14} /> : <List size={14} />}
              {listMode ? "View graph" : "View as list"}
            </button>
          </div>
        </Reveal>
      </div>

      {/* memory globe — centered, fixed height, zero layout shift */}
      <div
        ref={areaRef}
        className="relative mx-auto mt-10 max-w-[840px] overflow-hidden"
        style={{ height: STAGE_HEIGHT }}
      >
        {listMode ? (
          <div className="absolute inset-0 overflow-y-auto px-6 pb-2">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {NODES.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() =>
                      setSelected({
                        node: n,
                        state: n.state,
                        x: 0,
                        y: 0,
                        W: 800,
                        H: 600,
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-raised px-4 py-3 text-left transition-colors hover:border-[rgba(255,255,255,0.18)]"
                  >
                    <span>
                      <span className="block font-mono text-[12px] text-secondary">
                        {n.type}.{n.key}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-faint">
                        {n.value}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StateChip state={n.state} />
                      <span className="font-mono text-[10px] text-faint">
                        {n.confidence === null ? "—" : `${Math.round(n.confidence * 100)}%`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-pan-y"
            role="img"
            aria-label="Interactive memory globe. Use View as list for an accessible, keyboard-friendly alternative."
          />
        )}

        {/* story caption (decorative — hidden from screen readers) */}
        {caption && !listMode && (
          <p
            key={caption.key}
            className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.14em]"
            style={{ color: caption.color }}
            aria-hidden="true"
          >
            {caption.text}
          </p>
        )}

        {/* hover tooltip (decorative — hidden from screen readers) */}
        {tooltipNode && hover && !listMode && (
          <div
            className="pointer-events-none absolute z-10 w-[150px] rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(13,13,17,0.92)] px-3 py-2.5 text-left shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
            aria-hidden="true"
            style={{
              left: `${Math.min(Math.max(hover.xPct, 12), 84)}%`,
              top: `${Math.max(hover.yPx - 8, 10)}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="font-mono text-[10px] text-secondary">
              {tooltipNode.type}.{tooltipNode.key}
            </p>
            <p className="mt-0.5 font-mono text-[13px] text-text">{tooltipNode.value}</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: STATE_COLOR[hover.state] }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: STATE_COLOR[hover.state] }} aria-hidden="true" />
              {hover.state} · {tooltipNode.confidence === null ? "—" : `${Math.round(tooltipNode.confidence * 100)}%`}
            </p>
          </div>
        )}

        {/* floating memory inspector (non-modal, glass §54) */}
        {selected && !listMode && (
          <div
            role="region"
            aria-label="Memory inspector"
            className="absolute z-10 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(13,13,17,0.92)] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
            style={{ ...insStyle, maxWidth: "calc(100% - 24px)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                Memory
              </span>
              <button
                ref={closeRef}
                onClick={() => setSelected(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-white/5 hover:text-text"
                aria-label="Close inspector"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-2 font-mono text-[12.5px] text-secondary">
              {selected.node.type}.{selected.node.key}
            </p>
            <p
              className="mt-1 font-display text-[26px] font-bold tracking-tight"
              style={{ color: STATE_COLOR[selected.state] }}
            >
              {selected.node.value}
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <StateChip state={selected.state} />
              {selected.node.confidence !== null && (
                <span className="font-mono text-[11px] text-faint">
                  {Math.round(selected.node.confidence * 100)}% confidence
                </span>
              )}
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-[rgba(255,255,255,0.08)] pt-3.5 font-mono text-[11.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-faint">source</dt>
                <dd className="text-text">{selected.node.source}</dd>
              </div>
              {counterpart && counterpart.state === "SUPERSEDED" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">supersedes</dt>
                  <dd className="text-danger/70 line-through decoration-danger/50">
                    {counterpart.value}
                  </dd>
                </div>
              )}
              {counterpart && counterpart.state !== "SUPERSEDED" && selected.state === "SUPERSEDED" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">superseded by</dt>
                  <dd className="text-success">{counterpart.value}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* legend — labels + color, not color alone (§15) */}
      <div className="container-site">
        <Reveal delay={0.05}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {(Object.keys(STATE_COLOR) as GState[]).map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: STATE_COLOR[s],
                    opacity: s === "SUPERSEDED" || s === "DELETED" ? 0.5 : 1,
                  }}
                />
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StateChip({ state }: { state: GState }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]"
      style={{
        color: STATE_COLOR[state],
        borderColor: `${STATE_COLOR[state]}66`,
        background: `${STATE_COLOR[state]}14`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: STATE_COLOR[state], opacity: state === "SUPERSEDED" || state === "DELETED" ? 0.5 : 1 }}
        aria-hidden="true"
      />
      {state}
    </span>
  );
}
