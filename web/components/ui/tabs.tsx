"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ComponentProps,
} from "react";

import { SPRING_LAYOUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  /** Scopes the shared-layout indicator so two Tabs on one page never
   *  animate into each other. */
  groupId: string;
  activeValue: string | undefined;
}

const TabsContext = createContext<TabsContextValue>({
  groupId: "tabs",
  activeValue: undefined,
});

/**
 * Tabs root.
 *
 * Mirrors Radix's value into context because the sliding indicator needs to
 * render in exactly one trigger — the active one. Motion resolves a
 * `layoutId` by matching a single mounted instance; rendering a hidden copy
 * inside every trigger produces duplicate ids and undefined behaviour.
 *
 * Tracks both controlled (`value`) and uncontrolled (`defaultValue`) usage so
 * the component behaves like the Radix primitive it wraps.
 */
export function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  const groupId = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const activeValue = value ?? uncontrolled;

  const handleValueChange = useCallback(
    (next: string) => {
      setUncontrolled(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  return (
    <TabsContext.Provider value={{ groupId, activeValue }}>
      <TabsPrimitive.Root
        className={cn("flex flex-col gap-6", className)}
        // Spread conditionally rather than passing `undefined`: under
        // `exactOptionalPropertyTypes`, a present-but-undefined key is not
        // the same as an absent one, and Radix switches between controlled
        // and uncontrolled on exactly that distinction.
        {...(value !== undefined
          ? { value }
          : defaultValue !== undefined
            ? { defaultValue }
            : {})}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-line bg-surface-inset p-1",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Tab trigger. The active pill is a single shared-layout element that slides
 * between triggers rather than blinking out and in.
 *
 * The pill is `aria-hidden`: Radix already exposes selection through
 * `aria-selected`, so announcing it again would be redundant.
 */
export function TabsTrigger({
  className,
  children,
  value,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { groupId, activeValue } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "relative isolate inline-flex cursor-pointer items-center justify-center gap-2",
        "rounded-md px-3.5 py-1.5 text-body-sm font-medium whitespace-nowrap",
        "text-ink-muted transition-colors duration-200",
        "hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:pointer-events-none disabled:opacity-45",
        "data-[state=active]:text-ink",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          aria-hidden="true"
          layoutId={`${groupId}-tab-indicator`}
          transition={SPRING_LAYOUT}
          className="absolute inset-0 -z-10 rounded-md border border-line bg-surface-raised"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}
