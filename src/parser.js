/**
 * @fileoverview Extracts structured, normalized data from a raw Node.js Error
 * object. Filters noise from the stack trace so only frames from user code
 * are surfaced — Node internals and node_modules are excluded.
 */

/**
 * @typedef {Object} ParsedError
 * @property {string} type - The error type name (e.g. "TypeError", "ReferenceError").
 * @property {string} message - The trimmed error message.
 * @property {string|null} file - Absolute path to the file where the error originated,
 *   or null if no user-code frame could be found in the stack.
 * @property {string|null} line - Line number string where the error originated,
 *   or null if no user-code frame could be found in the stack.
 * @property {*} raw - The original value passed in, preserved for downstream use.
 */

/**
 * Parses a raw Error object (or any thrown value) into a clean, structured
 * object that the rest of the pipeline can work with.
 *
 * If the received value is not an instance of Error — for example when code
 * does `throw "oops"` or `Promise.reject(42)` — it is normalized into a
 * minimal ParsedError with the stringified value as the message.
 *
 * Stack trace filtering removes lines that:
 *  - Don't start with "    at " (not a real frame)
 *  - Come from Node internals (node:internal/...)
 *  - Come from third-party packages (node_modules)
 *  - Are anonymous frames with no useful location
 *
 * @param {*} err - The thrown value to parse. Expected to be an Error instance
 *   but handles any type defensively.
 * @returns {ParsedError} A structured object containing the normalized error data.
 *
 * @example
 * const { parseError } = require('./parser');
 * const parsed = parseError(new TypeError("Cannot read properties of undefined"));
 * // → { type: 'TypeError', message: 'Cannot read properties of undefined', file: '...', line: '12', raw: [Error] }
 */
function parseError(err) {
  if (!(err instanceof Error)) {
    return {
      type: "Error",
      message: String(err),
      file: null,
      line: null,
      raw: err,
    };
  }

  const type = err.name || "Error";
  const message = err.message?.trim() || "An unknown error occurred";
  const stackLines = (err.stack || "").split("\n");

  const relevantFrames = stackLines.filter((line) => {
    return (
      line.includes("    at ") &&
      !line.includes("node:internal") &&
      !line.includes("node_modules") &&
      !line.includes("(<anonymous>)")
    );
  });

  const firstFrame = relevantFrames[0] || "";

  // Stack frame format: "    at Object.<anonymous> (/path/to/file.js:12:5)"
  // Capture groups: 1 = file path, 2 = line number, 3 = column number
  const match = firstFrame.match(/\((.+):(\d+):(\d+)\)/);

  const file = match ? match[1] : null;
  const line = match ? match[2] : null;

  return {
    type,
    message,
    file,
    line,
    raw: err,
  };
}

module.exports = { parseError };