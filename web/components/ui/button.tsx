"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2",
    "font-medium whitespace-nowrap select-none",
    "rounded-lg border border-transparent",
    "transition-[background-color,border-color,color,box-shadow,transform,opacity]",
    "duration-150 ease-[var(--ease-out-expo)]",
    "cursor-pointer",
    // Press feedback lives on the base so every variant feels the same
    // under the finger. Scale, not translate — translate on a button in a
    // flex row nudges its neighbours.
    "active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:pointer-events-none disabled:opacity-45",
    // Icons inherit sizing so callers never hand-size them.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-on-accent shadow-sm",
          "hover:bg-accent-hover hover:shadow-glow",
          "active:bg-accent-active",
        ].join(" "),
        secondary: [
          "border-line bg-surface-raised text-ink shadow-sm",
          "hover:border-line-strong hover:bg-surface-overlay",
        ].join(" "),
        ghost: "text-ink-muted hover:bg-surface-raised hover:text-ink",
        subtle: [
          "bg-accent-subtle text-accent",
          "hover:bg-accent hover:text-on-accent",
        ].join(" "),
        danger: [
          "bg-danger-subtle text-danger",
          "hover:bg-danger hover:text-on-accent",
        ].join(" "),
        link: [
          "h-auto rounded-sm p-0 text-accent underline-offset-4",
          "hover:underline active:scale-100",
        ].join(" "),
      },
      size: {
        // Heights stay on the 8pt grid. `sm` is 32px — below the 44px touch
        // target, so it is reserved for pointer-dense toolbars, never for a
        // primary action on mobile.
        sm: "h-8 gap-1.5 px-3 text-body-sm [&_svg]:size-4",
        md: "h-10 px-4 text-body-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-body [&_svg]:size-5",
        icon: "size-10 p-0 [&_svg]:size-5",
        "icon-sm": "size-8 p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as the child element instead of a `<button>` (e.g. a Next.js `<Link>`). */
  asChild?: boolean;
  /** Swaps content for a spinner and blocks interaction. */
  loading?: boolean;
  /** Announced to screen readers while `loading`. */
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/**
 * The primary action primitive.
 *
 * Loading keeps the button's original width by hiding the label with
 * `opacity-0` rather than replacing it — a button that shrinks mid-submit
 * shifts the layout under the user's cursor, which is exactly when they are
 * least able to tolerate it.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingLabel = "Loading",
    leadingIcon,
    trailingIcon,
    children,
    disabled,
    type,
    ...props
  },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size }), className);

  // `Slot` accepts exactly one child and forwards props onto it, so the
  // loading/icon composition below cannot apply. In `asChild` mode the
  // caller owns the content — we contribute styling and nothing else.
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      // Left unset, a button inside a form defaults to "submit" — a classic
      // source of accidental submissions.
      type={type ?? "button"}
      className={classes}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      )}
      {/* `opacity-0` hides the label visually but leaves it in the
          accessibility tree, so without `aria-hidden` a loading button
          announces its label twice ("Loading Loading"). The span still
          occupies space — that is what holds the button's width steady. */}
      <span
        aria-hidden={loading || undefined}
        className={cn("inline-flex items-center gap-2", loading && "opacity-0")}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
    </button>
  );
});

export { buttonVariants };
