# Changelog

All notable changes to hint-errors will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Nothing yet — see the [1.2.0 milestone](https://github.com/ZLouisMiguel/hint-errors/milestone/1) for planned work (production safety guard, listener chaining, `NO_COLOR`/TTY detection, ESM-aware stack parsing).

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

[1.1.3]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.3
[1.1.2]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.2
[1.1.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.0
[1.0.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.0.0
