import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

export interface LogoMarkProps {
  className?: string;
  /** Paints the mark with the brand gradient instead of `currentColor`. */
  gradient?: boolean;
}

/**
 * The VeriSight mark — an aperture of concentric arcs around a focal point.
 *
 * The arcs are deliberately broken rather than closed. A sealed ring reads as
 * a stamp of approval, and this product never issues one: it measures, and it
 * reports what the measurement supports. The gaps are the idea made visual.
 *
 * Geometry is tuned to survive 16px. The two rings counter-rotate so the mark
 * stays legible as a favicon, where a symmetrical gap pattern would collapse
 * into an ambiguous smudge.
 */
export function LogoMark({ className, gradient = false }: LogoMarkProps) {
  // Unique per render so two marks on one page cannot collide on gradient id.
  const gradientId = "vs-mark-gradient";
  const stroke = gradient ? `url(#${gradientId})` : "currentColor";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={`${SITE.name} logo`}
      className={cn("size-8", className)}
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--support)" />
          </linearGradient>
        </defs>
      )}

      {/* Outer aperture — circumference ≈ 81.68, broken into three arcs. */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="19 8.23"
        transform="rotate(-64 16 16)"
      />

      {/* Inner iris — counter-rotated so the gaps never align with the outer
          ring, which is what keeps the mark readable when scaled down. */}
      <circle
        cx="16"
        cy="16"
        r="7.5"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="14.7 8.85"
        transform="rotate(52 16 16)"
      />

      {/* Focal point */}
      <circle cx="16" cy="16" r="2.75" fill={stroke} />
    </svg>
  );
}

export interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Hides the wordmark, leaving only the mark. */
  markOnly?: boolean;
  gradient?: boolean;
}

/**
 * Mark plus wordmark.
 *
 * "Veri" sits at regular weight and "Sight" at semibold — the weight shift
 * carries the compound word without resorting to a colour change, which would
 * break down in greyscale and in high-contrast mode.
 */
export function Logo({
  className,
  markClassName,
  markOnly = false,
  gradient = true,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("size-7", markClassName)} gradient={gradient} />
      {!markOnly && (
        <span className="font-display text-h4 leading-none tracking-tight text-ink">
          <span className="font-normal">Veri</span>
          <span className="font-semibold">Sight</span>
        </span>
      )}
    </span>
  );
}
