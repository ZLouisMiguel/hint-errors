# Changelog

All notable changes to hint-errors will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Nothing yet.

---

## [1.3.0] - 2026-08-17

### Added

- **`addHint()` extensibility API** — consuming projects can now register
  custom hints for their own error codes or Error subclasses without
  forking the package: `const { addHint } = require("hint-errors")`.
  Custom hints default to "high" priority (checked before built-in hints)
  and can opt into "low" priority (checked only as a fallback) via
  `addHint(entry, { priority: "low" })`. Available from both `hint-errors`
  and `hint-errors/server`.
- **TypeScript declarations** — `.d.ts` files are now generated from the
  existing JSDoc via `tsc --emitDeclarationOnly` and published alongside
  the package (`dist/`), so consumers get full type checking on `addHint()`
  and the underlying hint/error shapes with no `@types/hint-errors` package
  needed.
- **Dual CJS/ESM entry points** — `import "hint-errors"` and
  `import { addHint } from "hint-errors"` now work directly (also for
  `hint-errors/server`), via thin `.mjs` shims that re-export the existing
  CommonJS implementation. No `createRequire()` workaround needed in
  `"type": "module"` projects.

### Documentation

- README now documents `addHint()`, TypeScript support, and ESM usage.

---

## [1.2.0] - 2026-08-17

### Added

- **Production safety guard** — both `index.js` and `server.js` now disable
  themselves entirely when `NODE_ENV=production`, registering no listeners
  at all. This closes a real reliability gap: a dev tool left in a
  production entry file could previously intercept uncaught exceptions in
  prod, including in `server.js`, which is explicitly designed to keep the
  process alive after an error — masking failures instead of surfacing
  them. Set `HINT_ERRORS_FORCE=1` to opt back in deliberately.
- **Listener chaining** — `uncaughtException`/`unhandledRejection` listeners
  registered before hint-errors loads (e.g. Sentry, Winston, APM agents) are
  now snapshotted and re-invoked after hint-errors' own handler runs,
  regardless of require order. Previously, whichever tool registered first
  won the race to run — if an APM tool that calls `process.exit()` won that
  race, hint-errors' formatted hint might never print. No listener is
  dropped; this only guarantees ordering.
- **`NO_COLOR` / `FORCE_COLOR` / TTY-aware color output** — ANSI color codes
  are now only emitted when stdout is an interactive TTY, honoring the
  `NO_COLOR` standard (no-color.org) and the `FORCE_COLOR` override.
  Previously, color codes were written unconditionally, producing raw
  escape-code noise when output was piped into CI logs or a log aggregator
  (CloudWatch, Datadog, etc).
- **Parenless and `file://` stack frame parsing (Tier 1 ESM support)** —
  `parser.js` now also matches top-level V8 frames without a wrapping
  function name (`at file.js:12:5`, common in native ESM and top-level
  `await` contexts) and normalizes `file://` URL frames (native ESM) back
  to a plain filesystem path via `node:url`'s `fileURLToPath`. Previously
  these frame shapes silently fell through to `file: null`.

### Documentation

- README now documents the production safety default, listener-chaining
  compatibility behavior, and the `NO_COLOR`/`FORCE_COLOR`/`TERM` output
  controls.

---

## [1.1.3] - 2026-08-17

### Added

- Zero-dependency test suite (`test/run.js`) that `npm test` now runs. Covers
  the parser, hint matching, formatter, and both entry points (index + server).

### Fixed

- `npm test` failed out of the box: the `test` directory was gitignored and
  `package.json` pointed at a test script that did not exist. The `.gitignore`
  entry and the `test` script now reference the real suite.
- `formatter.js` — a file path was shortened if it merely shared a textual
  prefix with the current working directory (e.g. cwd `app` and file
  `apple/x.js`). Paths are now only shortened when the file actually lives
  inside cwd, checked on a path boundary.
- `hints.js` — removed two hint entries that could never match:
  `UnhandledPromiseRejection` (the rejection reason, never that literal string,
  reaches `getHint`) and an `async`-specific undefined-read regex (no thrown
  message can contain both "Cannot read" and "async").
- `index.js` — stdout output was truncated when piped (e.g. `node script.js | cat`)
  because `process.exit(1)` killed the process before buffered stdout flushed.
  The exit code is now set via `process.exitCode` and the event loop is left to
  drain, which Node.js docs recommend for exactly this reason.

---

## [1.1.2] - 2026-04-20

### Changed

- `formatter.js` — replaced block-style terminal output with a compact
  key/value layout. Each field (`error`, `message`, `location`, `hint`) renders
  on its own line with keys dim-colored and left-aligned to a fixed column width.
  Multi-line hint values are indented to the same column so all values share a
  consistent left edge. Divider lines and decorative icons removed.

---

## [1.1.0] - 2026-04-18

### Added

- `server.js` — opt-in server mode entry point via `require('hint-errors/server')`.
  Identical pipeline to `index.js` but omits `process.exit(1)` so long-running
  servers survive uncaught errors in individual request handlers without taking
  down the entire process
- `exports` field in `package.json` exposing both `.` and `./server` as valid
  import paths so Node resolves `hint-errors/server` correctly
- Console warning on server mode activation so silent error survival doesn't
  go unnoticed during development

---

## [1.0.0] - 2026-04-18

### Added

- `parser.js` — extracts error type, message, file, and line number from raw
  Node.js `Error` objects. Filters Node internals and `node_modules` from the
  stack trace so only user code frames are surfaced
- `hints.js` — 40+ hint entries covering TypeErrors, ReferenceErrors,
  SyntaxErrors, RangeErrors, URIErrors, AssertionErrors, file system errors
  (`ENOENT`, `EACCES`, `EPERM`, `EEXIST`, `EISDIR`, `ENOTDIR`, `ENOTEMPTY`,
  `EMFILE`), network errors (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`,
  `EADDRINUSE`, `EADDRNOTAVAIL`, `EPIPE`, `EAI_AGAIN`, `EHOSTUNREACH`),
  and async/Promise errors
- `formatter.js` — renders structured error output to the terminal in three
  sections: error type and message, file location and line number, and
  developer hint. Zero-dependency colorization via raw ANSI codes
- `index.js` — entry point that hooks into `process.on('uncaughtException')`
  and `process.on('unhandledRejection')` to intercept all unhandled errors
  automatically on `require`
- Full JSDoc documentation across all source files
- Windows-compatible path handling in `formatter.js`

[1.3.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.3.0
[1.2.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.2.0
[1.1.3]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.3
[1.1.2]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.2
[1.1.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.0
[1.0.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.0.0
