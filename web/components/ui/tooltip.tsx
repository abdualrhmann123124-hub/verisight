"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps the app once so tooltips share a single delay timer — after the
 * first opens, neighbours appear instantly instead of re-waiting.
 */
export function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 500,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

/**
 * Tooltip.
 *
 * Supplementary only. A tooltip is invisible to touch users and to anyone
 * navigating by keyboard alone at speed, so it must never be the sole
 * carrier of information needed to complete a task — that belongs in a
 * visible label or hint.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 max-w-64 rounded-lg border border-line bg-surface-overlay",
            "px-3 py-1.5 text-caption text-ink shadow-lg",
            // Radix marks an open tooltip `instant-open` or `delayed-open`;
            // scoping the animation to those states keeps it from replaying
            // as the tooltip is dismissed.
            "data-[state=delayed-open]:animate-pop-in",
            "data-[state=instant-open]:animate-pop-in",
            "motion-reduce:animate-none",
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--surface-overlay)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
