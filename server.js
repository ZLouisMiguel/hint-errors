/**
 * @fileoverview Server mode entry point for hint-errors.
 * Identical to index.js but does not set process.exitCode after handling
 * an error — the process stays alive so long-running servers continue
 * serving requests after an uncaught error in a single request handler.
 *
 * Usage:
 *   require('hint-errors/server'); // first line of your server entry file
 *
 * Only use this entry point for long-running processes like HTTP servers.
 * For scripts and short-lived processes, use require('hint-errors') instead
 * so the process exits correctly on failure.
 *
 * Warning:
 *   Node.js docs note that after an uncaughtException the process may be in
 *   an undefined state. Keeping the process alive is a deliberate trade-off
 *   — the developer is responsible for ensuring their server can safely
 *   continue after an error.
 *
 * Production safety:
 *   Same default-off behavior as index.js — when NODE_ENV=production,
 *   server.js registers no listeners unless HINT_ERRORS_FORCE=1 is set.
 *   See index.js for the full rationale.
 *
 * Compatibility with error monitoring tools (Sentry, Winston, APM agents):
 *   Same listener-chaining behavior as index.js — listeners registered
 *   before this module loads are preserved and re-invoked after hint-errors'
 *   own handler runs. See index.js for the full rationale.
 */

const { parseError } = require("./src/parser.js");
const { getHint, addHint } = require("./src/hints.js");
const { formatError } = require("./src/formatter.js");

/**
 * Runs the full hint-errors pipeline on a raw error without exiting.
 * Parses the error into structured data, looks up a matching hint,
 * and renders the formatted output to the terminal.
 *
 * @param {Error} err - The error to process.
 * @returns {void}
 */
function handle(err) {
  const parsed = parseError(err);
  const hint = getHint(parsed);
  formatError(parsed, hint);
}

const isProduction = process.env.NODE_ENV === "production";
const forceEnabled =
  process.env.HINT_ERRORS_FORCE === "1" ||
  process.env.HINT_ERRORS_FORCE === "true";

if (isProduction && !forceEnabled) {
  console.warn(
    "\x1b[33m[hint-errors] NODE_ENV=production detected — hint-errors server mode is disabled by default in production.\n" +
      "Set HINT_ERRORS_FORCE=1 (or HINT_ERRORS_FORCE=true) to enable it anyway.\x1b[0m",
  );
} else {
  // Warn the developer that server mode is active so silent error survival
  // doesn't go unnoticed during development.
  console.warn(
    "\x1b[33m[hint-errors] server mode active — " +
      "process will stay alive after uncaught errors\x1b[0m",
  );

  const priorUncaughtListeners = process.listeners("uncaughtException").slice();
  const priorRejectionListeners = process
    .listeners("unhandledRejection")
    .slice();

  process.removeAllListeners("uncaughtException");
  process.removeAllListeners("unhandledRejection");

  /**
   * Handles synchronous uncaught exceptions in server mode.
   * Shows the hint and keeps the process alive — the crashed request
   * is already dead but the server continues handling new ones. Any
   * listeners registered before hint-errors run afterward.
   */
  process.on("uncaughtException", (err) => {
    handle(err);
    for (const listener of priorUncaughtListeners) listener(err);
  });

  /**
   * Handles unhandled Promise rejections in server mode.
   * Non-Error rejection reasons are normalized into a real Error object
   * before being passed through the pipeline. Any listeners registered
   * before hint-errors run afterward, with the original reason.
   */
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle(err);
    for (const listener of priorRejectionListeners) listener(reason);
  });
}

/**
 * Registering a custom hint always works, regardless of whether hint-errors
 * server mode is active in this environment (see the production guard
 * above) — addHint only augments the shared hint list that getHint() reads
 * from.
 */
module.exports = { addHint };
