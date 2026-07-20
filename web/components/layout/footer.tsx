"use client";

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { useLocale } from "@/components/providers/locale-provider";
import { Separator } from "@/components/ui/separator";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  // Anchors are fixed; labels come from the active dictionary. Product links
  // reuse the nav labels so the two menus never drift out of sync.
  const footerNav = [
    {
      heading: t.footer.product,
      links: [
        { href: "/analyze", label: t.nav.analyzeMedia },
        { href: "#how-it-works", label: t.nav.howItWorks },
        { href: "#technology", label: t.nav.technology },
        { href: "#example", label: t.footer.exampleReport },
      ],
    },
    {
      heading: t.footer.resources,
      links: [
        { href: "/about", label: t.footer.about },
        { href: "#faq", label: t.nav.faq },
        { href: "/about#limitations", label: t.footer.limitations },
        { href: "/about#privacy", label: t.footer.privacy },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-line bg-surface/40">
      <Container className="py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Logo />
            <p className="text-body-sm text-ink-muted">{SITE.description}</p>

            {/* The honesty note belongs in the footer of every page, not
                buried in an About section. It is the single most important
                thing to say about what this tool's output means. */}
            <p className="text-caption text-ink-faint">{t.footer.tagline}</p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-12 gap-y-8 sm:gap-x-20"
          >
            {footerNav.map((group) => (
              <div key={group.heading} className="flex flex-col gap-3">
                <h2 className="font-display text-caption font-semibold tracking-wide text-ink uppercase">
                  {group.heading}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "rounded-sm text-body-sm text-ink-muted",
                          "transition-colors duration-150 hover:text-ink",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Separator className="my-10" />

        {/* Ownership. Kept to a single restrained line — the credit reads as
            authorship, which is what earns it weight, rather than as a badge. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-ink-muted">
            {t.footer.designedBy}{" "}
            <span className="font-medium text-ink">{SITE.author}</span>
            <span className="text-ink-faint"> · {SITE.authorRole}</span>
          </p>
          <p className="text-caption text-ink-faint">
            © {year} {SITE.author}. {t.footer.rightsReserved}
          </p>
        </div>
      </Container>
    </footer>
  );
}
