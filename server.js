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
 *   Same additive listener behavior as index.js — other handlers stay
 *   registered and Node invokes them normally. See index.js for details.
 */

const { parseError } = require("./src/parser.js");
const { getHint, addHint } = require("./src/hints.js");
const { formatErrorSync, writeNotice } = require("./src/formatter.js");

/**
 * Runs the full hint-errors pipeline on a raw error.
 * Parses the error into structured data, looks up a matching hint,
 * and renders the formatted output to the terminal.
 *
 * @param {Error} err - The error to process.
 * @returns {void}
 */
function handle(err) {
  const parsed = parseError(err);
  const hint = getHint(parsed);
  formatErrorSync(parsed, hint);
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
  let exitScheduled = false;

  function scheduleExit() {
    process.exitCode = 1;
    if (exitScheduled) return;
    exitScheduled = true;
    // Let EventEmitter finish dispatching the event and allow listeners' next
    // ticks/microtasks to run before the fatal server-mode exit.
    setImmediate(() => process.exit(1));
  }

  /**
   * Handles synchronous uncaught exceptions in server mode. The hint is
   * synchronously written before other listeners run, then the process exits
   * on the next event-loop turn unless another listener terminates it first.
   */
  process.prependListener("uncaughtException", (err) => {
    handle(err);
    scheduleExit();
  });

  /**
   * Handles unhandled Promise rejections. Non-Error reasons are normalized
   * only for formatting; other listeners receive the original reason as usual.
   */
  process.prependListener("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle(err);
    scheduleExit();
  });
}

/**
 * Registering a custom hint always works, regardless of whether hint-errors
 * the server entry is active in this environment (see the production guard
 * above) — addHint only augments the shared hint list that getHint() reads
 * from.
 */
module.exports = { addHint };
