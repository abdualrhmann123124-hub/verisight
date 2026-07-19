"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef, type HTMLAttributes } from "react";

import { SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative rounded-xl border transition-colors duration-200 ease-[var(--ease-out-expo)]",
  {
    variants: {
      variant: {
        // In dark mode a drop shadow against a near-black page is invisible,
        // so elevation is carried by surface lightness and border contrast.
        // The shadow tokens still fire in light mode, where they do work.
        surface: "border-line bg-surface shadow-sm",
        raised: "border-line bg-surface-raised shadow-md",
        inset: "border-line-subtle bg-surface-inset",
        glass: "glass border",
        outline: "border-line bg-transparent",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer hover:border-line-strong",
        false: "",
      },
    },
    defaultVariants: { variant: "surface", padding: "md", interactive: false },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, padding, interactive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  );
});

export type MotionCardProps = HTMLMotionProps<"div"> & VariantProps<typeof cardVariants>;

/**
 * Card that lifts on hover.
 *
 * The lift is 2px. Large hover translations look impressive in isolation and
 * become nauseating in a grid, where moving the cursor across the page sets
 * off a wave of motion. Under `prefers-reduced-motion` the MotionConfig root
 * drops the transform entirely and the border/shadow still communicate hover.
 */
export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(function MotionCard(
  { className, variant, padding, interactive, ...props },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -2 }}
      transition={SPRING_UI}
      className={cn(
        cardVariants({ variant, padding, interactive: interactive ?? true }),
        "hover:shadow-lg",
        className,
      )}
      {...props}
    />
  );
});

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-h4 text-ink", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm text-ink-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-body-sm text-ink-muted", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 pt-2", className)} {...props} />;
}

export { cardVariants };
