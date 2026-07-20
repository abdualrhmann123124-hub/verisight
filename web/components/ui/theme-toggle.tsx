"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

import { cn } from "@/lib/utils";

/**
 * Light/dark switch.
 *
 * Both icons are always in the DOM, cross-fading via the `light:` variant
 * driven by `[data-theme]`. The usual alternative — gate on a `mounted`
 * flag from `useTheme()` and render nothing until hydration — produces a
 * visible pop as the control appears, and `resolvedTheme` is `undefined`
 * on the server, so branching on it directly is a hydration mismatch.
 * Letting CSS resolve the attribute means the correct icon is painted on
 * the very first frame with no JavaScript involved.
 */
export function ThemeToggle({
  className,
  label = "Toggle colour theme",
}: {
  className?: string;
  label?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <button
      type="button"
      onClick={toggle}
      // The label names the control, not the current state: it stays "toggle
      // theme" rather than "switch to dark", because the server cannot know
      // the active theme and a state-dependent label would mismatch on
      // hydration. It may still be localised — the locale is server-known.
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-10 shrink-0 cursor-pointer place-items-center",
        "rounded-lg border border-line bg-surface-raised text-ink-muted",
        "transition-[background-color,border-color,color] duration-200",
        "ease-[var(--ease-out-expo)]",
        "hover:border-line-strong hover:bg-surface-overlay hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "active:scale-[0.96]",
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        className={cn(
          "absolute size-4.5 transition-all duration-300 ease-[var(--ease-out-expo)]",
          "scale-0 -rotate-90 opacity-0",
          "light:scale-100 light:rotate-0 light:opacity-100",
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          "absolute size-4.5 transition-all duration-300 ease-[var(--ease-out-expo)]",
          "scale-100 rotate-0 opacity-100",
          "light:scale-0 light:rotate-90 light:opacity-0",
        )}
      />
    </button>
  );
}
