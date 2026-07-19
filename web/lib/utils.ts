import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Our custom font-size steps, declared so tailwind-merge can tell them apart
 * from text *colours*.
 *
 * Both share the `text-` prefix. tailwind-merge only knows Tailwind's stock
 * scale, so given `text-body-sm` (a size) and `text-on-accent` (a colour) it
 * assumed both belonged to the same group and silently dropped the earlier
 * one — which meant every button carrying both a size and a colour rendered
 * with the wrong text colour and inherited `--ink` instead.
 *
 * Keep this list in sync with the `--text-*` entries in `app/globals.css`.
 */
const FONT_SIZES = [
  "display-2xl",
  "display-xl",
  "display-lg",
  "h1",
  "h2",
  "h3",
  "h4",
  "body-lg",
  "body",
  "body-sm",
  "caption",
  "micro",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
    },
  },
});

/**
 * Merge Tailwind classes with correct conflict resolution.
 *
 * `clsx` handles conditionals; `twMerge` ensures a later class wins over an
 * earlier one in the same property group (so `cn("p-2", "p-4")` → `p-4`
 * rather than emitting both and leaving the winner to source order).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
