//hint.js mapping errors to a specific hint on what to do

const hints = [
  // ─── TypeErrors ────────────────────────────────────────────────
  {
    match: "Cannot read properties of undefined",
    hint: `You're trying to access a property on something that doesn't exist yet.
Check that the value is defined before you use it, a quick console.log
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
Trace back where this value comes from something returned null that should have returned an object.`,
  },
  {
    match: "Converting circular structure to JSON",
    hint: `You're passing an object that references itself into JSON.stringify().
This often happens with objects that have parent/child references.
Consider using a replacer function, or a library like flatted.`,
  },

  // ─── ReferenceErrors ───────────────────────────────────────────
  {
    match: "is not defined",
    hint: `You're using a variable or function that hasn't been declared yet.
Check for typos in the name, make sure it's in scope, and that the
file or module it lives in has been imported correctly.`,
  },

  // ─── SyntaxErrors ──────────────────────────────────────────────
  {
    match: "Unexpected token",
    hint: `Node hit something it didn't expect while reading your code.
This is usually a missing bracket, comma, or parenthesis somewhere nearby.
Check the line above the one reported the real mistake is often one line up.`,
  },
  {
    match: "Unexpected end of input",
    hint: `Your code ends before it should something was opened but never closed.
Look for an unclosed bracket {}, parenthesis (), or array [].`,
  },
  {
    match: "Invalid or unexpected token",
    hint: `There's a character in your code that doesn't belong there.
A common cause is a stray symbol, a smart quote instead of a regular quote,
or a copy-paste from a source that included hidden characters.`,
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
Try checking the file's permissions, or if you're on Linux/Mac, run: ls -la <path>`,
  },
  {
    match: "EADDRINUSE",
    hint: `The port you're trying to listen on is already being used by something else.
Try a different port, or find and stop the process using it with: lsof -i :<port>`,
  },
  {
    match: "MODULE_NOT_FOUND",
    hint: `Node can't find the module you're trying to import.
Check that the package is installed (npm install <package>), the name is spelled
correctly, and the file path is right if it's a local module.`,
  },

  // ─── Promises / Async ──────────────────────────────────────────
  {
    match: "UnhandledPromiseRejection",
    hint: `A promise was rejected but nothing caught the error.
Add a .catch() to your promise chain, or wrap your await call in a try/catch block.`,
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
