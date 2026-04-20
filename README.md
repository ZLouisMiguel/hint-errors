# hint-errors

> JavaScript errors done right 

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

For long‑running processes, use server mode. The process stays alive after an error so a single bad request doesn't take down the whole server.

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

**JavaScript errors**

- [TypeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError) – when a value is not of the expected type (e.g., reading a property of `undefined`)
- [ReferenceError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError) – when a variable that doesn't exist (or hasn't been initialized) is referenced
- [SyntaxError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError) – when the code contains invalid JavaScript syntax
- [RangeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError) – when a numeric value is outside the allowed range
- [URIError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/URIError) – when a global URI handling function is used incorrectly
- [AssertionError](https://nodejs.org/api/assert.html#new-assertassertionerroroptions) – when an assertion from the `node:assert` module fails

**Node.js & OS errors**

- [ENOENT](https://nodejs.org/api/errors.html#enoent-no-such-file-or-directory) – file or directory not found
- [EACCES](https://nodejs.org/api/errors.html#eacces-permission-denied) – permission denied when accessing a file
- [EPERM](https://nodejs.org/api/errors.html#eperm-operation-not-permitted) – operation not permitted, common on Windows
- [EEXIST](https://nodejs.org/api/errors.html#eexist-file-already-exists) – file already exists
- [EISDIR](https://nodejs.org/api/errors.html#eisdir-illegal-operation-on-a-directory) – expected a file, got a directory
- [ENOTDIR](https://nodejs.org/api/errors.html#enotdir-not-a-directory) – expected a directory, got a file
- [ENOTEMPTY](https://nodejs.org/api/errors.html#enotempty-directory-not-empty) – directory still has contents
- [EMFILE](https://nodejs.org/api/errors.html#emfile-too-many-open-files) – too many files open at once
- [MODULE_NOT_FOUND](https://nodejs.org/api/errors.html#module_not_found) – package not installed or path is wrong
- [ECONNREFUSED](https://nodejs.org/api/errors.html#econnrefused-connection-refused) – target server isn't running
- [ECONNRESET](https://nodejs.org/api/errors.html#econnreset-connection-reset-by-peer) – connection dropped by remote host
- [ETIMEDOUT](https://nodejs.org/api/errors.html#etimedout-operation-timed-out) – server didn't respond in time
- [EADDRINUSE](https://nodejs.org/api/errors.html#eaddrinuse-address-already-in-use) – port is already taken
- [EADDRNOTAVAIL](https://nodejs.org/api/errors.html#eaddrinuse-address-already-in-use) – address not available on this machine
- [EPIPE](https://nodejs.org/api/errors.html#epipe-broken-pipe) – writing to an already-closed connection
- [EAI_AGAIN](https://nodejs.org/api/errors.html#eai_again-dns-temporary-failure) – DNS lookup failed (temporary failure)
- [EHOSTUNREACH](https://nodejs.org/api/errors.html#ehostunreach-no-route-to-host) – no route to the target host

**Async scenarios**

- Promise rejected with no `.catch()`
- Unhandled rejection inside `async/await`
- Missing `await` causing undefined reads

## Maintainers

- [ZLouisMiguel](https://github.com/ZLouisMiguel)
