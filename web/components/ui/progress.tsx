"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, type ComponentProps } from "react";

import { SPRING_PRECISE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════
   Linear
   ══════════════════════════════════════════════════════════════════════ */

export interface ProgressProps extends Omit<
  ComponentProps<typeof ProgressPrimitive.Root>,
  "value"
> {
  /** 0–100. */
  value: number;
  tone?: "accent" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

const TONE_BAR: Record<NonNullable<ProgressProps["tone"]>, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
};

export function Progress({
  className,
  value,
  tone = "accent",
  size = "md",
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <ProgressPrimitive.Root
      value={clamped}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-surface-inset",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
      {...props}
    >
      {/* Animating `transform` rather than `width` keeps the bar on the
          compositor — a width animation forces layout on every frame. */}
      <ProgressPrimitive.Indicator asChild>
        <motion.div
          className={cn("h-full w-full rounded-full", TONE_BAR[tone])}
          initial={{ transform: "translateX(-100%)" }}
          animate={{ transform: `translateX(-${100 - clamped}%)` }}
          transition={SPRING_PRECISE}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Circular
   ══════════════════════════════════════════════════════════════════════ */

export interface CircularProgressProps {
  /** 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Any CSS colour, normally a `var(--…)` token. Defaults to the accent. */
  color?: string;
  className?: string;
  /** Rendered in the centre — typically the value and its label. */
  children?: React.ReactNode;
  /** Describes the metric for assistive tech, e.g. "AI generation likelihood". */
  label: string;
}

/**
 * Ring gauge for the confidence card.
 *
 * The arc is drawn with `strokeDasharray`/`strokeDashoffset` and animated on
 * a spring with almost no overshoot: a gauge that springs past its value and
 * settles back would briefly display a number the analysis never produced.
 *
 * The SVG itself is `aria-hidden`; the value is exposed once via a
 * `role="meter"` wrapper so a screen reader hears the number rather than a
 * description of two circles.
 */
export function CircularProgress({
  value,
  size = 180,
  strokeWidth = 10,
  color = "var(--accent)",
  className,
  children,
  label,
}: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const spring = useSpring(progress, SPRING_PRECISE);
  const dashOffset = useTransform(
    spring,
    (v: number) => circumference - (v / 100) * circumference,
  );

  useEffect(() => {
    progress.set(clamped);
  }, [clamped, progress]);

  return (
    <div
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        aria-hidden="true"
        // Rotate so the arc starts at 12 o'clock rather than 3 o'clock.
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-inset)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
