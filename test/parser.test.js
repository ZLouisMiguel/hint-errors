// test/parser.test.js
"use strict";
const assert = require("assert");
const { pathToFileURL } = require("url");
const { parseError } = require("../src/parser.js");

test("extracts type and message from a TypeError", () => {
  const parsed = parseError(new TypeError("boom"));
  assert.strictEqual(parsed.type, "TypeError");
  assert.strictEqual(parsed.message, "boom");
});

test("extracts file and line from the first user frame", () => {
  const err = new Error("boom");
  err.stack = [
    "Error: boom",
    "    at Object.<anonymous> (/app/src/x.js:12:5)",
    "    at Module._compile (node:internal/modules/cjs/loader:999:22)",
  ].join("\n");
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, "/app/src/x.js");
  assert.strictEqual(parsed.line, "12");
});

test("filters node internals and node_modules frames", () => {
  const err = new Error("boom");
  err.stack = [
    "Error: boom",
    "    at Object.<anonymous> (node:internal/modules/cjs/loader:999:22)",
    "    at Foo.bar (/app/node_modules/dep/lib/index.js:5:3)",
    "    at Object.<anonymous> (/app/src/index.js:3:1)",
  ].join("\n");
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, "/app/src/index.js");
  assert.strictEqual(parsed.line, "3");
});

test("falls back to null file/line when only internal frames exist", () => {
  const err = new Error("boom");
  err.stack = [
    "Error: boom",
    "    at Object.<anonymous> (node:internal/main/run_main_module:17:47)",
  ].join("\n");
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, null);
  assert.strictEqual(parsed.line, null);
});

test("normalizes non-Error throw values", () => {
  const parsed = parseError("oops");
  assert.strictEqual(parsed.type, "Error");
  assert.strictEqual(parsed.message, "oops");
  assert.strictEqual(parsed.file, null);
  assert.strictEqual(parsed.line, null);
  assert.strictEqual(parsed.raw, "oops");
});

test("uses fallback message for errors with an empty message", () => {
  const parsed = parseError(new Error("   "));
  assert.strictEqual(parsed.message, "An unknown error occurred");
});

test("preserves the original value on raw", () => {
  const err = new Error("boom");
  const parsed = parseError(err);
  assert.strictEqual(parsed.raw, err);
});

test("extracts file and line from a parenless top-level frame (native ESM shape)", () => {
  const err = new Error("boom");
  err.stack = ["Error: boom", "    at /app/src/top-level.mjs:4:1"].join("\n");
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, "/app/src/top-level.mjs");
  assert.strictEqual(parsed.line, "4");
});

test("extracts file and line from a parenless async top-level frame", () => {
  const err = new Error("boom");
  err.stack = ["Error: boom", "    at async /app/src/handler.mjs:9:3"].join(
    "\n",
  );
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, "/app/src/handler.mjs");
  assert.strictEqual(parsed.line, "9");
});

test("normalizes a file:// URL frame back to a filesystem path (native ESM)", () => {
  // Built via pathToFileURL/fileURLToPath so the expected path is correct
  // on whatever platform the suite runs on (POSIX or Windows).
  const absPath =
    process.platform === "win32" ? "C:\\app\\src\\x.js" : "/app/src/x.js";
  const fileUrl = pathToFileURL(absPath).href;

  const err = new Error("boom");
  err.stack = ["Error: boom", `    at ${fileUrl}:9:1`].join("\n");
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, absPath);
  assert.strictEqual(parsed.line, "9");
});

test("normalizes a parenthesized file:// URL frame back to a filesystem path", () => {
  const absPath =
    process.platform === "win32" ? "C:\\app\\src\\y.js" : "/app/src/y.js";
  const fileUrl = pathToFileURL(absPath).href;

  const err = new Error("boom");
  err.stack = [
    "Error: boom",
    `    at Object.<anonymous> (${fileUrl}:2:10)`,
  ].join("\n");
  const parsed = parseError(err);
  assert.strictEqual(parsed.file, absPath);
  assert.strictEqual(parsed.line, "2");
});
