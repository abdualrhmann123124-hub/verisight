import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium",
    "whitespace-nowrap",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        neutral: "border-line bg-surface-raised text-ink-muted",
        accent: "border-transparent bg-accent-subtle text-accent",
        support: "border-transparent bg-support-subtle text-support",
        success: "border-transparent bg-success-subtle text-success",
        warning: "border-transparent bg-warning-subtle text-warning",
        danger: "border-transparent bg-danger-subtle text-danger",
        outline: "border-line-strong bg-transparent text-ink-muted",
      },
      size: {
        sm: "h-5 px-2 text-micro [&_svg]:size-3",
        md: "h-6 px-2.5 text-caption [&_svg]:size-3.5",
        lg: "h-7 px-3 text-body-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
  /**
   * Small filled circle preceding the label. Use for live/status meaning
   * where an icon would be too heavy — but never as the *only* signal,
   * since a dot conveys nothing to a screen reader.
   */
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  icon,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current opacity-80"
        />
      )}
      {icon}
      {children}
    </span>
  );
}

export { badgeVariants };
