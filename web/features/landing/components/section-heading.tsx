import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Shared section header.
 *
 * Exists so every section on the page shares one vertical rhythm and one type
 * hierarchy. Hand-writing this markup per section is exactly how spacing
 * starts drifting by 4px at a time until the page stops feeling composed.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-caption font-medium tracking-widest text-accent uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-2xl font-display text-h1 text-ink sm:text-display-lg">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-body-lg text-ink-muted">{description}</p>
      )}
    </Reveal>
  );
}
