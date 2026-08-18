<p align="center">
  <img src="/assets/logo.svg" alt="hint-errors" width="600" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hint-errors"><img src="https://img.shields.io/npm/v/hint-errors.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/hint-errors"><img src="https://img.shields.io/npm/dm/hint-errors.svg" alt="npm downloads" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/hint-errors.svg" alt="node version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/hint-errors.svg" alt="license" /></a>
</p>

## Install

```bash
npm install hint-errors
```

## Usage

### Standalone scripts

Add one line to the top of your entry file. The package catches the first uncaught error, shows a hint, and exits.

```js
require("hint-errors");

const a = 10;
a = 20; // TypeError: Assignment to constant variable
```

When the error is fixed, the script continues normally.

### Web servers

For long-running processes, use server mode. The process stays alive after an error so a single bad request doesn't take down the whole server.

```js
require("hint-errors/server");

const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/crash") {
    const user = undefined;
    console.log(user.name); // shown but server keeps running
  }
  res.end("ok");
});

server.listen(3000);
```

## Custom hints

Register your own hints for domain-specific errors — custom Error
subclasses, internal error codes, anything specific to your codebase —
without forking the package:

```js
const { addHint } = require("hint-errors");

addHint({
  match: /OrderValidationError/,
  hint: "Order failed schema validation — check the payload against orders.schema.json",
});
```

By default, custom hints are checked **before** every built-in hint, so they
can override a built-in match if needed. Pass `{ priority: "low" }` to only
use your hint as a fallback, checked after all built-in hints:

```js
addHint({ match: "some fallback case", hint: "..." }, { priority: "low" });
```

Works the same way with `require("hint-errors/server")`.

## TypeScript

Type declarations are published alongside the package — no `@types/`
package needed. `addHint()`, its options, and the underlying hint/error
shapes are fully typed.

## ESM support

Both entry points work with `import` as well as `require`:

```js
import "hint-errors";
import { addHint } from "hint-errors";
```

```js
import "hint-errors/server";
```

## Production safety

hint-errors is a local development aid, not a production error handler. It
**disables itself automatically when `NODE_ENV=production`** — no listeners
are registered at all, so it has zero effect on how your production process
handles uncaught errors. This protects against the common footgun of
requiring a dev tool in an entry file and forgetting to remove it before
deploying.

If you deliberately want hint-errors active in production, set:

```bash
HINT_ERRORS_FORCE=1
```

## Compatibility with error monitoring tools (Sentry, Winston, APM agents)

Node calls every listener registered on `uncaughtException` and
`unhandledRejection`, in registration order — it doesn't pick one. If your
error-monitoring tool also registers a handler (and some, like Sentry, call
`process.exit()` themselves), whichever tool registered first normally wins
the race to run.

To avoid that race, hint-errors snapshots any listeners already registered
when it loads, always runs its own handler **first** regardless of require
order, and then re-invokes those listeners afterward with the original
error. No listener is dropped or replaced — this only guarantees hint-errors
gets to print before another tool has a chance to terminate the process.

## Output control

hint-errors follows standard CLI color conventions:

| Env var         | Effect                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| `NO_COLOR=1`    | Always disables ANSI color output, regardless of other settings                |
| `FORCE_COLOR=1` | Forces color on, even when stdout isn't an interactive TTY (useful in CI logs) |
| `TERM=dumb`     | Disables color, matching common terminal-capability checks                     |

By default, color is only emitted when stdout is an interactive TTY — piping
output into a file or a log aggregator (CloudWatch, Datadog, etc.) never
receives raw escape codes.

## What's covered

### JavaScript errors

| Error            | When it happens                                                              |
| ---------------- | ---------------------------------------------------------------------------- |
| `TypeError`      | A value is not of the expected type (e.g. reading a property of `undefined`) |
| `ReferenceError` | A variable that doesn't exist or hasn't been initialized is referenced       |
| `SyntaxError`    | The code contains invalid JavaScript syntax                                  |
| `RangeError`     | A numeric value is outside the allowed range                                 |
| `URIError`       | A global URI handling function is used incorrectly                           |
| `AssertionError` | An assertion from the `node:assert` module fails                             |

### Node.js & OS errors

| Code               | When it happens                            |
| ------------------ | ------------------------------------------ |
| `ENOENT`           | File or directory not found                |
| `EACCES`           | Permission denied when accessing a file    |
| `EPERM`            | Operation not permitted, common on Windows |
| `EEXIST`           | File already exists                        |
| `EISDIR`           | Expected a file, got a directory           |
| `ENOTDIR`          | Expected a directory, got a file           |
| `ENOTEMPTY`        | Directory still has contents               |
| `EMFILE`           | Too many files open at once                |
| `MODULE_NOT_FOUND` | Package not installed or path is wrong     |
| `ECONNREFUSED`     | Target server isn't running                |
| `ECONNRESET`       | Connection dropped by remote host          |
| `ETIMEDOUT`        | Server didn't respond in time              |
| `EADDRINUSE`       | Port is already taken                      |
| `EADDRNOTAVAIL`    | Address not available on this machine      |
| `EPIPE`            | Writing to an already-closed connection    |
| `EAI_AGAIN`        | DNS lookup failed (temporary failure)      |
| `EHOSTUNREACH`     | No route to the target host                |

### Async scenarios

- Promise rejected with no `.catch()`
- Unhandled rejection inside `async/await`
- Missing `await` causing undefined reads

### Stack trace parsing

Location detection handles the common CommonJS frame shape
(`at fn (file:line:col)`), parenless top-level frames common in native ESM
(`at file:line:col`), and `file://` URL frames from native ESM — all
normalized back to a plain filesystem path for display.

> **Note:** bundled or minified production code (webpack, esbuild, Vite)
> isn't source-mapped yet — reported line numbers for bundled code point at
> the bundle, not your original source. Source map support is tracked for a
> future release.

## Maintainers

- [@ZLouisMiguel](https://github.com/ZLouisMiguel)
- [@Kennedy](https://github.com/kawacukennedy)
