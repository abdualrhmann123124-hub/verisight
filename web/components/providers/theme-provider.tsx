"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme root.
 *
 * `attribute="data-theme"` matches the selector the token layer keys off
 * (`:root[data-theme="light"]`). `defaultTheme="system"` means a first-time
 * visitor gets whatever their OS is set to; the toggle then persists an
 * explicit choice over it.
 *
 * `disableTransitionOnChange` suppresses CSS transitions for the duration of
 * a theme swap. Without it, every transition-bearing element animates its
 * colour independently and the switch smears instead of cutting cleanly.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemeProvider>) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark"]}
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}
