"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useCallback, useId, useRef, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<
  ComponentProps<typeof SwitchPrimitive.Root>,
  "children"
> {
  label: ReactNode;
  description?: ReactNode;
  /** Keeps the label available to assistive tech while hiding it visually. */
  hideLabel?: boolean;
}

/**
 * Toggle for an immediate, self-applying setting.
 *
 * If the change needs a separate save step, use a checkbox instead — a
 * switch implies the effect has already happened.
 *
 * Naming is done with `aria-labelledby`, not `<label htmlFor>`. Radix renders
 * the switch as a `<button>`, and `<label>` only names native form controls
 * (input/select/textarea) — pointed at a button it contributes no accessible
 * name and no click forwarding. So the text is a plain element referenced by
 * id, and the click handler below restores the "tap the label" affordance
 * that the label element would otherwise have provided.
 */
export function Switch({
  className,
  label,
  description,
  hideLabel = false,
  id,
  disabled,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const labelId = `${switchId}-label`;
  const descriptionId = description ? `${switchId}-description` : undefined;
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleLabelClick = useCallback(() => {
    switchRef.current?.click();
  }, []);

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      <SwitchPrimitive.Root
        ref={switchRef}
        id={switchId}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center",
          "rounded-full border border-transparent",
          "transition-colors duration-200 ease-[var(--ease-out-expo)]",
          "bg-surface-inset data-[state=checked]:bg-accent",
          "border-line data-[state=checked]:border-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          // The track is 24px tall, below the 44px touch minimum. This
          // pseudo-element extends the tap area without changing layout or
          // the visual size of the control.
          "before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-['']",
        )}
        {...props}
      />

      <div className={cn("flex flex-col gap-0.5", hideLabel && "sr-only")}>
        <span
          id={labelId}
          onClick={handleLabelClick}
          className="cursor-pointer text-body-sm font-medium text-ink"
        >
          {label}
        </span>
        {description && (
          <p id={descriptionId} className="text-caption text-ink-faint">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
