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
 *   Registering a handler for either event fully replaces Node's default
 *   behavior (printing the raw stack to stderr). hint-errors uses this to
 *   intercept both event types and run them through its own
 *   parse → hint → format pipeline before exiting.
 */

const { parseError } = require("./src/parser.js");
const { getHint } = require("./src/hints.js");
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

/**
 * Handles synchronous uncaught exceptions — errors that were thrown
 * somewhere in the codebase but never caught by a try/catch block.
 * The exit code is set to 1 after formatting and the process is left to
 * drain naturally instead of calling process.exit(1): calling process.exit()
 * can terminate the process before async stdout writes (e.g. when piped)
 * have flushed, silently dropping the hint. Node.js docs recommend setting
 * process.exitCode and letting the event loop drain for this reason.
 */
process.on("uncaughtException", (err) => {
  handle(err);
  process.exitCode = 1;
});

/**
 * Handles unhandled Promise rejections — Promises that were rejected
 * with no .catch() handler or try/catch around their await call.
 * The rejection reason can technically be any value, so non-Error reasons
 * are normalized into a real Error object before being passed to handle().
 * Same exit strategy as uncaughtException: set the exit code and let the
 * event loop drain so stdout is not truncated.
 */
process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  handle(err);
  process.exitCode = 1;
});