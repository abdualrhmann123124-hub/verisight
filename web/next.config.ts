import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Pin the workspace root to this directory.
     *
     * The repository root carries its own `package.json` (thin scripts that
     * forward to this app), so npm creates a lockfile there too. Turbopack
     * infers its root from the nearest lockfile and, seeing two, picks the
     * outer one and warns. Setting this explicitly removes the ambiguity —
     * and keeps it removed once `api/` is added alongside `web/`.
     */
    root: __dirname,
  },
};

export default nextConfig;
