import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Loading placeholder.
 *
 * A skeleton is only an improvement over a spinner if it matches the shape
 * of the content that replaces it — otherwise the layout jumps on load and
 * costs more in perceived quality than the shimmer bought.
 *
 * Marked `aria-hidden` with a `role="status"` wrapper expected around
 * groups: announcing a dozen individual placeholders tells the user
 * nothing useful.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-raised",
        // Shimmer rather than pulse: a sweep reads as work in progress,
        // whereas a fade can be mistaken for a disabled element.
        "after:absolute after:inset-0 after:animate-shimmer",
        "after:bg-[linear-gradient(90deg,transparent,var(--line),transparent)]",
        "after:bg-[length:200%_100%]",
        "motion-reduce:after:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}
