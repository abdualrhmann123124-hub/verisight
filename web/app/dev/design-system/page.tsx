import { notFound } from "next/navigation";

import { DesignSystemGallery } from "./gallery";

/**
 * Design-system gallery — development only.
 *
 * Every primitive, in every state, in one place. Its job is to make
 * regressions visible: a spacing or contrast change that is easy to miss on
 * a product page is obvious when the whole system sits side by side.
 *
 * `notFound()` in production keeps it out of the shipped app, and the route
 * is marked `noindex` so it never reaches a search result either.
 */
export const metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignSystemGallery />;
}
