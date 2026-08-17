/**
 * @fileoverview Extracts structured, normalized data from a raw Node.js Error
 * object. Filters noise from the stack trace so only frames from user code
 * are surfaced — Node internals and node_modules are excluded.
 */

const { fileURLToPath } = require("node:url");

/**
 * Extracts a file path and line number from a single V8 stack frame string.
 *
 * V8 produces frames in two shapes depending on whether the call site has a
 * named enclosing function:
 *  - "at Object.<anonymous> (/path/to/file.js:12:5)" — the common case
 *  - "at /path/to/file.js:12:5" — top-level code with no function wrapper,
 *    which is common in native ESM and top-level await contexts
 *
 * Native ESM frames may also report the location as a "file://" URL instead
 * of a plain filesystem path (e.g. "file:///app/src/x.mjs:12:5", or on
 * Windows "file:///C:/app/src/x.mjs:12:5"). Those are normalized back to a
 * regular filesystem path via node:url's fileURLToPath so downstream code
 * (path shortening, display) doesn't need to special-case URLs.
 *
 * @param {string} frame - A single line from an Error's stack property.
 * @returns {{file: string|null, line: string|null}} The extracted location,
 *   or nulls if the frame doesn't match either known shape.
 */
function extractLocation(frame) {
  // Shape 1: "... (file:line:col)" — parenthesized location.
  let match = frame.match(/\(([^()]+):(\d+):(\d+)\)\s*$/);

  // Shape 2: "at file:line:col" — no wrapping parentheses. Only attempted
  // when shape 1 doesn't match, so we don't misparse the common case.
  if (!match) {
    match = frame.match(/at\s+(?:async\s+)?(.+):(\d+):(\d+)\s*$/);
  }

  if (!match) return { file: null, line: null };

  let file = match[1];
  const line = match[2];

  if (file.startsWith("file://")) {
    try {
      file = fileURLToPath(file);
    } catch {
      // Malformed URL — fall back to the raw string rather than losing
      // the location entirely.
    }
  }

  return { file, line };
}

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
  const { file, line } = extractLocation(firstFrame);

  return {
    type,
    message,
    file,
    line,
    raw: err,
  };
}

module.exports = { parseError };
