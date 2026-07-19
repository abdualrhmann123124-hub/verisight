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
import { createServer } from "node:net";
import { rmSync, writeFileSync } from "node:fs";

import {
  API_DIR,
  ENGINE_HANDSHAKE_PATH,
  MISSING_VENV_MESSAGE,
  findVenvPython,
} from "./python-env.mjs";

const python = findVenvPython();
if (!python) {
  console.error(MISSING_VENV_MESSAGE);
  process.exit(1);
}

const HOST = process.env.API_HOST ?? "127.0.0.1";

/**
 * Reports whether a port can actually be bound.
 *
 * Checked here rather than left to uvicorn because uvicorn prints
 * "Application startup complete" *before* it binds, then dies with a bare
 * WinError 10048 — so a port conflict reads like a successful start followed
 * by an unexplained crash. Windows can also leave a socket in LISTENING with
 * no owning process after an abrupt exit; that orphan survives until reboot
 * and cannot be killed, which is exactly the case this guards against.
 */
function canBind(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, HOST);
  });
}

const requested = Number(process.env.API_PORT ?? 8000);
let port = requested;

if (!(await canBind(port))) {
  const fallback = [];
  for (let candidate = requested + 1; candidate <= requested + 10; candidate += 1) {
    fallback.push(candidate);
  }

  let found = null;
  for (const candidate of fallback) {
    if (await canBind(candidate)) {
      found = candidate;
      break;
    }
  }

  if (found === null) {
    console.error(
      `\n  Ports ${requested}-${requested + 10} are all in use.\n` +
        `  Free one, or choose another with: API_PORT=9000 npm run api\n`,
    );
    process.exit(1);
  }

  port = found;
  console.warn(
    `\n  Port ${requested} is in use, starting on ${port} instead.\n` +
      `  Point the web app at it with:\n\n` +
      `    ANALYSIS_ENGINE_URL=http://${HOST}:${port} npm run dev\n`,
  );
}

const args = [
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  HOST,
  "--port",
  String(port),
];

// `--reload` is opt-in: on Windows its file watcher has been observed to
// report a reload without actually swapping the module, which is worse than
// no reloading at all because the stale code looks fresh.
if (process.argv.includes("--reload")) args.push("--reload");

const child = spawn(python, args, {
  cwd: API_DIR,
  stdio: "inherit",
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});

/**
 * Publish the address this instance actually bound.
 *
 * The web app reads this rather than probing a port range. Probing looks
 * equivalent and is not: a stale engine left listening on the default port —
 * which happens on Windows when a process is orphaned and survives every
 * attempt to kill it — will answer a health check happily, and the web app
 * would bind to *that* instead of the instance just started, silently serving
 * results from old code. Writing down the real address removes the guess.
 */
writeFileSync(
  ENGINE_HANDSHAKE_PATH,
  `${JSON.stringify({ url: `http://${HOST}:${port}`, pid: child.pid, startedAt: new Date().toISOString() }, null, 2)}\n`,
);

const clearHandshake = () => {
  try {
    rmSync(ENGINE_HANDSHAKE_PATH, { force: true });
  } catch {
    // Best effort — a stale file is handled by the reader's health check.
  }
};

child.on("exit", (code) => {
  clearHandshake();
  process.exit(code ?? 0);
});
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("exit", clearHandshake);
