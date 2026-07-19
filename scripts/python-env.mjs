/**
 * Locates the analysis engine's interpreter.
 *
 * Shared by the run, test, and setup scripts so the venv layout is described
 * in exactly one place — `Scripts/` on Windows, `bin/` elsewhere.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const API_DIR = join(ROOT, "api");

/**
 * Where the launcher records the address the engine actually bound.
 *
 * Read by the web app's BFF so the two sides agree on a single instance
 * instead of guessing by port. Local runtime state, not source — gitignored.
 */
export const ENGINE_HANDSHAKE_PATH = join(ROOT, ".engine.json");

/** Path to the venv interpreter, or null when the venv does not exist yet. */
export function findVenvPython() {
  const candidates = [
    join(API_DIR, ".venv", "Scripts", "python.exe"),
    join(API_DIR, ".venv", "bin", "python3"),
    join(API_DIR, ".venv", "bin", "python"),
  ];
  return candidates.find(existsSync) ?? null;
}

export const MISSING_VENV_MESSAGE =
  "\n  The analysis engine's virtual environment is missing.\n" +
  "  Create it once with:\n\n    npm run setup:api\n";
