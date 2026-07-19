"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Cross-fades route content on navigation.
 *
 * Keyed on the pathname so React remounts the subtree per route. The
 * movement is only 8px and the fade is short: a page transition is dead
 * time the user is waiting through, and anything longer than ~250ms starts
 * to read as latency rather than polish.
 *
 * Deliberately fades in only, with no exit animation. `AnimatePresence`
 * around App Router children would have to hold the outgoing page mounted
 * while the incoming one renders, which fights streaming and delays first
 * paint of the content the user actually asked for.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
