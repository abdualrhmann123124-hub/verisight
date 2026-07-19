"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ElementType, ReactNode } from "react";

import { EASE_OUT_EXPO, DURATION, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Seconds to hold before animating. Use sparingly — a delay the user
   *  waits through is worse than no animation. */
  delay?: number;
  /** Travel distance in px. Direction follows the sign. */
  distance?: number;
  as?: ElementType;
}

/**
 * Reveals its children as they scroll into view.
 *
 * `once: true` means content animates a single time; replaying on every
 * scroll-past turns a long page into a flicker show. The `-80px` bottom
 * margin starts the animation just before the element reaches the viewport,
 * so it is already settling as it arrives rather than visibly popping.
 *
 * Reduced motion is handled by the MotionConfig root, which strips the
 * transform and leaves the opacity fade.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 16,
  as = "div",
  ...props
}: RevealProps) {
  const MotionComponent = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionComponent
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: DURATION.slower, ease: EASE_OUT_EXPO, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export interface StaggerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
}

/**
 * Reveals children in sequence rather than all at once.
 *
 * Pair with `StaggerItem`. The 60ms step is deliberately short: long
 * staggers look choreographed in a demo and feel slow to anyone who is
 * actually trying to read the page.
 */
export function Stagger({ children, className, ...props }: StaggerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.slow, ease: EASE_OUT_EXPO },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
