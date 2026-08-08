// test/formatter.test.js
"use strict";
const assert = require("assert");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { formatError } = require("../src/formatter.js");

// Captures whatever formatError writes to stdout so the rendered block can be
// asserted without polluting the test runner's own output.
function capture(fn) {
  const chunks = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => {
    chunks.push(chunk);
    return true;
  };
  try {
    fn();
  } finally {
    process.stdout.write = original;
  }
  return chunks.join("");
}

test("renders error type, message, location and hint", () => {
  const out = capture(() =>
    formatError(
      { type: "TypeError", message: "boom", file: "/app/x.js", line: "3", raw: null },
      "look here",
    ),
  );
  assert.ok(out.includes("TypeError"));
  assert.ok(out.includes("boom"));
  assert.ok(out.includes("/app/x.js"));
  assert.ok(out.includes("look here"));
});

test("renders an unknown location when no file is present", () => {
  const out = capture(() =>
    formatError({ type: "Error", message: "boom", file: null, line: null, raw: null }, "hi"),
  );
  assert.ok(out.includes("unknown location"));
});

test("shortens paths that live inside the current working directory", () => {
  const cwd = process.cwd();
  const out = capture(() =>
    formatError(
      { type: "Error", message: "boom", file: path.join(cwd, "src", "deep", "x.js"), line: "1", raw: null },
      "hi",
    ),
  );
  assert.ok(out.includes(path.join("src", "deep", "x.js")), "should be relative to cwd");
});

test("does NOT shorten a sibling directory that merely shares a prefix with cwd", () => {
  // macOS resolves os.tmpdir() (/var) to a real path (/private/var) when you
  // chdir into it, so resolve once to keep cwd and file on the same root.
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "hint-errors-test-")));
  const cwdDir = path.join(tmp, "app");
  const siblingDir = path.join(tmp, "apple"); // "app" + "le" — shares prefix "app"
  fs.mkdirSync(cwdDir);
  fs.mkdirSync(siblingDir);

  const originalCwd = process.cwd();
  process.chdir(cwdDir);
  try {
    const file = path.join(siblingDir, "x.js");
    const out = capture(() =>
      formatError({ type: "Error", message: "boom", file, line: "1", raw: null }, "hi"),
    );
    assert.ok(
      out.includes(file),
      `expected the full sibling path to stay intact, got: ${out}`,
    );
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("shortens Windows paths regardless of drive-letter case", () => {
  const originalCwd = process.cwd;
  process.cwd = () => "F:\\MyApp";
  try {
    const out = capture(() =>
      formatError(
        { type: "Error", message: "boom", file: "f:\\MyApp\\src\\x.js", line: "1", raw: null },
        "hi",
      ),
    );
    assert.ok(out.includes("src\\x.js"), `expected a relative path, got: ${out}`);
    assert.ok(!out.includes("F:\\"), "expected the cwd prefix to be stripped");
  } finally {
    process.cwd = originalCwd;
  }
});

test("keeps Windows paths that only share a prefix with cwd intact", () => {
  const originalCwd = process.cwd;
  process.cwd = () => "F:\\MyApp";
  try {
    const file = "f:\\MyAppx\\y.js";
    const out = capture(() =>
      formatError({ type: "Error", message: "boom", file, line: "1", raw: null }, "hi"),
    );
    assert.ok(out.includes(file), `expected the full path, got: ${out}`);
  } finally {
    process.cwd = originalCwd;
  }
});
