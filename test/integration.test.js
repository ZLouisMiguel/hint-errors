// test/integration.test.js
"use strict";
const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const indexEntry = JSON.stringify(path.join(__dirname, "..", "index.js"));
const serverEntry = JSON.stringify(path.join(__dirname, "..", "server.js"));
// The .mjs shims are imported by file URL, which also mirrors how a bundler or
// a "type": "module" consumer resolves the package's "import" export.
const indexEsmEntry = JSON.stringify(
  pathToFileURL(path.join(__dirname, "..", "index.mjs")).href,
);
const serverEsmEntry = JSON.stringify(
  pathToFileURL(path.join(__dirname, "..", "server.mjs")).href,
);

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

test("server entry prints the hint and exits after an uncaught error", () => {
  const script = `
    require(${serverEntry});
    setInterval(() => {}, 1000);
    const err = new Error("server boom");
    err.message += " | " + "x".repeat(200000);
    throw err;
  `;
  const res = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
  });
  assert.strictEqual(
    res.status,
    1,
    `server entry must exit after an uncaught error (status was ${res.status}, signal ${res.signal})`,
  );
  assert.ok(
    res.stdout.includes("server boom"),
    "hint block should still be printed",
  );
  assert.ok(
    res.stdout.length > 200000,
    `expected the formatted output to survive before exit, got ${res.stdout.length} bytes`,
  );
  assert.ok(
    !res.stderr.includes("server boom"),
    "Node's raw stack trace should not be printed alongside the formatted hint",
  );
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
    env: {
      ...process.env,
      NODE_ENV: "production",
      NO_COLOR: "1",
      FORCE_COLOR: undefined,
    },
  });
  assert.ok(
    !res.stdout.includes("boom in prod"),
    "no formatted hint block should be printed when disabled in production",
  );
  assert.ok(
    res.stdout.includes("[hint-errors]") &&
      res.stdout.includes("disabled by default"),
    "should warn on stdout that hint-errors is disabled in production",
  );
  assert.ok(
    !/\x1b\[/.test(res.stdout),
    "production warning should honor NO_COLOR",
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
    env: {
      ...process.env,
      NODE_ENV: "production",
      NO_COLOR: "1",
      FORCE_COLOR: undefined,
    },
    timeout: 1500,
  });
  assert.ok(
    !res.stdout.includes("boom in prod server"),
    "no formatted hint should be printed when disabled in production",
  );
  assert.ok(
    res.stdout.includes("[hint-errors]") &&
      res.stdout.includes("disabled by default"),
    "should warn on stdout that hint-errors server entry is disabled in production",
  );
  assert.ok(
    !/\x1b\[/.test(res.stdout),
    "server production warning should honor NO_COLOR",
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

test("ESM shim (index.mjs): import exposes addHint and handles an uncaught error", () => {
  const script = `
    const { addHint } = await import(${indexEsmEntry});
    console.log("ESM_INDEX_EXPOSED " + typeof addHint);
    throw new Error("esm boom");
  `;
  const res = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8" },
  );
  assert.strictEqual(res.status, 1, `expected exit code 1, got ${res.status}`);
  assert.ok(
    res.stdout.includes("ESM_INDEX_EXPOSED function"),
    "the index.mjs shim should expose addHint",
  );
  assert.ok(
    res.stdout.includes("esm boom"),
    "importing index.mjs should register the same uncaughtException handler",
  );
});

test("ESM shim (server.mjs): import exposes addHint and exits after an error", () => {
  const script = `
    const { addHint } = await import(${serverEsmEntry});
    console.log("ESM_SERVER_EXPOSED " + typeof addHint);
    setInterval(() => {}, 1000);
    throw new Error("esm server boom");
  `;
  const res = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8" },
  );
  assert.strictEqual(
    res.status,
    1,
    `server entry must exit after an uncaught error (status was ${res.status}, signal ${res.signal})`,
  );
  assert.ok(
    res.stdout.includes("ESM_SERVER_EXPOSED function"),
    "the server.mjs shim should expose addHint",
  );
  assert.ok(
    res.stdout.includes("esm server boom"),
    "importing server.mjs should register the same handler as server.js",
  );
  assert.ok(
    !res.stderr.includes("esm server boom"),
    "Node's raw stack trace should not be printed alongside the formatted hint",
  );
});
