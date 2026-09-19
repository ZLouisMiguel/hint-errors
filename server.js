/**
 * @fileoverview Safe server entry point for hint-errors.
 * Formats an uncaught error, flushes the output, and then terminates with a
 * non-zero exit code. It never attempts to keep a process alive after an
 * uncaught exception, because Node.js may be in an undefined state.
 *
 * Usage:
 *   require('hint-errors/server'); // first line of your server entry file
 *
 * This entry point is retained for compatibility with earlier releases. It
 * now has safe termination semantics for long-running processes, allowing an
 * external supervisor to restart the process instead of continuing inside a
 * potentially corrupted state.
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
const { formatError, writeNotice } = require("./src/formatter.js");

/**
 * Runs the full hint-errors pipeline on a raw error.
 * Parses the error into structured data, looks up a matching hint,
 * and renders the formatted output to the terminal.
 *
 * @param {Error} err - The error to process.
 * @param {Function} [onComplete] - Called after stdout accepts the output.
 * @returns {void}
 */
function handle(err, onComplete) {
  const parsed = parseError(err);
  const hint = getHint(parsed);
  formatError(parsed, hint, onComplete);
}

const isProduction = process.env.NODE_ENV === "production";
const forceEnabled =
  process.env.HINT_ERRORS_FORCE === "1" ||
  process.env.HINT_ERRORS_FORCE === "true";

if (isProduction && !forceEnabled) {
  writeNotice(
    "[hint-errors] NODE_ENV=production detected — hint-errors server entry is disabled by default in production.\n" +
      "Set HINT_ERRORS_FORCE=1 (or HINT_ERRORS_FORCE=true) to enable it anyway.",
  );
} else {
  const priorUncaughtListeners = process.listeners("uncaughtException").slice();
  const priorRejectionListeners = process
    .listeners("unhandledRejection")
    .slice();

  process.removeAllListeners("uncaughtException");
  process.removeAllListeners("unhandledRejection");

  /**
   * Handles synchronous uncaught exceptions in the server entry.
   * Shows the hint, waits for stdout to accept it, and exits. Continuing
   * after an uncaught exception is unsafe because process state may be invalid.
   */
  process.on("uncaughtException", (err) => {
    handle(err, () => {
      for (const listener of priorUncaughtListeners) listener(err);
      process.exitCode = 1;
      process.exit(1);
    });
  });

  /**
   * Handles unhandled Promise rejections in the server entry.
   * Non-Error rejection reasons are normalized into a real Error object
   * before being passed through the pipeline. Any listeners registered
   * before hint-errors run afterward, with the original reason.
   */
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle(err, () => {
      for (const listener of priorRejectionListeners) listener(reason);
      process.exitCode = 1;
      process.exit(1);
    });
  });
}

/**
 * Registering a custom hint always works, regardless of whether hint-errors
 * the server entry is active in this environment (see the production guard
 * above) — addHint only augments the shared hint list that getHint() reads
 * from.
 */
module.exports = { addHint };
