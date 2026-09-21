/**
 * @fileoverview Entry point for hint-errors. Registers listeners on Node's
 * global process error events so the package activates automatically the
 * moment it is required — no further setup needed from the user.
 *
 * Usage:
 *   require('hint-errors'); // first line of your entry file, that's it
 *
 * How it works:
 *   Node.js exposes two global events for unhandled errors:
 *   - 'uncaughtException' fires when a thrown error bubbles all the way up
 *     without being caught by any try/catch block.
 *   - 'unhandledRejection' fires when a Promise is rejected with no .catch()
 *     or try/catch around its await.
 *
 *   hint-errors prepends its own listeners, runs each error through its
 *   parse → hint → format pipeline, and lets Node invoke every other
 *   listener normally. The formatted block is written before those listeners
 *   run, so an existing handler may still safely choose to exit.
 *
 * Production safety:
 *   hint-errors is a local development aid. When NODE_ENV=production it
 *   disables itself by default and registers no listeners at all, so it
 *   never affects how a production process handles uncaught errors. This
 *   guards against the package being left in a production entry file by
 *   accident. Set HINT_ERRORS_FORCE=1 to opt back in if you genuinely want
 *   it active in production.
 *
 * Compatibility with error monitoring tools (Sentry, Winston, APM agents):
 *   Node calls every registered 'uncaughtException'/'unhandledRejection'
 *   listener, in registration order, whenever the event fires — it does not
 *   automatically pick one. That means require order normally determines
 *   which tool's handler runs first, which is fragile: if an APM tool that
 *   calls process.exit() itself happens to run before hint-errors, our
 *   formatted hint may never get printed. To avoid that race, hint-errors
 *   prepends its own listener at load time. It neither removes nor manually
 *   calls other listeners: Node dispatches the original event to them once,
 *   preserving their registration, once-only behavior, and original value.
 *   The diagnostic uses a synchronous stdout write on this fatal path so a
 *   subsequent listener that calls process.exit() cannot truncate the hint.
 */

const { parseError } = require("./src/parser.js");
const { getHint, addHint } = require("./src/hints.js");
const { formatErrorSync, writeNotice } = require("./src/formatter.js");

/**
 * Runs a raw error through the full hint-errors pipeline:
 * parse the error into structured data, look up a matching hint,
 * then render the formatted output to the terminal.
 *
 * @param {Error} err - The error to process. Expected to be a proper Error
 *   instance, but parseError() handles non-Error values defensively.
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
  // Disabled by default in production: register no listeners at all, so
  // Node's own default uncaught-exception behavior (print to stderr, exit 1)
  // is completely unaffected. The notice follows the same color policy as
  // formatted output and stays on stdout for consistent package output.
  writeNotice(
    "[hint-errors] NODE_ENV=production detected — hint-errors is disabled by default in production.\n" +
      "Set HINT_ERRORS_FORCE=1 (or HINT_ERRORS_FORCE=true) to enable it anyway.",
  );
} else {
  /**
   * Handles synchronous uncaught exceptions. The exit code is set after the
   * formatted block has been synchronously written; other process listeners
   * then receive the event normally and exactly once.
   */
  process.prependListener("uncaughtException", (err) => {
    handle(err);
    process.exitCode = 1;
  });

  /**
   * Handles unhandled Promise rejections. Non-Error reasons are normalized
   * only for formatting; Node passes the original reason unchanged to every
   * other registered listener.
   */
  process.prependListener("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle(err);
    process.exitCode = 1;
  });
}

/**
 * Registering a custom hint always works, regardless of whether hint-errors
 * is active in this environment (see the production guard above) — addHint
 * only augments the shared hint list that getHint() reads from, it doesn't
 * depend on the uncaughtException/unhandledRejection listeners being
 * registered.
 */
module.exports = { addHint };
