"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * MemoryCore — signature hero visualization (spec §10).
 *
 * Canvas 2D node field: entities around a central memory-engine core.
 *  - ambient drift + cursor interpolation (lerp ~0.05, gentle push)
 *  - DPR ≤ 2 (desktop) / ≤ 1.5 (mobile), 24 / 12 nodes
 *  - precomputed edge pairs (hub + k-nearest), no O(n²) per frame
 *  - IntersectionObserver + tab-visibility pauses
 *  - reduced motion / canvas failure → static SVG fallback (§29, §56)
 */
interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  label?: string;
  hub: boolean;
}

const LABELS = ["preference", "retrieval", "fact", "habit", "relationship", "project"];
const CORE = { r: 3.5, halo: 11 };
const LERP = 0.05;
const PUSH_RADIUS = 130;
const PUSH_FORCE = 7;
const CORE_SHIFT = 8;

export function MemoryCore() {
  const { reduced } = useMotionPref();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasFailed, setCanvasFailed] = useState(false);

  useEffect(() => {
    if (reduced) return; // static SVG below
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const box = container; // non-null aliases for closures
    const cv = canvas;

    const ctx = cv.getContext("2d");
    if (!ctx) {
      setCanvasFailed(true);
      return;
    }
    const g = ctx; // non-null alias for use inside closures

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const count = isMobile ? 12 : 24;

    let W = 0;
    let H = 0;
    let nodes: Node[] = [];
    let pairs: Array<[number, number]> = [];
    let coreX = 0;
    let coreY = 0;

    const cursor = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    function layout() {
      const rect = box.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      coreX = W / 2;
      coreY = H * 0.42;

      nodes = [];
      const used: Array<[number, number]> = [];
      for (let i = 0; i < count; i++) {
        const r = 1.6 + Math.random() * 1.7;
        let x = 0;
        let y = 0;
        let tries = 0;
        do {
          x = W * (0.12 + Math.random() * 0.76);
          y = H * (0.12 + Math.random() * 0.76);
          tries++;
        } while (
          tries < 20 &&
          Math.hypot(x - coreX, y - coreY) < 90 &&
          used.some(([px, py]) => Math.hypot(x - px, y - py) < 42)
        );
        used.push([x, y]);
        nodes.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r,
          label: i < LABELS.length ? LABELS[i] : undefined,
          hub: false,
        });
      }

      // precompute edges: hub → all + each node → 2 nearest (§26)
      pairs = [];
      for (let i = 0; i < nodes.length; i++) pairs.push([-1, i]); // hub link
      for (let i = 0; i < nodes.length; i++) {
        const dists = nodes
          .map((n, j) => ({ j, d: Math.hypot(nodes[i].x - n.x, nodes[i].y - n.y) }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        for (const o of dists) pairs.push([i, o.j]);
      }
    }

    function render(now: number) {
      g.clearRect(0, 0, W, H);

      // cursor interpolation (§10)
      cursor.x += (cursor.tx - cursor.x) * LERP;
      cursor.y += (cursor.ty - cursor.y) * LERP;

      const pulse = 1 + Math.sin(now / 900) * 0.12;

      // edges
      g.lineWidth = 1;
      for (const [a, b] of pairs) {
        const ax = a === -1 ? coreX : nodes[a].x;
        const ay = a === -1 ? coreY : nodes[a].y;
        const bx = b === -1 ? coreX : nodes[b].x;
        const by = b === -1 ? coreY : nodes[b].y;
        const len = Math.hypot(ax - bx, ay - by);
        const alpha = Math.max(0.04, 0.14 * (1 - len / (W * 0.6)));
        g.strokeStyle = `rgba(124,92,255,${alpha})`;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
      }

      // ambient drift + gentle cursor push (§10)
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 14 || n.x > W - 14) n.vx *= -1;
        if (n.y < 14 || n.y > H - 14) n.vy *= -1;

        const dx = n.x - cursor.x;
        const dy = n.y - cursor.y;
        const d = Math.hypot(dx, dy);
        if (d < PUSH_RADIUS) {
          const f = (1 - d / PUSH_RADIUS) * PUSH_FORCE;
          n.x += (dx / d) * f;
          n.y += (dy / d) * f;
        }
      }

      // core (central memory engine) — slight shift toward cursor
      const cs = (cursor.x > -9990 ? (cursor.tx - coreX) * 0.08 : 0);
      const csy = (cursor.y > -9990 ? (cursor.ty - coreY) * 0.08 : 0);
      const cx = coreX + Math.max(-CORE_SHIFT, Math.min(CORE_SHIFT, cs));
      const cy = coreY + Math.max(-CORE_SHIFT, Math.min(CORE_SHIFT, csy));

      // nodes
      for (const n of nodes) {
        g.fillStyle = n.label
          ? "rgba(143,231,255,0.85)"
          : "rgba(167,155,255,0.55)";
        g.beginPath();
        g.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        g.fill();
        if (n.label && !isMobile) {
          g.font = '500 10px "IBM Plex Mono", monospace';
          g.fillStyle = "rgba(245,245,250,0.38)";
          g.fillText(n.label, n.x + 7, n.y + 3);
        }
      }

      // core
      g.fillStyle = `rgba(124,92,255,${0.18 * pulse})`;
      g.beginPath();
      g.arc(cx, cy, CORE.halo * pulse, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#7c5cff";
      g.beginPath();
      g.arc(cx, cy, CORE.r * pulse, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(247,247,250,0.9)";
      g.beginPath();
      g.arc(cx, cy, 1.2, 0, Math.PI * 2);
      g.fill();

      // soft radial highlight following cursor (§10)
      if (cursor.x > -9990) {
        const grad = g.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 210);
        grad.addColorStop(0, "rgba(143,231,255,0.055)");
        grad.addColorStop(1, "rgba(143,231,255,0)");
        g.fillStyle = grad;
        g.fillRect(cursor.x - 210, cursor.y - 210, 420, 420);
      }
    }

    let raf = 0;
    let running = false;
    let inView = true;
    let tabHidden = document.visibilityState === "hidden";

    function step(now: number) {
      render(now);
      raf = requestAnimationFrame(step);
    }

    function sync() {
      const shouldRun = inView && !tabHidden && !reducedRef.current;
      if (shouldRun && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }

    const reducedRef = { current: reduced };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        const rect = box.getBoundingClientRect();
        cursor.tx = e.clientX - rect.left;
        cursor.ty = e.clientY - rect.top;
      }
    };
    const onLeave = () => {
      cursor.tx = -9999;
      cursor.ty = -9999;
    };
    const onVisibility = () => {
      tabHidden = document.visibilityState === "hidden";
      sync();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.08 },
    );

    layout();
    io.observe(container);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    sync();

    const onResize = () => layout();
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  const showCanvas = !reduced && !canvasFailed;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {showCanvas ? (
        <canvas ref={canvasRef} className="pointer-events-none" />
      ) : (
        <StaticGraph />
      )}
    </div>
  );
}

/** Static fallback — also the reduced-motion rendering (§29, §56). */
function StaticGraph() {
  return (
    <svg
      className="pointer-events-none h-full w-full"
      viewBox="0 0 640 400"
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke="rgba(124,92,255,0.16)" strokeWidth="1">
        {[
          [320, 168, 90, 90],
          [320, 168, 170, 60],
          [320, 168, 260, 180],
          [320, 168, 100, 250],
          [320, 168, 240, 290],
          [320, 168, 430, 250],
          [320, 168, 560, 180],
          [320, 168, 500, 80],
        ].map(([x1, y1, x2, y2]) => (
          <line key={`${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      {[
        [90, 90, "preference"],
        [170, 60, "retrieval"],
        [260, 180, "fact"],
        [100, 250, "habit"],
        [240, 290, "relationship"],
        [430, 250, "project"],
        [560, 180, "session"],
        [500, 80, "source"],
      ].map(([x, y, label]) => (
        <g key={label as string}>
          <circle cx={x as number} cy={y as number} r={3} fill="rgba(143,231,255,0.8)" />
          <text
            x={(x as number) + 8}
            y={(y as number) + 4}
            fontFamily='"IBM Plex Mono", monospace'
            fontSize="10"
            fill="rgba(245,245,250,0.38)"
          >
            {label}
          </text>
        </g>
      ))}
      <circle cx="320" cy="168" r="11" fill="rgba(124,92,255,0.18)" />
      <circle cx="320" cy="168" r="3.5" fill="#7c5cff" />
      <circle cx="320" cy="168" r="1.2" fill="rgba(247,247,250,0.9)" />
    </svg>
  );
}
