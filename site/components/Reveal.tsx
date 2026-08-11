"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionPref } from "@/lib/motion/motion-context";

/**
 * Reveal — one-shot fade-up on first view (spec §52).
 * Honors the manual Motion toggle; renders statically when reduced.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { reduced } = useMotionPref();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
