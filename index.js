const { parseError } = require("parser.js");
const { getHint } = require("hints.js");
const { formatError } = require("formatter.js");

function handle(err) {
  const parsed = parseError(err);
  const hint = getHint(parsed);
  formatError(parsed, hint);
}


process.on("UncaughtException", (err)=> {
  handle(err);
  process.exit(1);
})

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  handle(err);
  process.exit(1);
});