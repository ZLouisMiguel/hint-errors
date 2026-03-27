//terminal color codes

const c = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

function shortenPath(filePath) {
  if (!filePath) return "unkown location";
  const cwd = process.cwd();
  return filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
}

function indentLines(text, prefix) {
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

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

  process.stderr.write(output + "\n");
}

module.exports = { formatError };
