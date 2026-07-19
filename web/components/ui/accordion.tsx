"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-line", className)}
      {...props}
    />
  );
}

/**
 * Accordion trigger.
 *
 * The indicator is a plus that rotates into a cross rather than a chevron:
 * plus/minus reads as "expand/collapse" independently of reading direction,
 * whereas a chevron's meaning depends on which way it points and is easier to
 * misread at small sizes.
 *
 * Radix wires `aria-expanded` and the panel relationship, so the state is
 * announced without any extra markup here.
 */
export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 cursor-pointer items-start justify-between gap-6",
          "py-5 text-left font-display text-h4 text-ink",
          "transition-colors duration-200 hover:text-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          className,
        )}
        {...props}
      >
        {children}
        <Plus
          aria-hidden="true"
          className={cn(
            "mt-1 size-5 shrink-0 text-ink-faint",
            "transition-transform duration-300 ease-[var(--ease-out-expo)]",
            "group-hover:text-accent group-data-[state=open]:rotate-45",
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden",
        // Radix publishes the measured panel height as a CSS variable, which
        // is what makes an accordion animate to `auto` — a height that CSS
        // cannot otherwise transition to.
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className,
      )}
      {...props}
    >
      <div className="max-w-prose pb-6 text-body text-ink-muted">{children}</div>
    </AccordionPrimitive.Content>
  );
}
