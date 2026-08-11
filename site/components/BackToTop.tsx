"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * Back to top — fixed bottom-right button (site-wide).
 * Appears after ~640px of scroll; state changes only on the threshold
 * crossing (passive listener). Reduced motion → instant jump, no transform.
 */

const SHOW_AFTER = 640;

export function BackToTop() {
  const { reduced } = useMotionPref();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(13,13,17,0.82)] text-secondary shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[rgba(255,255,255,0.3)] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      } ${reduced ? "!translate-y-0" : ""}`}
    >
      <ArrowUp size={16} aria-hidden="true" />
    </button>
  );
}
