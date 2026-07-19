import type { Transition, Variants } from "motion/react";

/**
 * Motion vocabulary.
 *
 * Every animation in VeriSight draws from this file. Hand-tuned durations
 * scattered across components are how a UI starts to feel inconsistent —
 * one surface easing at 200ms next to another at 400ms reads as sloppy even
 * when no single value is wrong.
 *
 * Springs are preferred over duration-based tweens for anything the user
 * directly manipulates: they carry momentum, so an interrupted gesture
 * resolves naturally instead of snapping.
 */

/** Signature easing — quick departure, soft landing. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  base: 0.22,
  slow: 0.32,
  slower: 0.45,
} as const;

/** Crisp and responsive. Buttons, toggles, anything under the cursor. */
export const SPRING_UI: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.6,
};

/** Softer and heavier. Panels, shared-layout moves, dialogs. */
export const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.9,
};

/** Almost no overshoot. Progress rings and numeric counters, where a
 *  bounce would misrepresent the value being displayed. */
export const SPRING_PRECISE: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 34,
  mass: 1,
};

export const TWEEN_BASE: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT_EXPO,
};

/**
 * Scroll reveal. Distance is deliberately small — 16px reads as the content
 * settling into place; 60px reads as content flying in, which gets tiring
 * on a page the user scrolls repeatedly.
 */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slower, ease: EASE_OUT_EXPO },
  },
};

/** Reduced-motion counterpart: same states, opacity only, no travel. */
export const revealVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/**
 * Exit runs faster than enter (≈0.6×). Entering content is information the
 * user needs time to parse; leaving content is already dismissed, and making
 * them wait for it to finish is what makes an interface feel sluggish.
 */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: SPRING_LAYOUT },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: DURATION.fast, ease: EASE_OUT_QUART },
  },
};
