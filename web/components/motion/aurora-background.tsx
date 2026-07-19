import { cn } from "@/lib/utils";

export interface AuroraBackgroundProps {
  className?: string;
  /** Adds a faint engineering grid over the wash. */
  grid?: boolean;
  /** 0–1. Default is low on purpose. */
  intensity?: number;
}

/**
 * Ambient background wash.
 *
 * Three heavily-blurred colour fields drifting on long, offset cycles. The
 * brief calls for a background that feels alive; the hard part is doing that
 * without competing with the content in front of it, so:
 *
 *  - Only `transform` animates — no layout, no paint, entirely on the
 *    compositor. Blur is applied once at paint and never re-evaluated.
 *  - Cycles are 24s and deliberately non-harmonic (multiplied by 1.4 and
 *    0.8), so the composition never visibly loops.
 *  - Opacity stays low. If you can consciously notice it moving while
 *    reading, it is too strong.
 *  - `prefers-reduced-motion` freezes the drift via the global rule in
 *    tokens.css; the gradient itself remains, so the page keeps its depth.
 *
 * Server component: it holds no state and no effects, so it costs zero
 * client JavaScript.
 */
export function AuroraBackground({
  className,
  grid = true,
  intensity = 0.5,
}: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      // `isolate` keeps blend modes from reaching sibling content;
      // `contain: strict` stops the blur from triggering ancestor repaints.
      className={cn(
        "pointer-events-none absolute inset-0 isolate -z-10 overflow-hidden",
        className,
      )}
      style={{ contain: "strict" }}
    >
      <div
        className="absolute -top-1/4 left-1/2 size-[60rem] -translate-x-1/2 animate-aurora rounded-full blur-[120px] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent) 55%, transparent), transparent 65%)",
          opacity: intensity * 0.55,
        }}
      />
      <div
        className="absolute top-1/3 -right-1/4 size-[45rem] animate-aurora rounded-full blur-[110px] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--support) 45%, transparent), transparent 65%)",
          opacity: intensity * 0.4,
          animationDuration: "33.6s",
          animationDirection: "reverse",
        }}
      />
      <div
        className="absolute -bottom-1/4 -left-1/6 size-[40rem] animate-aurora rounded-full blur-[100px] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent) 35%, transparent), transparent 70%)",
          opacity: intensity * 0.3,
          animationDuration: "19.2s",
        }}
      />

      {grid && (
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            // Fades the grid out toward the edges so it reads as depth
            // rather than as a visible sheet laid over the page.
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 75%)",
          }}
        />
      )}
    </div>
  );
}
