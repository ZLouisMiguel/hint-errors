// test/hints.test.js
"use strict";
const assert = require("assert");
const { getHint } = require("../src/hints.js");

test("returns a specific hint for undefined property reads", () => {
  const hint = getHint({
    type: "TypeError",
    message: "Cannot read properties of undefined (reading 'name')",
  });
  assert.ok(/defined/.test(hint), "hint should mention the value being undefined");
});

test("returns a specific hint for null property reads", () => {
  const hint = getHint({
    type: "TypeError",
    message: "Cannot read properties of null (reading 'length')",
  });
  assert.ok(/defined/.test(hint), "hint should mention the value being undefined");
});

test("returns a specific hint for non-function calls", () => {
  const hint = getHint({
    type: "TypeError",
    message: "x.y is not a function",
  });
  assert.ok(/function/.test(hint), "hint should mention functions");
});

test("returns a specific hint for window being undefined", () => {
  const hint = getHint({
    type: "ReferenceError",
    message: "window is not defined",
  });
  assert.ok(/window/.test(hint), "hint should mention window");
});

test("returns a specific hint for missing files", () => {
  const hint = getHint({
    type: "Error",
    message: "ENOENT: no such file or directory, open '/tmp/nope.txt'",
  });
  assert.ok(/file|ENOENT/.test(hint), "hint should mention the missing file");
});

test("returns a specific hint for port conflicts", () => {
  const hint = getHint({
    type: "Error",
    message: "EADDRINUSE: address already in use :::3000",
  });
  assert.ok(/port/i.test(hint), "hint should mention the port");
});

test("returns a specific hint for max call stack", () => {
  const hint = getHint({
    type: "RangeError",
    message: "Maximum call stack size exceeded",
  });
  assert.ok(/stack|recurs/.test(hint), "hint should mention the call stack");
});

test("falls back to the generic hint for unmatched errors", () => {
  const hint = getHint({
    type: "Error",
    message: "some exotic thing went sideways",
  });
  assert.ok(hint.length > 0);
});

test("async undefined-read hint is not reachable from a plain message (dead entry removed)", () => {
  const hint = getHint({
    type: "TypeError",
    message: "Cannot read properties of undefined (reading 'x')",
  });
  assert.ok(
    !/await/i.test(hint),
    "a plain thrown message must not hit the async-specific hint",
  );
});

test("unhandled rejection reasons still get the generic pipeline hint", () => {
  const hint = getHint({
    type: "Error",
    message: "boom from a rejected promise",
  });
  assert.ok(hint.length > 0);
});
