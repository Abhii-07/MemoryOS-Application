"use client";

import { useEffect, useRef, useState } from "react";
import { X, List, Share2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * Act 03 — Interactive Memory Graph (spec §14–15).
 *
 * A borderless, living "memory space": Canvas 2D graph floating directly on
 * the page background. Subtle drift + pulse, slow edge flow, hover highlight
 * with dimming, node drag with natural settle, floating Memory Inspector.
 *
 * Perf / a11y rules honored:
 *  - no React state per frame (refs only inside the rAF loop)
 *  - IntersectionObserver + tab-visibility pauses (§27–28)
 *  - reduced motion → static draw, no loop (§29)
 *  - mobile: node subset, no hover/drag, tap to inspect (§30)
 *  - fixed-height layer → zero layout shift
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
  nx: number; // normalized x (0–1)
  ny: number; // normalized y (0–1)
}

// Deterministic demo dataset — mirrors the DemoMemoryEngine slots (§14).
const NODES: NodeData[] = [
  { id: "mem_116", type: "preference", key: "drink", value: "tea", source: "user_stated", confidence: 0.94, state: "ACTIVE", nx: 0.27, ny: 0.22 },
  { id: "mem_11d", type: "preference", key: "color", value: "green", source: "user_stated", confidence: 0.91, state: "ACTIVE", nx: 0.72, ny: 0.2 },
  { id: "mem_124", type: "fact", key: "location", value: "Bangalore", source: "user_stated", confidence: 0.97, state: "ACTIVE", nx: 0.495, ny: 0.3 },
  { id: "mem_12b", type: "habit", key: "workout", value: "mornings", source: "user_stated", confidence: 0.88, state: "ACTIVE", nx: 0.15, ny: 0.52 },
  { id: "mem_132", type: "project", key: "memoryos", value: "engine core", source: "user_stated", confidence: 0.92, state: "ACTIVE", nx: 0.865, ny: 0.45 },
  { id: "mem_139", type: "relationship", key: "sister", value: "Anisha", source: "user_stated", confidence: 0.95, state: "ACTIVE", nx: 0.34, ny: 0.8 },
  { id: "mem_140", type: "constraint", key: "nutrition", value: "no dairy", source: "user_stated", confidence: 0.9, state: "ACTIVE", nx: 0.66, ny: 0.82 },
  { id: "mem_117", type: "preference", key: "drink", value: "coffee", source: "user_stated", confidence: 0.88, state: "SUPERSEDED", nx: 0.495, ny: 0.11 },
  { id: "mem_125", type: "fact", key: "location", value: "Mumbai", source: "user_stated", confidence: 0.93, state: "SUPERSEDED", nx: 0.65, ny: 0.38 },
  { id: "mem_147", type: "instruction", key: "respond", value: "be brief", source: "user_stated", confidence: 0.89, state: "ACTIVE", nx: 0.075, ny: 0.3 },
  { id: "mem_14e", type: "fact", key: "availability", value: "evenings", source: "user_stated", confidence: 0.86, state: "ACTIVE", nx: 0.94, ny: 0.7 },
  { id: "mem_155", type: "habit", key: "meditation", value: "nightly", source: "user_stated", confidence: 0.84, state: "NEW", nx: 0.09, ny: 0.76 },
  { id: "mem_15c", type: "preference", key: "music", value: "indie", source: "user_stated", confidence: 0.79, state: "CONFLICT", nx: 0.87, ny: 0.28 },
  { id: "mem_163", type: "constraint", key: "screen", value: "none after 11pm", source: "user_stated", confidence: 0.82, state: "ACTIVE", nx: 0.575, ny: 0.63 },
  { id: "mem_16a", type: "fact", key: "pet", value: "Mochi", source: "user_stated", confidence: 0.87, state: "REDACTED", nx: 0.21, ny: 0.39 },
  { id: "mem_171", type: "fact", key: "payment", value: "[REDACTED]", source: "user_stated", confidence: null, state: "REDACTED", nx: 0.3, ny: 0.13 },
  { id: "mem_178", type: "project", key: "website", value: "showcase", source: "user_stated", confidence: 0.9, state: "ACTIVE", nx: 0.79, ny: 0.61 },
  { id: "mem_17f", type: "fact", key: "birthday", value: "Aug 3", source: "user_stated", confidence: 0.94, state: "DELETED", nx: 0.46, ny: 0.89 },
  { id: "mem_15d", type: "preference", key: "music", value: "jazz", source: "user_stated", confidence: 0.78, state: "SUPERSEDED", nx: 0.72, ny: 0.5 },
  { id: "mem_186", type: "session", key: "context", value: "user_123", source: "system", confidence: 0.99, state: "ACTIVE", nx: 0.565, ny: 0.12 },
];

// Semantic links — supersession pairs, type clusters, grounded relationships.
// No filler: every link is a real memory relationship.
const SEMANTIC: Array<[number, number]> = [
  [0, 7], // tea ↔ coffee (supersession)
  [2, 8], // Bangalore ↔ Mumbai (supersession)
  [12, 18], // indie ↔ jazz (supersession)
  [0, 1], // drink ↔ color (preference cluster)
  [1, 12], // color ↔ music (preference cluster)
  [2, 10], // location ↔ availability (fact cluster)
  [10, 17], // availability ↔ birthday (fact cluster)
  [14, 15], // pet ↔ payment (fact cluster)
  [2, 14], // location ↔ pet (fact cluster)
  [3, 11], // workout ↔ meditation (habits)
  [4, 16], // memoryos ↔ website (projects)
  [6, 0], // nutrition ↔ drink (constraint)
  [13, 11], // screen ↔ meditation (constraint)
  [19, 9], // session ↔ instruction
  [19, 2], // session ↔ location
  [5, 14], // sister ↔ pet (relationship)
];

// Mobile subset (~11 nodes): the story pair plus varied, meaningful memories.
const MOBILE_IDS = new Set([
  "mem_116", "mem_11d", "mem_124", "mem_12b", "mem_139",
  "mem_117", "mem_125", "mem_147", "mem_15c", "mem_15d", "mem_186",
]);

const HUB = { nx: 0.5, ny: 0.52 };
const AREA_HEIGHT = "clamp(360px, 62vh, 540px)";

const STATE_COLOR: Record<GState, string> = {
  ACTIVE: "#5EE6A8",
  NEW: "#8FE7FF",
  SUPERSEDED: "#FF7AA8",
  DELETED: "#6F707C",
  REDACTED: "#A5A5B0",
  CONFLICT: "#FF7AA8",
};

interface LiveNode extends NodeData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

export function MemoryGraph() {
  const { reduced } = useMotionPref();
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selected, setSelected] = useState<NodeData | null>(null);
  const [listMode, setListMode] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const hoverIdRef = useRef<string | null>(null);

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
    let dpr = 1;
    let isMobile = false;
    let nodes: LiveNode[] = [];
    const hub: LiveNode = { ...NODES[0], nx: HUB.nx, ny: HUB.ny, x: 0, y: 0, vx: 0, vy: 0, phase: 0 };
    let edges: Array<{ a: number; b: number; flow: boolean }> = [];
    const adj = new Map<number, number[]>();

    function layout() {
      const rect = box.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      isMobile = W < 768;
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      G.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pool = isMobile ? NODES.filter((n) => MOBILE_IDS.has(n.id)) : NODES;
      nodes = pool.map((n) => ({
        ...n,
        x: n.nx * W,
        y: n.ny * H,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        phase: Math.random() * Math.PI * 2,
      }));

      hub.x = HUB.nx * W;
      hub.y = HUB.ny * H;

      const ids = new Set(pool.map((n) => n.id));
      const idxOf = (id: string) => pool.findIndex((n) => n.id === id);

      edges = [
        ...pool.map((n, i) => ({ a: i, b: -1, flow: false })), // hub links
        ...SEMANTIC.filter(([a, b]) => ids.has(NODES[a].id) && ids.has(NODES[b].id)).map(
          ([a, b]) => ({ a: idxOf(NODES[a].id), b: idxOf(NODES[b].id), flow: true }),
        ),
      ];

      adj.clear();
      for (const e of edges) {
        if (e.b === -1) continue;
        const a = adj.get(e.a) ?? [];
        const b = adj.get(e.b) ?? [];
        if (!a.includes(e.b)) a.push(e.b);
        if (!b.includes(e.a)) b.push(e.a);
        adj.set(e.a, a);
        adj.set(e.b, b);
      }
    }

    let dashPhase = 0;
    let raf = 0;
    let running = false;
    let inView = true;
    let tabHidden = document.visibilityState === "hidden";
    let lastNow = performance.now();
    const draggingRef = { current: false };
    const pendingTap = { current: null as null | { n: LiveNode; x: number; y: number } };

    const NODE_ALPHA: Record<GState, number> = {
      ACTIVE: 1,
      NEW: 0.95,
      SUPERSEDED: 0.45,
      DELETED: 0.4,
      REDACTED: 0.55,
      CONFLICT: 0.95,
    };

    function nodeRadius(n: LiveNode, t: number) {
      const base =
        n.state === "ACTIVE" ? 5 : n.state === "CONFLICT" ? 5 : n.state === "SUPERSEDED" || n.state === "DELETED" ? 3.4 : 4;
      const pulse = reduced ? 1 : 1 + 0.06 * Math.sin(t / 1000 + n.phase);
      return base * pulse;
    }

    function draw(t: number) {
      G.clearRect(0, 0, W, H);
      const hover = hoverIdRef.current;
      const highlight = new Set<number>();
      if (hover) {
        const hi = nodes.findIndex((n) => n.id === hover);
        if (hi >= 0) {
          highlight.add(hi);
          for (const nb of adj.get(hi) ?? []) highlight.add(nb);
        }
      }

      // edges
      for (const e of edges) {
        const a = e.a === -1 ? hub : nodes[e.a];
        const b = e.b === -1 ? hub : nodes[e.b];
        let alpha = e.flow ? 0.13 : 0.1;
        if (hover && e.b !== -1) {
          const lit = highlight.has(e.a) && highlight.has(e.b);
          alpha = lit ? alpha * 2.4 : alpha * 0.3;
        }
        G.strokeStyle = e.flow
          ? `rgba(143,231,255,${alpha})`
          : `rgba(124,92,255,${alpha})`;
        G.lineWidth = 1;
        if (e.flow && !reduced) {
          G.setLineDash([3, 5]);
          G.lineDashOffset = -dashPhase;
        } else {
          G.setLineDash([]);
        }
        G.beginPath();
        G.moveTo(a.x, a.y);
        G.lineTo(b.x, b.y);
        G.stroke();
      }
      G.setLineDash([]);

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        let alpha = NODE_ALPHA[n.state];
        if (hover) alpha = highlight.has(i) ? 1 : 0.22;

        const r = nodeRadius(n, t);
        const color = STATE_COLOR[n.state];

        // rings
        if (n.state === "NEW") {
          G.strokeStyle = `rgba(143,231,255,${0.7 * alpha})`;
          G.setLineDash([2, 2]);
          G.beginPath();
          G.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
          G.stroke();
          G.setLineDash([]);
        }
        if (n.state === "CONFLICT" && !reduced) {
          const pr = 1 + 0.35 * Math.sin(t / 900 + n.phase);
          G.strokeStyle = `rgba(255,122,168,${0.5 * alpha})`;
          G.setLineDash([3, 3]);
          G.beginPath();
          G.arc(n.x, n.y, r + 3.5 * pr, 0, Math.PI * 2);
          G.stroke();
          G.setLineDash([]);
        }
        // active soft halo
        if (n.state === "ACTIVE" && highlight.has(i)) {
          G.fillStyle = "rgba(94,230,168,0.08)";
          G.beginPath();
          G.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
          G.fill();
        }

        G.fillStyle = color;
        G.globalAlpha = alpha;
        G.beginPath();
        G.arc(n.x, n.y, r, 0, Math.PI * 2);
        G.fill();
        G.globalAlpha = 1;

        // label
        G.font = `500 ${isMobile ? 9 : 10}px "IBM Plex Mono", monospace`;
        const labelRight = n.nx > 0.85;
        const lx = labelRight ? n.x - 8 : n.x + 8;
        G.textAlign = labelRight ? "end" : "start";
        const muted = n.state === "SUPERSEDED" || n.state === "DELETED";
        G.fillStyle = hover === n.id ? "rgba(247,247,250,0.9)" : `rgba(245,245,250,${muted ? 0.28 : 0.42})`;
        G.fillText(n.value, lx, n.y + 3.5);
        if (n.state === "SUPERSEDED") {
          const w = G.measureText(n.value).width;
          G.strokeStyle = "rgba(255,122,168,0.5)";
          G.beginPath();
          G.moveTo(labelRight ? lx - w : lx, n.y + 0.5);
          G.lineTo(labelRight ? lx : lx + w, n.y + 0.5);
          G.stroke();
        }
      }

      // hub — memory engine core, slow halo pulse
      const hp = reduced ? 1 : 1 + 0.12 * Math.sin(t / 1400);
      G.fillStyle = `rgba(124,92,255,${0.1 + 0.04 * hp})`;
      G.beginPath();
      G.arc(hub.x, hub.y, 13 * hp, 0, Math.PI * 2);
      G.fill();
      G.fillStyle = "#7c5cff";
      G.beginPath();
      G.arc(hub.x, hub.y, 4.2, 0, Math.PI * 2);
      G.fill();
      G.fillStyle = "rgba(247,247,250,0.9)";
      G.beginPath();
      G.arc(hub.x, hub.y, 1.3, 0, Math.PI * 2);
      G.fill();
      G.font = '500 9.5px "IBM Plex Mono", monospace';
      G.textAlign = "center";
      G.fillStyle = "rgba(247,247,250,0.5)";
      G.fillText("MEMORY ENGINE", hub.x, hub.y - 21);
    }

    function step(now: number) {
      const dt = Math.min(now - lastNow, 64);
      lastNow = now;

      // ambient drift + drag settle (friction) + separation
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 16) { n.x = 16; n.vx = Math.abs(n.vx); }
        if (n.x > W - 16) { n.x = W - 16; n.vx = -Math.abs(n.vx); }
        if (n.y < 16) { n.y = 16; n.vy = Math.abs(n.vy); }
        if (n.y > H - 16) { n.y = H - 16; n.vy = -Math.abs(n.vy); }
        if (Math.abs(n.vx) > 0.005) n.vx *= 0.93; else n.vx = 0;
        if (Math.abs(n.vy) > 0.005) n.vy *= 0.93; else n.vy = 0;
        if (n.vx === 0 && n.vy === 0 && !draggingRef.current) {
          n.vx = (Math.random() - 0.5) * 0.05;
          n.vy = (Math.random() - 0.5) * 0.05;
        }
      }
      // pairwise separation (only if overlapping)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const min = nodeRadius(a, now) + nodeRadius(b, now) + 8;
          if (d < min) {
            const push = ((min - d) / d) * 0.5;
            a.x -= dx * push * 0.5;
            a.y -= dy * push * 0.5;
            b.x += dx * push * 0.5;
            b.y += dy * push * 0.5;
          }
        }
      }

      dashPhase = (dashPhase + dt * 0.02) % 16;
      draw(now);
      raf = requestAnimationFrame(step);
    }

    function sync() {
      const shouldRun = inView && !tabHidden && !reduced;
      if (shouldRun && !running) {
        running = true;
        lastNow = performance.now();
        raf = requestAnimationFrame(step);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
      if (!shouldRun) draw(performance.now()); // static frame (reduced / paused)
    }

    // ── pointer interaction ──────────────────────────────────
    const hit = (px: number, py: number) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (Math.hypot(px - n.x, py - n.y) <= nodeRadius(n, performance.now()) + 7) return n;
      }
      return null;
    };

    let drag: {
      n: LiveNode;
      dx: number;
      dy: number;
      sx: number;
      sy: number;
      px: number;
      py: number;
      lvx: number;
      lvy: number;
      moved: boolean;
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const n = hit(px, py);
      if (!n) return;
      if (e.pointerType !== "mouse") {
        // touch: remember tap for selection
        pendingTap.current = { n, x: px, y: py };
        return;
      }
      drag = { n, dx: px - n.x, dy: py - n.y, sx: px, sy: py, px, py, lvx: 0, lvy: 0, moved: false };
      draggingRef.current = true;
      cv.style.cursor = "grabbing";
      hoverIdRef.current = n.id;
      setHoverId(n.id);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (drag) {
        drag.lvx = px - drag.px;
        drag.lvy = py - drag.py;
        drag.px = px;
        drag.py = py;
        drag.n.x = Math.max(16, Math.min(W - 16, px - drag.dx));
        drag.n.y = Math.max(16, Math.min(H - 16, py - drag.dy));
        drag.n.nx = drag.n.x / W;
        drag.n.ny = drag.n.y / H;
        if (Math.hypot(px - drag.sx, py - drag.sy) > 4) drag.moved = true;
        if (reduced) draw(performance.now()); // no loop in reduced mode
        return;
      }

      if (e.pointerType !== "mouse") return;
      const n = hit(px, py);
      const id = n ? n.id : null;
      if (id !== hoverIdRef.current) {
        hoverIdRef.current = id;
        setHoverId(id); // low-frequency state — only on hover change
        cv.style.cursor = n ? "grab" : "default";
        if (reduced) draw(performance.now());
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pendingTap.current) {
        const { n, x, y } = pendingTap.current;
        const rect = cv.getBoundingClientRect();
        const moved = Math.hypot(e.clientX - rect.left - x, e.clientY - rect.top - y);
        pendingTap.current = null;
        if (moved < 8) setSelected(n); // ignore taps that became scrolls
        return;
      }
      if (drag) {
        if (drag.moved) {
          // natural settle: keep the drag momentum, decay via friction
          drag.n.vx = Math.max(-1.2, Math.min(1.2, drag.lvx * 0.08));
          drag.n.vy = Math.max(-1.2, Math.min(1.2, drag.lvy * 0.08));
        } else {
          setSelected(drag.n);
        }
        drag = null;
        draggingRef.current = false;
        cv.style.cursor = "grab";
        if (reduced) draw(performance.now());
      }
    };

    const onPointerCancel = () => {
      pendingTap.current = null;
      drag = null;
      draggingRef.current = false;
    };

    const onPointerLeave = () => {
      if (!drag) {
        hoverIdRef.current = null;
        setHoverId(null);
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
  }, [reduced]);

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
    ? NODES.find((n) => n.type === selected.type && n.key === selected.key && n.id !== selected.id)
    : null;

  const tooltipNode = NODES.find((n) => n.id === hoverId);

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

      {/* memory space — borderless, fixed height, zero layout shift */}
      <div
        ref={areaRef}
        className="relative mt-12 overflow-hidden"
        style={{ height: AREA_HEIGHT }}
      >
        {listMode ? (
          <div className="container-site absolute inset-0 overflow-y-auto pb-2">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {NODES.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => setSelected(n)}
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
            aria-label="Interactive memory graph. Use View as list for an accessible, keyboard-friendly alternative."
          />
        )}

        {/* hover tooltip (decorative — hidden from screen readers) */}
        {tooltipNode && !listMode && (
          <div
            className="pointer-events-none absolute z-10 w-44 rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(13,13,17,0.92)] p-3 text-left shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
            aria-hidden="true"
            style={{
              left: `${Math.min(Math.max(tooltipNode.nx * 100, 10), 78)}%`,
              top: `${tooltipNode.ny * 100}%`,
              transform: "translate(-12px, -118%)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
                Memory
              </span>
              <StateChip state={tooltipNode.state} />
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-secondary">
              {tooltipNode.type}.{tooltipNode.key}
            </p>
            <p className="mt-1 font-mono text-[13px] text-text">{tooltipNode.value}</p>
            <p className="mt-1.5 font-mono text-[10px] text-faint">
              confidence{" "}
              {tooltipNode.confidence === null ? "—" : `${Math.round(tooltipNode.confidence * 100)}%`}
            </p>
          </div>
        )}

        {/* floating memory inspector (non-modal, glass §54) */}
        {selected && !listMode && (
          <div
            role="region"
            aria-label="Memory inspector"
            className="absolute right-4 bottom-4 w-[min(300px,calc(100%-32px))] rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(13,13,17,0.92)] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md md:right-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
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
              {selected.type}.{selected.key}
            </p>
            <p
              className="mt-1 font-display text-[26px] font-bold tracking-tight"
              style={{ color: STATE_COLOR[selected.state] }}
            >
              {selected.value}
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <StateChip state={selected.state} />
              {selected.confidence !== null && (
                <span className="font-mono text-[11px] text-faint">
                  {Math.round(selected.confidence * 100)}% confidence
                </span>
              )}
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-[rgba(255,255,255,0.08)] pt-3.5 font-mono text-[11.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-faint">source</dt>
                <dd className="text-text">{selected.source}</dd>
              </div>
              {counterpart && counterpart.state === "SUPERSEDED" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">superseded</dt>
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
