#!/usr/bin/env node
/** Runs the analysis engine's test suite from its virtual environment. */

import { spawn } from "node:child_process";

import { API_DIR, MISSING_VENV_MESSAGE, findVenvPython } from "./python-env.mjs";

const python = findVenvPython();
if (!python) {
  console.error(MISSING_VENV_MESSAGE);
  process.exit(1);
}

const child = spawn(python, ["-m", "pytest", "tests", "-q"], {
  cwd: API_DIR,
  stdio: "inherit",
  // Test names and assertion output contain non-ASCII characters; the Windows
  // console default (cp1256 here) raises UnicodeEncodeError without this.
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});

child.on("exit", (code) => process.exit(code ?? 0));
