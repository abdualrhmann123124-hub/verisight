"use client";

import { useMotionValue, useSpring, useTransform, motion } from "motion/react";
import { useEffect } from "react";

import { SPRING_PRECISE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

/**
 * Counts up to a value.
 *
 * Uses a near-critically-damped spring so the number never overshoots. On a
 * confidence readout an overshoot would briefly render a figure the analysis
 * did not produce — a small animation detail that would undermine the one
 * thing this product sells, which is not overstating what it knows.
 *
 * The animated text is `aria-hidden` and the final value is exposed once to
 * assistive tech, so a screen reader announces "84%" rather than every
 * intermediate frame.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, SPRING_PRECISE);
  const display = useTransform(
    spring,
    (latest: number) => `${prefix}${latest.toFixed(decimals)}${suffix}`,
  );

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <span className={cn("tabular", className)}>
      <motion.span aria-hidden="true">{display}</motion.span>
      <span className="sr-only">{`${prefix}${value.toFixed(decimals)}${suffix}`}</span>
    </span>
  );
}
