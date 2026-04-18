# hint-errors

> Stop reading stack traces. Start reading hints.

```
────────────────────────────────────────────────────────────────────
  ❌ TypeError
     Cannot read properties of undefined (reading 'name')

  📍  server.js  ·  line 42

  💡
     You're trying to access a property on something that doesn't exist
     yet. Check that the value is defined before you use it — a quick
     console.log just above the error line will show you what it actually is.
────────────────────────────────────────────────────────────────────
```

Instead of this:

```
TypeError: Cannot read properties of undefined (reading 'name')
    at Object.<anonymous> (/home/louis/projects/app/server.js:42:15)
    at Module._compile (node:internal/modules/cjs/loader:1356:14)
    at node:internal/modules/cjs/loader:1414:16
    at node:internal/modules/cjs/loader:1587:12
    ... 8 more lines of Node internals
```

---

## Highlights

- Zero dependencies
- One line to activate and it works across your entire app automatically
- 40+ hints across TypeErrors, ReferenceErrors, SyntaxErrors, file system, network, and async errors
- Filters Node internals and `node_modules` from the stack and shows only your code
- Works on Windows, macOS, and Linux

---

## Install

```bash
npm install hint-errors
```

---

## Usage

### Scripts and short-lived processes

Add one line to the top of your entry file.

```js
require("hint-errors");
```

That's it. hint-errors hooks into Node's global process events the moment it's required. Every uncaught error and unhandled Promise rejection anywhere in your app gets intercepted automatically no wrapping, no configuration, no changes to existing code.

```js
// entry.js
require("hint-errors");

const app = require("./app");
app.start();
```

### Servers and long-running processes

By default hint-errors exits the process after showing a hint the right behavior for scripts. For servers you opt in to a mode that shows the hint but keeps the process alive so a single bad request doesn't take down every other user.

```js
// server.js
require("hint-errors/server");

const http = require("http");
const app = require("./app");

http.createServer(app).listen(3000);
```

When server mode is active you'll see this warning in your terminal so the behavior is never silent:

```
[hint-errors] server mode active process will stay alive after uncaught errors
```

| Entry point                     | Process after error | Use for                              |
| ------------------------------- | ------------------- | ------------------------------------ |
| `require('hint-errors')`        | Exits with code 1   | Scripts, CLIs, short-lived processes |
| `require('hint-errors/server')` | Stays alive         | HTTP servers, long-running processes |

---

## What's covered

**JavaScript**

| Type             | Covered messages                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TypeError`      | `Cannot read properties of undefined/null`, `is not a function`, `Cannot destructure`, `is not iterable`, `Converting circular structure to JSON` |
| `ReferenceError` | `is not defined`, `window is not defined`, `document is not defined`, `fetch is not defined`, `localStorage is not defined`                       |
| `SyntaxError`    | `Unexpected token`, `Unexpected end of input`, `Cannot use import statement outside a module`, `require is not defined`                           |
| `RangeError`     | `Maximum call stack size exceeded`, `Invalid array length`, `Invalid Date`                                                                        |
| `URIError`       | `URI malformed`                                                                                                                                   |
| `AssertionError` | `Expected values to be strictly equal`                                                                                                            |

**Node.js & OS**

| Code               | When it happens                             |
| ------------------ | ------------------------------------------- |
| `ENOENT`           | File or directory not found                 |
| `EACCES`           | Permission denied                           |
| `EPERM`            | Operation not permitted — common on Windows |
| `EEXIST`           | File already exists                         |
| `EISDIR`           | Expected a file, got a directory            |
| `ENOTDIR`          | Expected a directory, got a file            |
| `ENOTEMPTY`        | Directory still has contents                |
| `EMFILE`           | Too many files open at once                 |
| `MODULE_NOT_FOUND` | Package not installed or path is wrong      |

**Network**

| Code            | When it happens                         |
| --------------- | --------------------------------------- |
| `ECONNREFUSED`  | Target server isn't running             |
| `ECONNRESET`    | Connection dropped by remote host       |
| `ETIMEDOUT`     | Server didn't respond in time           |
| `EADDRINUSE`    | Port is already taken                   |
| `EADDRNOTAVAIL` | Address not available on this machine   |
| `EPIPE`         | Writing to an already-closed connection |
| `EAI_AGAIN`     | DNS lookup failed                       |
| `EHOSTUNREACH`  | No route to host                        |

**Async**

| Scenario                                 | Covered |
| ---------------------------------------- | ------- |
| Promise rejected with no `.catch()`      | ✅      |
| Unhandled rejection inside `async/await` | ✅      |
| Missing `await` causing undefined reads  | ✅      |

---

## Project structure

```
hint-errors/
├── index.js          ← default entry point, exits after showing hint
├── server.js         ← server mode entry point, stays alive after showing hint
├── src/
│   ├── parser.js     ← pulls structured data out of raw Error objects
│   ├── hints.js      ← matches errors to hint strings
│   └── formatter.js  ← renders the terminal output
└──
```

---

## License

ISC © [Louis](https://github.com/ZLouisMiguel)
