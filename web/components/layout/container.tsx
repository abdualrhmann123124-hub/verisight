import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full", {
  variants: {
    width: {
      // Caps at 1280px. Beyond that, line length on an ultrawide monitor
      // outruns comfortable reading and the layout stops feeling composed.
      default: "max-w-[var(--container-max)]",
      prose: "max-w-[var(--container-prose)]",
      wide: "max-w-[96rem]",
      full: "max-w-none",
    },
    gutter: {
      // Gutters grow with the viewport: 16px on a phone would waste screen,
      // 16px on a desktop would look cramped against the edge.
      true: "px-4 sm:px-6 lg:px-8",
      false: "",
    },
  },
  defaultVariants: { width: "default", gutter: true },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {
  as?: ElementType;
}

export function Container({
  className,
  width,
  gutter,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(containerVariants({ width, gutter }), className)}
      {...props}
    />
  );
}

const sectionVariants = cva("relative w-full", {
  variants: {
    spacing: {
      // Vertical rhythm scales down on small screens: desktop-sized padding
      // on a phone means the user scrolls past empty space to reach content.
      sm: "py-12 sm:py-16",
      md: "py-16 sm:py-24",
      lg: "py-24 sm:py-32",
      xl: "py-32 sm:py-40",
    },
  },
  defaultVariants: { spacing: "md" },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  as?: ElementType;
}

export function Section({
  className,
  spacing,
  as: Component = "section",
  ...props
}: SectionProps) {
  return <Component className={cn(sectionVariants({ spacing }), className)} {...props} />;
}

export { containerVariants, sectionVariants };
