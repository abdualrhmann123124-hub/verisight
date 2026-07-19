import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const FOOTER_NAV = [
  {
    heading: "Product",
    links: [
      { href: "#analyze", label: "Analyze media" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#technology", label: "Technology" },
      { href: "#example", label: "Example report" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/about", label: "About" },
      { href: "#faq", label: "FAQ" },
      { href: "/about#limitations", label: "Limitations" },
      { href: "/about#privacy", label: "Privacy" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

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
            <p className="text-caption text-ink-faint">
              VeriSight reports confidence estimates, not verdicts. Results should be
              interpreted alongside context and other evidence.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-12 gap-y-8 sm:gap-x-20"
          >
            {FOOTER_NAV.map((group) => (
              <div key={group.heading} className="flex flex-col gap-3">
                <h2 className="font-display text-caption font-semibold tracking-wide text-ink uppercase">
                  {group.heading}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
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
            Designed &amp; developed by{" "}
            <span className="font-medium text-ink">{SITE.author}</span>
            <span className="text-ink-faint"> · {SITE.authorRole}</span>
          </p>
          <p className="text-caption text-ink-faint">
            © {year} {SITE.author}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
