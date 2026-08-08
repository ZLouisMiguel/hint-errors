// test/run.js
"use strict";

// Zero-dependency test runner. Discovers every *.test.js file inside test/
// and runs the `test(name, fn)` blocks it finds, then prints a pass/fail
// report and exits non-zero if anything failed.
const fs = require("fs");
const path = require("path");

const tests = [];
global.test = (name, fn) => tests.push({ name, fn });

const dir = __dirname;
for (const entry of fs.readdirSync(dir).sort()) {
  if (entry.endsWith(".test.js")) {
    require(path.join(dir, entry));
  }
}

(async () => {
  let passed = 0;
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`  ok   ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAIL ${name}`);
      console.error(`--- ${name} ---`);
      console.error(err && err.stack ? err.stack : String(err));
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
})();
