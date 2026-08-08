// test/integration.test.js
"use strict";
const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const indexEntry = JSON.stringify(path.join(__dirname, "..", "index.js"));
const serverEntry = JSON.stringify(path.join(__dirname, "..", "server.js"));

// A script that requires index.js and then throws. The thrown error's message
// is padded far past the OS pipe buffer so any truncation from a premature
// process.exit(1) shows up as a missing hint at the end of the output.
function indexThrowScript() {
  return `
    require(${indexEntry});
    const err = new TypeError("Cannot read properties of undefined (reading 'x')");
    err.message += " | " + "x".repeat(200000);
    throw err;
  `;
}

test("index mode prints the hint and exits with code 1", () => {
  const res = spawnSync(process.execPath, ["-e", indexThrowScript()], {
    encoding: "utf8",
  });
  assert.strictEqual(res.status, 1, `expected exit code 1, got ${res.status}`);
  assert.ok(res.stdout.includes("doesn't exist yet"), "hint text should be present");
  assert.ok(res.stdout.includes("TypeError"));
});

test("index mode exits 1 on unhandled promise rejections too", () => {
  const script = `
    require(${indexEntry});
    Promise.reject(new Error("boom from a rejected promise"));
  `;
  const res = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" });
  assert.strictEqual(res.status, 1, `expected exit code 1, got ${res.status}`);
  assert.ok(res.stdout.includes("boom from a rejected promise"));
});

test("server mode stays alive after an uncaught error", () => {
  const script = `
    require(${serverEntry});
    setInterval(() => {}, 1000);
    throw new Error("boom");
  `;
  // The child never exits on its own (server mode survives the error), so a
  // spawnSync timeout is what stops it. If it had exited on its own, status
  // would be non-null — signalling the process died after the uncaught error.
  const res = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    timeout: 1500,
  });
  assert.strictEqual(
    res.status,
    null,
    `server mode must stay alive after an uncaught error (status was ${res.status}, signal ${res.signal})`,
  );
  assert.strictEqual(res.signal, "SIGTERM");
  assert.ok(res.stdout.includes("boom"), "hint block should still be printed");
});

test("large output is not truncated when piped (stdout flush race)", () => {
  const res = spawnSync(process.execPath, ["-e", indexThrowScript()], {
    encoding: "utf8",
  });
  assert.ok(
    res.stdout.includes("doesn't exist yet"),
    "formatted hint must not be truncated when piped",
  );
  assert.ok(res.stdout.length > 200000, `expected the large message to survive, got ${res.stdout.length} bytes`);
});
