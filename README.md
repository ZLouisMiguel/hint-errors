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


## Maintainers

- [@ZLouisMiguel](https://github.com/ZLouisMiguel)
