/**
 * @fileoverview Renders a structured error object and its hint as formatted
 * terminal output. Handles colorization, path shortening, and layout.
 * Writes directly to stdout so output is never accidentally suppressed
 * by the stderr silencing in index.js.
 */

/**
 * ANSI escape codes used for terminal colorization.
 * These are raw codes rather than a dependency like chalk to keep
 * hint-errors fully zero-dependency.
 *
 * @type {Object.<string, string>}
 */
const c = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

/**
 * Shortens an absolute file path to be relative to the current working
 * directory. Comparison is done case-insensitively to handle Windows drive
 * letter casing differences (e.g. process.cwd() returns "F:\" but the stack
 * trace path may start with "f:\"). The returned path preserves the
 * original casing of the input.
 *
 * @param {string|null} filePath - The absolute file path extracted from the stack trace.
 * @returns {string} The path relative to cwd, or the original path if it falls
 *   outside cwd, or "unknown location" if no path was provided.
 */
function shortenPath(filePath) {
  if (!filePath) return "unknown location";
  const cwd = process.cwd().toLowerCase();
  const normalizedFile = filePath.toLowerCase();
  return normalizedFile.startsWith(cwd)
    ? filePath.slice(cwd.length + 1)
    : filePath;
}

/**
 * Prepends a prefix string to every line of a multiline text block.
 * Used to indent the hint body so it aligns cleanly under the 💡 icon.
 *
 * @param {string} text - The multiline string to indent.
 * @param {string} prefix - The string to prepend to each line (e.g. spaces).
 * @returns {string} The indented multiline string.
 */
function indentLines(text, prefix) {
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

/**
 * Formats a parsed error object and a hint string into a structured,
 * colorized terminal block and writes it to stdout.
 *
 * Output is structured into three sections:
 *  - Error type and message (red)
 *  - File location and line number (yellow)
 *  - Developer hint (cyan)
 *
 * The block is wrapped in dim divider lines sized to the terminal width,
 * falling back to 50 characters if the terminal width is unavailable.
 *
 * @param {Object} parsed - The structured error object produced by parseError().
 * @param {string} parsed.type - The error type name (e.g. "TypeError").
 * @param {string} parsed.message - The human-readable error message.
 * @param {string|null} parsed.file - The absolute path to the file where the error occurred.
 * @param {string|null} parsed.line - The line number where the error occurred.
 * @param {string} hint - The developer hint string produced by getHint().
 * @returns {void}
 */
function formatError(parsed, hint) {
  const width = process.stdout.columns || 50;
  const divider = c.dim + "─".repeat(width) + c.reset;

  const typeLine = `\n  ${c.red}${c.bold} ${parsed.type}${c.reset}`;
  const messageLine = `\n  ${c.dim}${parsed.message}${c.reset}`;

  const file = shortenPath(parsed.file);
  const locationLine = parsed.file
    ? `\n\n  ${c.yellow}📍  ${file}${c.reset}${c.dim}  ·  line ${parsed.line}${c.reset}`
    : `\n\n  ${c.yellow}📍  unknown location${c.reset}`;

  const hintBody = indentLines(hint, "     ");
  const hintLine = `\n\n  ${c.cyan}${c.bold} 💡${c.reset}\n${c.cyan}${hintBody}${c.reset}`;

  const output = [
    divider,
    typeLine,
    messageLine,
    locationLine,
    hintLine,
    "\n" + divider,
  ].join("");

  process.stdout.write(output + "\n");
}

module.exports = { formatError };