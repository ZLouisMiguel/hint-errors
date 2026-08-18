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
  assert.ok(
    res.stdout.includes("doesn't exist yet"),
    "hint text should be present",
  );
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
  assert.ok(
    res.stdout.length > 200000,
    `expected the large message to survive, got ${res.stdout.length} bytes`,
  );
});

test("index mode disables itself by default when NODE_ENV=production", () => {
  const script = `
    require(${indexEntry});
    throw new Error("boom in prod");
  `;
  const res = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production" },
  });
  assert.ok(
    !res.stdout.includes("hint"),
    "no formatted hint block should be printed when disabled in production",
  );
  assert.ok(
    res.stderr.includes("[hint-errors]") &&
      res.stderr.includes("disabled by default"),
    "should warn on stderr that hint-errors is disabled in production",
  );
  // Node's own default uncaught-exception behavior takes over: non-zero exit.
  assert.notStrictEqual(res.status, 0);
});

test("index mode re-enables in production when HINT_ERRORS_FORCE=1", () => {
  const script = `
    require(${indexEntry});
    throw new Error("boom in forced prod");
  `;
  const res = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production", HINT_ERRORS_FORCE: "1" },
  });
  assert.strictEqual(res.status, 1, `expected exit code 1, got ${res.status}`);
  assert.ok(
    res.stdout.includes("boom in forced prod"),
    "formatted hint should be printed when force-enabled in production",
  );
});

test("index mode runs its own handler before re-invoking a pre-existing uncaughtException listener", () => {
  const script = `
    process.on('uncaughtException', () => {
      console.log('CUSTOM_LISTENER_RAN');
    });
    require(${indexEntry});
    throw new Error("chained boom");
  `;
  const res = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" });
  assert.ok(
    res.stdout.includes("chained boom"),
    "hint-errors' own hint should still print",
  );
  assert.ok(
    res.stdout.includes("CUSTOM_LISTENER_RAN"),
    "the pre-existing listener should still run",
  );
  assert.ok(
    res.stdout.indexOf("chained boom") <
      res.stdout.indexOf("CUSTOM_LISTENER_RAN"),
    "hint-errors should run before listeners that were registered earlier, to avoid a process.exit() race",
  );
});

test("server mode disables itself by default when NODE_ENV=production", () => {
  const script = `
    require(${serverEntry});
    setInterval(() => {}, 1000);
    throw new Error("boom in prod server");
  `;
  const res = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production" },
    timeout: 1500,
  });
  assert.ok(
    !res.stdout.includes("boom in prod server"),
    "no formatted hint should be printed when disabled in production",
  );
  assert.ok(
    res.stderr.includes("[hint-errors]") &&
      res.stderr.includes("disabled by default"),
    "should warn on stderr that hint-errors server mode is disabled in production",
  );
  // Disabled means no listeners are registered at all, so Node's default
  // uncaught-exception behavior (crash) takes over instead of staying alive.
  assert.notStrictEqual(
    res.status,
    null,
    "process should have exited, not stayed alive, when disabled",
  );
});

test("addHint registered through the public entry point is used for a real uncaught error", () => {
  const script = `
    const { addHint } = require(${indexEntry});
    addHint({
      match: "MyAppSpecificOrderError",
      hint: "ORDER_HINT_MARKER: check the order payload against the schema.",
    });
    throw new Error("MyAppSpecificOrderError: payload missing field 'sku'");
  `;
  const res = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" });
  assert.strictEqual(res.status, 1, `expected exit code 1, got ${res.status}`);
  assert.ok(
    res.stdout.includes("ORDER_HINT_MARKER"),
    "the custom hint registered via addHint should appear in the formatted output",
  );
});
