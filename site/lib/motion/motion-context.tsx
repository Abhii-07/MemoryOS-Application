"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Motion preference (spec §29):
 *  - follows `prefers-reduced-motion` unless the user overrides it manually
 *  - manual override is persisted (localStorage) — footer Motion toggle
 */
const STORAGE_KEY = "memoryos:motion";

interface MotionPref {
  reduced: boolean;
  toggle: () => void;
}

const MotionContext = createContext<MotionPref>({ reduced: false, toggle: () => {} });

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let raf = 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        raf = requestAnimationFrame(() => setReduced(stored === "off"));
        return () => cancelAnimationFrame(raf);
      }
    } catch {
      /* storage unavailable — fall through to media query */
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    raf = requestAnimationFrame(apply); // defer initial sync (avoid sync setState in effect)
    mq.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", apply);
    };
  }, []);

  const toggle = useCallback(() => {
    setReduced((r) => {
      const next = !r;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "off" : "on");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return <MotionContext.Provider value={{ reduced, toggle }}>{children}</MotionContext.Provider>;
}

export function useMotionPref(): MotionPref {
  return useContext(MotionContext);
}
