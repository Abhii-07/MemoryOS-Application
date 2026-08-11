"use client";

import { useMotionPref } from "@/lib/motion/motion-context";

/** Manual Motion On/Off control (spec §29). */
export function MotionToggle() {
  const { reduced, toggle } = useMotionPref();
  const motionOn = !reduced;

  return (
    <button
      onClick={toggle}
      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[rgba(255,255,255,0.1)] bg-transparent px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-faint transition-colors hover:border-[rgba(255,255,255,0.22)] hover:text-muted"
      aria-pressed={motionOn}
      title="Toggle animations (also respects your system reduced-motion setting)"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${motionOn ? "bg-success" : "bg-faint"}`}
        aria-hidden="true"
      />
      Motion: {motionOn ? "On" : "Off"}
    </button>
  );
}
