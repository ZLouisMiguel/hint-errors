// test/docs-sync.test.js
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.join(__dirname, "..");
const srcPath = path.join(rootDir, "src", "hints.js");
const docsPath = path.join(rootDir, "docs", "app.js");

// Loads the private `hints` array from src/hints.js by evaluating the module
// in a sandbox, since it is not part of the public exports (getHint/addHint).
function loadSrcHintTexts() {
  const source = fs.readFileSync(srcPath, "utf8");
  const sandbox = { console, module: { exports: {} }, exports: {} };
  vm.runInNewContext(source + "\n;this.__hints = hints;", sandbox);
  return sandbox.__hints.map((entry) => entry.hint);
}

// Pulls the HINTS_DATA array literal out of docs/app.js and evaluates just
// that literal (it is plain data — no DOM, globals, or side effects).
function loadDocsHintTexts() {
  const source = fs.readFileSync(docsPath, "utf8");
  const marker = "var HINTS_DATA = ";
  const start = source.indexOf(marker);
  assert.notStrictEqual(
    start,
    -1,
    "docs/app.js should still declare the HINTS_DATA array",
  );
  const end = source.indexOf("];", start);
  assert.notStrictEqual(end, -1, "HINTS_DATA literal should be closed with ];");
  const literal = source.slice(start + marker.length, end + 1);
  const data = vm.runInNewContext(literal);
  return data.reduce((acc, group) => acc.concat(group.entries), []).map(
    (entry) => entry.hint,
  );
}

test("docs/app.js HINTS_DATA stays in sync with src/hints.js hints", () => {
  const srcHints = loadSrcHintTexts();
  const docsHints = loadDocsHintTexts();

  const assertMultiset = (a, b, labelA, labelB) => {
    const counts = new Map();
    for (const hint of a) counts.set(hint, (counts.get(hint) || 0) + 1);
    const missing = [];
    for (const hint of b) {
      const n = counts.get(hint);
      if (!n) {
        missing.push(hint);
      } else {
        counts.set(hint, n - 1);
      }
    }
    assert.deepStrictEqual(
      missing,
      [],
      `${labelA} has hints that are not in ${labelB}:\n${missing.join("\n")}`,
    );
  };

  assert.strictEqual(
    docsHints.length,
    srcHints.length,
    `docs gallery/playground expect ${docsHints.length} hints but src/hints.js has ${srcHints.length}. ` +
      "Update HINTS_DATA in docs/app.js when you change src/hints.js.",
  );
  assert.deepStrictEqual(
    Array.from(docsHints),
    Array.from(srcHints),
    "docs/app.js must preserve the same hint ordering as src/hints.js so specific rules stay ahead of generic ones.",
  );
  assertMultiset(
    srcHints,
    docsHints,
    "docs/app.js",
    "src/hints.js",
  );
  assertMultiset(
    docsHints,
    srcHints,
    "src/hints.js",
    "docs/app.js",
  );
});

test("docs/app.js HINTS_DATA has no duplicate entries", () => {
  const docsHints = loadDocsHintTexts();
  const seen = new Set();
  const duplicates = [];
  for (const hint of docsHints) {
    if (seen.has(hint)) duplicates.push(hint);
    seen.add(hint);
  }
  assert.deepStrictEqual(
    duplicates,
    [],
    `HINTS_DATA in docs/app.js contains duplicate hints:\n${duplicates.join("\n")}`,
  );
});
