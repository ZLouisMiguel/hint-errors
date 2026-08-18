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
 *   hint-errors intercepts both event types, runs them through its own
 *   parse → hint → format pipeline, and then re-invokes any listeners that
 *   were already registered before hint-errors loaded (see "Compatibility
 *   with error monitoring tools" below) — so require order doesn't affect
 *   which tool's output you see first.
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
 *   snapshots any listeners already registered when it loads, always runs
 *   its own handler first regardless of require order, and then re-invokes
 *   the snapshotted listeners with the original error/reason. No listener
 *   is dropped — this only guarantees ordering, not exclusivity.
 */

const { parseError } = require("./src/parser.js");
const { getHint, addHint } = require("./src/hints.js");
const { formatError } = require("./src/formatter.js");

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
  formatError(parsed, hint);
}

const isProduction = process.env.NODE_ENV === "production";
const forceEnabled =
  process.env.HINT_ERRORS_FORCE === "1" ||
  process.env.HINT_ERRORS_FORCE === "true";

if (isProduction && !forceEnabled) {
  // Disabled by default in production: register no listeners at all, so
  // Node's own default uncaught-exception behavior (print to stderr, exit 1)
  // is completely unaffected. This warning goes to stderr via console.warn
  // so it doesn't get mixed into stdout-only log pipelines.
  console.warn(
    "\x1b[33m[hint-errors] NODE_ENV=production detected — hint-errors is disabled by default in production.\n" +
      "Set HINT_ERRORS_FORCE=1 (or HINT_ERRORS_FORCE=true) to enable it anyway.\x1b[0m",
  );
} else {
  // Snapshot any listeners registered before hint-errors loaded so they can
  // be re-invoked after our own handler runs — see "Compatibility with
  // error monitoring tools" above.
  const priorUncaughtListeners = process.listeners("uncaughtException").slice();
  const priorRejectionListeners = process
    .listeners("unhandledRejection")
    .slice();

  process.removeAllListeners("uncaughtException");
  process.removeAllListeners("unhandledRejection");

  /**
   * Handles synchronous uncaught exceptions — errors that were thrown
   * somewhere in the codebase but never caught by a try/catch block.
   * The exit code is set to 1 after formatting and the process is left to
   * drain naturally instead of calling process.exit(1): calling process.exit()
   * can terminate the process before async stdout writes (e.g. when piped)
   * have flushed, silently dropping the hint. Node.js docs recommend setting
   * process.exitCode and letting the event loop drain for this reason.
   * Any listeners that were registered before hint-errors run afterward.
   */
  process.on("uncaughtException", (err) => {
    handle(err);
    process.exitCode = 1;
    for (const listener of priorUncaughtListeners) listener(err);
  });

  /**
   * Handles unhandled Promise rejections — Promises that were rejected
   * with no .catch() handler or try/catch around their await call.
   * The rejection reason can technically be any value, so non-Error reasons
   * are normalized into a real Error object before being passed to handle().
   * Same exit strategy as uncaughtException: set the exit code and let the
   * event loop drain so stdout is not truncated. Any listeners that were
   * registered before hint-errors run afterward, with the original reason.
   */
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle(err);
    process.exitCode = 1;
    for (const listener of priorRejectionListeners) listener(reason);
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
