"use client";

import { AlertCircle } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  /**
   * Hides the label visually while keeping it for assistive tech. Use only
   * where surrounding context makes the purpose obvious — a placeholder is
   * not a label: it vanishes on first keystroke, exactly when a user who
   * paused to think needs it most.
   */
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
  inputSize?: "md" | "lg";
}

/**
 * Text input with label, hint, and inline validation.
 *
 * Errors render directly beneath the field rather than in a summary at the
 * top of the form, and are wired via `aria-describedby` so a screen reader
 * announces the message when focus lands on the offending input.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    hideLabel = false,
    hint,
    error,
    leadingIcon,
    trailingSlot,
    inputSize = "md",
    id,
    disabled,
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-body-sm font-medium text-ink",
          hideLabel && "sr-only",
          disabled && "opacity-45",
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-lg border bg-surface-inset",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "ease-[var(--ease-out-expo)]",
          "focus-within:border-accent focus-within:shadow-glow",
          inputSize === "md" ? "h-11 px-3" : "h-13 px-4",
          error ? "border-danger" : "border-line hover:border-line-strong",
          disabled && "pointer-events-none opacity-45",
        )}
      >
        {leadingIcon && (
          <span
            className="grid shrink-0 place-items-center text-ink-faint transition-colors group-focus-within:text-accent [&_svg]:size-4.5"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink outline-none",
            "placeholder:text-ink-faint",
            // Fills the wrapper's full height so the entire 44px row is the
            // input's own hit area. Left at its intrinsic ~22px, a tap on
            // the padding above the text would land on the wrapper div and
            // focus nothing — the wrapper is not a <label>.
            "h-full",
            // The wrapper owns the focus ring; the inner element must not
            // paint a second one on top of it.
            "focus-visible:outline-none",
            inputSize === "md" ? "text-body-sm" : "text-body",
          )}
          {...props}
        />

        {trailingSlot && <span className="shrink-0">{trailingSlot}</span>}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
