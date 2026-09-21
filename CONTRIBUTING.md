# Contributing to hint-errors

Thanks for helping make error messages suck less.

## Getting started

```bash
git clone https://github.com/ZLouisMiguel/hint-errors.git
cd hint-errors
npm install
```

## How to contribute

- **Report bugs** – open an issue with the error you got and what you expected
- **Add a hint** – see "Adding a new hint" below
- **Improve existing hints** – clearer wording, better examples, more accurate advice
- **Fix a bug** – open a PR with a clear description

## Project structure

```
hint-errors/
├── index.js          # default entry – exits after hint
├── server.js         # server entry – formats, flushes, then exits safely
├── src/
│   ├── parser.js     # extracts file, line, type from raw Error
│   ├── hints.js      # matches errors to hints (ordered array)
│   └── formatter.js  # renders the terminal output
├── docs/
│   └── app.js         # interactive demo site – HINTS_DATA must mirror src/hints.js
└── test/             # test suite – run with `npm test`
```

## Adding a new hint

Hints live in `src/hints.js` inside the `hints` array. The array is ordered from most specific to most generic – first match wins.

### Hint structure

```js
{
  match: string | RegExp,
  hint: string
}
```

- `match` – text or regex that appears in `TypeError: actual message`
- `hint` – advice to show the developer. Keep it actionable and concise.

### Example

```js
{
  match: "Cannot read properties of undefined",
  hint: `You're trying to access a property on something that doesn't exist yet.
Check that the value is defined before you use it.`
}
```

### Where to insert

- New **specific** hints go **above** more generic ones that would also match.
- For a new `TypeError` about a specific method, put it above the generic `"is not a function"` entry.

### Update the demo site too

The guide site's gallery/playground (`docs/app.js`) keeps its own copy of every
hint in a `HINTS_DATA` array, grouped by category. Whenever you add, remove,
or reword a hint in `src/hints.js`, mirror the same change in `HINTS_DATA` —
`test/docs-sync.test.js` checks that the two stay in exact sync (same hint
texts, no duplicates) and will fail the build if they drift apart.

### Testing your hint

Create a test file that triggers the error:

```js
// test/your-test.js
require("../index.js");

// code that throws the error you're targeting
```

Run the whole suite:

```bash
npm test
```

Any `*.test.js` file inside `test/` is picked up automatically by the
zero-dependency runner (`test/run.js`). Add one `test(...)` block per
assertion — the runner prints a pass/fail report and exits non-zero on failure.
This also runs `test/docs-sync.test.js`, so a forgotten `docs/app.js` update
shows up as a test failure rather than a silent drift.
Manually verify the correct hint appears for a quick check while writing it.

## Code style

- 2 spaces indentation
- Semicolons where needed
- Comments for non‑obvious logic (see existing files)
- Keep functions small and single‑purpose

## Pull request checklist

- One logical change per PR
- Tested manually with a script that triggers the error
- `docs/app.js` updated if `src/hints.js` changed
- No new dependencies
- No breaking changes without discussion

## Questions?

Open an issue or tag [@ZLouisMiguel](https://github.com/ZLouisMiguel) or any other listed maintainer.
