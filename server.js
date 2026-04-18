/**
 * @fileoverview Server mode entry point for hint-errors.
 * Identical to index.js but does not call process.exit(1) after handling
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
 */

const { parseError } = require("./src/parser.js");
const { getHint } = require("./src/hints.js");
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

// Warn the developer that server mode is active so silent error survival
// doesn't go unnoticed during development.
console.warn(
  "\x1b[33m[hint-errors] server mode active — " +
    "process will stay alive after uncaught errors\x1b[0m",
);

/**
 * Handles synchronous uncaught exceptions in server mode.
 * Shows the hint and keeps the process alive — the crashed request
 * is already dead but the server continues handling new ones.
 */
process.on("uncaughtException", (err) => {
  handle(err);
});

/**
 * Handles unhandled Promise rejections in server mode.
 * Non-Error rejection reasons are normalized into a real Error object
 * before being passed through the pipeline.
 */
process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  handle(err);
});
