#!/usr/bin/env node
/**
 * One-time setup for the analysis engine: creates the virtual environment
 * and installs its dependencies.
 */

import { spawnSync } from "node:child_process";

import { API_DIR, findVenvPython } from "./python-env.mjs";

function run(command, args, label) {
  process.stdout.write(`\n  ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: API_DIR,
    stdio: "inherit",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    shell: false,
  });
  if (result.error || result.status !== 0) {
    console.error(`\n  Failed: ${label}\n`);
    process.exit(result.status ?? 1);
  }
}

// `python3` first, since on macOS/Linux a bare `python` may be Python 2 or
// missing entirely; on Windows `python` is the usual name.
const bootstrap = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];

let created = findVenvPython();
if (!created) {
  let ok = false;
  for (const candidate of bootstrap) {
    const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (probe.status === 0) {
      run(candidate, ["-m", "venv", ".venv"], "Creating virtual environment…");
      ok = true;
      break;
    }
  }
  if (!ok) {
    console.error(
      "\n  Python 3.12 or newer is required but was not found on PATH.\n" +
        "  Install it from https://www.python.org/downloads/ and try again.\n",
    );
    process.exit(1);
  }
  created = findVenvPython();
}

if (!created) {
  console.error("\n  The virtual environment was created but no interpreter was found.\n");
  process.exit(1);
}

run(created, ["-m", "pip", "install", "--upgrade", "pip", "--quiet"], "Upgrading pip…");
run(created, ["-m", "pip", "install", "-r", "requirements.txt"], "Installing dependencies…");
run(created, ["-m", "pip", "install", "pytest", "--quiet"], "Installing pytest…");

process.stdout.write("\n  Analysis engine ready. Start it with: npm run api\n\n");
