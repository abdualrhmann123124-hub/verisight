#!/usr/bin/env node
/**
 * Launches the analysis engine from its virtual environment.
 *
 * A plain npm script cannot do this portably: npm shells out to cmd.exe on
 * Windows, which reads the forward slashes in `api/.venv/Scripts/python.exe`
 * as command flags, while the interpreter itself lives under `Scripts/` on
 * Windows and `bin/` everywhere else. Resolving both here keeps a single
 * `npm run api` working on any machine.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apiDir = join(root, "api");

const candidates = [
  join(apiDir, ".venv", "Scripts", "python.exe"), // Windows
  join(apiDir, ".venv", "bin", "python3"), // macOS / Linux
  join(apiDir, ".venv", "bin", "python"),
];

const python = candidates.find(existsSync);

if (!python) {
  console.error(
    "\n  The analysis engine's virtual environment is missing.\n" +
      "  Create it once with:\n\n    npm run setup:api\n",
  );
  process.exit(1);
}

const args = [
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  process.env.API_HOST ?? "127.0.0.1",
  "--port",
  process.env.API_PORT ?? "8000",
];

// `--reload` is opt-in: on Windows its file watcher has been observed to
// report a reload without actually swapping the module, which is worse than
// no reloading at all because the stale code looks fresh.
if (process.argv.includes("--reload")) args.push("--reload");

const child = spawn(python, args, {
  cwd: apiDir,
  stdio: "inherit",
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
