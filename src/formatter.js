/**
 * @fileoverview Renders a structured error object and its hint as formatted
 * terminal output. Handles colorization, path shortening, and layout.
 * Writes directly to stdout so output is never accidentally suppressed
 * by the stderr silencing in index.js.
 */

/**
 * Determines whether ANSI color output should be used, following the same
 * conventions most CLI tools respect:
 *  - NO_COLOR (https://no-color.org) always disables color when set to any
 *    non-empty value, and takes precedence over everything else.
 *  - FORCE_COLOR forces color on even when stdout isn't a TTY (useful in CI
 *    logs or when output is piped through a color-aware pager).
 *  - TERM=dumb disables color, matching common terminal-capability checks.
 *  - Otherwise, color is enabled only when stdout is an interactive TTY —
 *    piping into a file or log aggregator (CloudWatch, Datadog, etc.)
 *    should never receive raw escape codes.
 *
 * Checked at call time (not module load time) so it reflects the current
 * environment even if env vars or stream state change between calls.
 *
 * @returns {boolean} Whether ANSI color codes should be emitted.
 */
function supportsColor() {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  if (process.env.TERM === "dumb") return false;
  return Boolean(process.stdout.isTTY);
}

/**
 * Returns the ANSI escape code set to use for this render. When color
 * support is disabled, every code is an empty string so the rest of
 * formatError can unconditionally wrap values without branching.
 *
 * @returns {Object.<string, string>} Color code map, or empty strings.
 */
function getColors() {
  if (!supportsColor()) {
    return { red: "", yellow: "", cyan: "", dim: "", bold: "", reset: "" };
  }
  return {
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
    reset: "\x1b[0m",
  };
}

/**
 * Shortens an absolute file path to be relative to the current working
 * directory. A path is only shortened when it actually lives inside cwd —
 * matching is done on a path boundary so a sibling directory that merely
 * shares a prefix with cwd (e.g. cwd "app" vs "apple/") is never truncated.
 * Comparison is done case-insensitively to handle Windows drive letter casing
 * differences (e.g. process.cwd() returns "F:\" but the stack trace path may
 * start with "f:\"). The returned path preserves the original casing.
 *
 * @param {string|null} filePath - The absolute file path extracted from the stack trace.
 * @returns {string} The path relative to cwd, or the original path if it falls
 *   outside cwd, or "unknown location" if no path was provided.
 */
function shortenPath(filePath) {
  if (!filePath) return "unknown location";
  const cwd = process.cwd();
  const cwdLower = cwd.toLowerCase();
  const fileLower = filePath.toLowerCase();

  if (!fileLower.startsWith(cwdLower)) return filePath;

  // A path must actually live inside cwd to be shortened. When cwd does not
  // end in a separator, the next character must be one — this prevents a
  // sibling directory that merely shares a textual prefix with cwd (e.g. cwd
  // "app" vs "apple/") from having its leading characters silently chopped.
  const cwdEndsWithSeparator = cwd.endsWith("/") || cwd.endsWith("\\");
  const rest = fileLower.slice(cwdLower.length);
  if (rest === "") return filePath;
  if (!cwdEndsWithSeparator && rest[0] !== "/" && rest[0] !== "\\") {
    return filePath;
  }

  return filePath.slice(cwdLower.length + (cwdEndsWithSeparator ? 0 : 1));
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
  const c = getColors();
  const file = shortenPath(parsed.file);
  const location = parsed.line ? `${file}: line ${parsed.line}` : file;

  const fields = [
    { key: "error", value: parsed.type, color: c.red },
    { key: "message", value: parsed.message, color: c.bold },
    { key: "location", value: location, color: c.yellow },
    { key: "hint", value: hint, color: c.cyan },
  ];

  const keywidth = Math.max(...fields.map((f) => f.key.length));
  const valueIndent = " ".repeat(2 + keywidth);

  const lines = fields.map(({ key, value, color }) => {
    const paddedKey = key.padEnd(keywidth);
    const continuationIndent = `${c.reset}${valueIndent}${color}`;
    const indentedValue = value.split("\n").join(`\n${continuationIndent}`);

    return ` ${c.dim}${paddedKey}${c.reset} ${color}${indentedValue}${c.reset} `;
  });
  process.stdout.write("\n" + lines.join("\n") + "\n\n");
}

module.exports = { formatError };
