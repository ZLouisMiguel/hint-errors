// Maps a parsed error object to a developer-friendly hint.
const hints = [
  // ─── TypeErrors ────────────────────────────────────────────────
  {
    match: "Cannot read properties of undefined",
    hint: `You're trying to access a property on something that doesn't exist yet.
Check that the value is defined before you use it — a quick console.log
just above the error line will show you what it actually is.`,
  },
  {
    match: "Cannot read properties of null",
    hint: `The value you're reading from is null, not just undefined.
This usually means something that was supposed to return data returned null instead.
Check where that value comes from and whether it can ever be null.`,
  },
  {
    match: /is not a function/,
    hint: `You're calling something as a function, but it isn't one at that point.
This could mean: you imported the wrong thing, the function name is misspelled,
or the variable was overwritten somewhere before this line.`,
  },
  {
    match: "Cannot set properties of undefined",
    hint: `You're trying to assign a property to something that doesn't exist.
Make sure the object is initialized before you try to write to it.`,
  },
  {
    match: "Cannot set properties of null",
    hint: `You're trying to assign a property to null.
Trace back where this value comes from — something returned null that should have returned an object.`,
  },
  {
    match: "Converting circular structure to JSON",
    hint: `You're passing an object that references itself into JSON.stringify().
This often happens with objects that have parent/child references.
Consider using a replacer function, or a library like flatted.`,
  },
  {
    match:
      /\.map is not a function|\.forEach is not a function|\.filter is not a function|\.reduce is not a function/,
    hint: `You're calling an array method on something that isn't an array.
The value is likely undefined, null, or a different type entirely.
Add a console.log on the value just before this line to see what it actually is.`,
  },
  {
    match: /\.then is not a function/,
    hint: `You're calling .then() on something that isn't a Promise.
The function you're awaiting probably isn't returning a Promise.
Check that the function is async or explicitly returns a Promise.`,
  },
  {
    match: "Cannot destructure property",
    hint: `You're trying to destructure a value that is null or undefined.
For example: const { name } = user — if user is undefined, this crashes.
Make sure the value exists before you destructure it.`,
  },
  {
    match: /is not iterable/,
    hint: `You're trying to loop over or spread something that can't be iterated.
This usually means the value is null, undefined, or a plain object instead of an array.
Check what the value actually is before trying to iterate it.`,
  },
  {
    match: "Cannot assign to read only property",
    hint: `You're trying to modify a property that has been marked as read-only.
This can happen with frozen objects (Object.freeze), constants, or
properties defined with writable: false via Object.defineProperty.`,
  },
  {
    match: "Right-hand side of 'instanceof' is not callable",
    hint: `The value on the right of instanceof isn't a constructor or class.
It's likely undefined or was never exported/imported correctly.
Check your imports at the top of the file.`,
  },
  {
    match: "Class constructor",
    hint: `You're calling a class constructor without the 'new' keyword.
Change your call from MyClass() to new MyClass().`,
  },

  // ─── ReferenceErrors ───────────────────────────────────────────
  {
    match: "is not defined",
    hint: `You're using a variable or function that hasn't been declared yet.
Check for typos in the name, make sure it's in scope, and that the
file or module it lives in has been imported correctly.`,
  },
  {
    match: "window is not defined",
    hint: `'window' is a browser-only global — it doesn't exist in Node.js.
If you're using a library that requires a browser environment, look for
a Node.js-compatible version, or guard the code with: if (typeof window !== 'undefined').`,
  },
  {
    match: "document is not defined",
    hint: `'document' is a browser-only global — it doesn't exist in Node.js.
You're likely running browser-targeted code in a Node environment.
If you need DOM functionality in Node, consider using a library like jsdom.`,
  },
  {
    match: "localStorage is not defined",
    hint: `'localStorage' is a browser-only API — it doesn't exist in Node.js.
If you need persistent storage in Node, use the fs module, a database,
or a package like node-localstorage.`,
  },
  {
    match: "fetch is not defined",
    hint: `'fetch' is not available in older versions of Node.js (below v18).
If you're on Node 18+, make sure you're not in a context where it's unavailable.
Otherwise, install a polyfill like node-fetch: npm install node-fetch.`,
  },

  // ─── SyntaxErrors ──────────────────────────────────────────────
  {
    match: "Unexpected token",
    hint: `Node hit something it didn't expect while reading your code.
This is usually a missing bracket, comma, or parenthesis somewhere nearby.
Check the line above the one reported — the real mistake is often one line up.`,
  },
  {
    match: "Unexpected end of input",
    hint: `Your code ends before it should — something was opened but never closed.
Look for an unclosed bracket {}, parenthesis (), or array [].`,
  },
  {
    match: "Invalid or unexpected token",
    hint: `There's a character in your code that doesn't belong there.
A common cause is a stray symbol, a smart quote instead of a regular quote,
or a copy-paste from a source that included hidden characters.`,
  },
  {
    match: "Unexpected identifier",
    hint: `Node found a word where it didn't expect one.
This is usually a missing comma between items, a forgotten operator,
or a keyword used in the wrong place.`,
  },
  {
    match: "Cannot use import statement outside a module",
    hint: `You're using ES module syntax (import/export) but Node is treating your file as CommonJS.
Either rename the file to .mjs, add "type": "module" to your package.json,
or switch to CommonJS syntax: const x = require('x').`,
  },
  {
    match: "require is not defined",
    hint: `You're using require() inside an ES module.
Your package.json likely has "type": "module" set.
Either switch to import syntax, or rename the file to .cjs.`,
  },

  // ─── RangeErrors ───────────────────────────────────────────────
  {
    match: "Maximum call stack size exceeded",
    hint: `Your code is calling itself too many times — this is infinite recursion.
A function is calling itself (directly or indirectly) with no exit condition.
Check your recursive function for a base case that actually stops the loop.`,
  },
  {
    match: "Invalid array length",
    hint: `You're trying to create an array with an invalid length.
Array lengths must be a non-negative integer — check the value you're passing in.`,
  },
  {
    match: /Invalid time value|Invalid Date/,
    hint: `You're creating a Date object with a value that can't be parsed.
Check the string or number you're passing to new Date() — it may be null,
undefined, or in a format that JavaScript doesn't recognize.`,
  },
  {
    match: "toFixed() digits",
    hint: `The number you passed to .toFixed() is out of range.
toFixed() only accepts a number between 0 and 100.`,
  },

  // ─── URIError ──────────────────────────────────────────────────
  {
    match: /malformed URI|URI malformed/,
    hint: `You passed an invalid URI to encodeURIComponent, decodeURIComponent, or a similar function.
A common cause is a stray % character that isn't part of a valid percent-encoded sequence.
Make sure the string is a valid URI before decoding it.`,
  },

  // ─── AssertionErrors ───────────────────────────────────────────
  {
    match: "AssertionError",
    hint: `An assertion in your code failed — two values that were expected to be equal weren't.
Check the values being compared in your assert() call.
If this is in a test, the output above should tell you what was expected vs what was received.`,
  },
  {
    match: "Expected values to be strictly equal",
    hint: `An assertion failed because the two values aren't strictly equal (===).
Check the types as well as the values — 1 and "1" are not strictly equal.`,
  },

  // ─── Node / File System ────────────────────────────────────────
  {
    match: "ENOENT: no such file or directory",
    hint: `The file or folder you're pointing to doesn't exist at that path.
Double-check the path is correct, and remember — paths are relative to where
your script is running from, not necessarily where the file lives.`,
  },
  {
    match: "EACCES: permission denied",
    hint: `Your process doesn't have permission to access that file or directory.
Try checking the file's permissions, or if you're on Linux/Mac run: ls -la <path>
On Windows, try running your terminal as Administrator.`,
  },
  {
    match: "EPERM: operation not permitted",
    hint: `The operation was blocked by the operating system — likely a permissions issue.
On Windows this often means a file is locked by another process (your editor, antivirus, or a running server).
Try closing other programs, or run your terminal as Administrator.`,
  },
  {
    match: "EEXIST: file already exists",
    hint: `You're trying to create a file or directory that already exists.
Check if it exists first before creating it, or use a flag like { flag: 'w' }
to overwrite it if that's your intention.`,
  },
  {
    match: "EISDIR: illegal operation on a directory",
    hint: `You're trying to perform a file operation on a directory.
Check your path — it's pointing to a folder, not a file.
Use fs.readdir() if you meant to read a directory's contents.`,
  },
  {
    match: "ENOTDIR: not a directory",
    hint: `You're trying to perform a directory operation on a file.
Check your path — it's pointing to a file, not a folder.`,
  },
  {
    match: "ENOTEMPTY: directory not empty",
    hint: `You're trying to delete a directory that still has files in it.
Use fs.rmSync(path, { recursive: true }) to remove it and all its contents,
but be careful — this is irreversible.`,
  },
  {
    match: "EMFILE: too many open files",
    hint: `Your app has opened more files than the operating system allows at once.
Make sure you're closing files after reading or writing them.
On Linux/Mac you can raise the limit temporarily with: ulimit -n 4096`,
  },
  {
    match: "EADDRINUSE",
    hint: `The port you're trying to listen on is already being used by something else.
Try a different port, or find and stop the process using it.
On Mac/Linux: lsof -i :<port>  |  On Windows: netstat -ano | findstr :<port>`,
  },
  {
    match: "EADDRNOTAVAIL",
    hint: `The address you're trying to bind to isn't available on this machine.
This usually means you're trying to listen on a specific IP that doesn't exist on this system.
Try using 0.0.0.0 or localhost instead.`,
  },
  {
    match: "MODULE_NOT_FOUND",
    hint: `Node can't find the module you're trying to import.
Check that the package is installed (npm install <package>), the name is spelled
correctly, and the file path is right if it's a local module.`,
  },

  // ─── Network ───────────────────────────────────────────────────
  {
    match: "ECONNREFUSED",
    hint: `Your app tried to connect to a server but the connection was refused.
The most common reason is that the target server isn't running.
Check that your database, API server, or service is actually started and listening on the right port.`,
  },
  {
    match: "ECONNRESET",
    hint: `The connection was forcibly closed by the other side before it finished.
This often happens with unstable network conditions, server timeouts, or a server that crashed mid-response.
Consider adding retry logic or checking the stability of the remote service.`,
  },
  {
    match: "ETIMEDOUT",
    hint: `The connection timed out — the remote server didn't respond in time.
This can be caused by a slow server, a firewall blocking the connection, or the server being overloaded.
Check your timeout settings and whether the remote host is reachable.`,
  },
  {
    match: "EPIPE: broken pipe",
    hint: `You're trying to write data to a connection that has already been closed.
This often happens in HTTP servers when the client disconnects before the response finishes.
Make sure you're checking if the connection is still open before writing.`,
  },
  {
    match: "EAI_AGAIN",
    hint: `DNS lookup failed — the hostname couldn't be resolved.
This usually means you're offline, the hostname is wrong, or your DNS server is unreachable.
Double-check the URL and your network connection.`,
  },
  {
    match: "EHOSTUNREACH",
    hint: `The host is unreachable — there's no network route to the target address.
Check that the IP or hostname is correct and that your machine can reach that network.`,
  },

  // ─── Promises / Async ──────────────────────────────────────────
  {
    match: "UnhandledPromiseRejection",
    hint: `A promise was rejected but nothing caught the error.
Add a .catch() to your promise chain, or wrap your await call in a try/catch block.`,
  },
  {
    match: /Cannot read.*of undefined.*async|async.*Cannot read.*of undefined/,
    hint: `This error happened inside an async function — the value you're reading is undefined.
Make sure you're awaiting the function that returns the data before trying to use it.
A missing 'await' keyword is a very common cause of this.`,
  },
];

function getHint(parsed) {
  const combined = `${parsed.type}: ${parsed.message}`;

  const found = hints.find((entry) => {
    if (typeof entry.match === "string") return combined.includes(entry.match);
    if (entry.match instanceof RegExp) return entry.match.test(combined);
    return false;
  });

  if (found) return found.hint;

  return `Double-check the line where this occurred and inspect the values involved
with console.log. The error type "${parsed.type}" usually means something
isn't what you expected it to be at that point in the code.`;
}

module.exports = { getHint };
