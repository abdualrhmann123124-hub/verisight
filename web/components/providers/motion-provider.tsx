"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion root.
 *
 * `reducedMotion="user"` makes `prefers-reduced-motion` a framework-level
 * guarantee rather than a per-component promise: Motion drops transform and
 * layout animation for every descendant automatically, so a component author
 * cannot forget to handle it.
 *
 * The CSS side of the same guarantee lives in `styles/tokens.css`, which
 * collapses CSS transitions and keyframes under the same media query.
 * Both are needed — one covers JS-driven motion, the other covers CSS.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22 }}>
      {children}
    </MotionConfig>
  );
}
