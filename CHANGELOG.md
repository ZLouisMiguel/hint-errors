# Changelog

All notable changes to hint-errors will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.2]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.2
[1.1.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.1.0
[1.0.0]: https://github.com/ZLouisMiguel/hint-errors/releases/tag/v1.0.0
