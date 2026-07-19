"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DURATION, EASE_OUT_EXPO, SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#technology", label: "Technology" },
  { href: "#example", label: "Example" },
  { href: "#faq", label: "FAQ" },
] as const;

/**
 * Sticky top navigation.
 *
 * Transparent over the hero and frosted once scrolled — the border and blur
 * only appear when there is content behind them to separate from. Applying
 * them at rest would put a hairline across an otherwise clean hero for no
 * reason.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    // `passive` keeps the listener off the scroll-blocking path.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A menu that stays open while the page scrolls behind it feels detached,
  // and on mobile the body scrolling under an overlay is disorienting.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-[var(--header-height)]",
        "transition-[background-color,border-color,backdrop-filter] duration-300",
        "ease-[var(--ease-out-expo)]",
        scrolled ? "glass border-b" : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          aria-label="VeriSight home"
        >
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-body-sm text-ink-muted",
                "transition-colors duration-150 hover:text-ink",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
          <Button size="sm" asChild>
            <Link href="/analyze">Analyze media</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={cn(
              "grid size-10 cursor-pointer place-items-center rounded-lg",
              "border border-line bg-surface-raised text-ink-muted",
              "transition-colors hover:text-ink",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            )}
          >
            {menuOpen ? (
              <X className="size-4.5" aria-hidden="true" />
            ) : (
              <Menu className="size-4.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT_EXPO }}
            className="glass absolute inset-x-0 top-full border-b md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-body text-ink-muted",
                    "transition-colors hover:bg-surface-raised hover:text-ink",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  )}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
                <Button variant="secondary" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Button>
                <Button asChild>
                  <Link href="/analyze" onClick={() => setMenuOpen(false)}>
                    Analyze media
                  </Link>
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hairline that brightens as the page scrolls — a subtler separator
          than a hard border, and it reinforces the accent without adding
          another chrome element. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        initial={false}
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={SPRING_UI}
      />
    </header>
  );
}
