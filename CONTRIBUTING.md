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
├── server.js         # server mode – stays alive
├── src/
│   ├── parser.js     # extracts file, line, type from raw Error
│   ├── hints.js      # matches errors to hints (ordered array)
│   └── formatter.js  # renders the terminal output
└── test/             # (add your own test files)
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

### Testing your hint

Create a test file that triggers the error:

```js
// test/your-test.js
require("../index.js");

// code that throws the error you're targeting
```

Run it:

```bash
node test/your-test.js
```

Verify the correct hint appears.

## Code style

- 2 spaces indentation
- Semicolons where needed
- Comments for non‑obvious logic (see existing files)
- Keep functions small and single‑purpose

## Pull request checklist

- One logical change per PR
- Tested manually with a script that triggers the error
- No new dependencies
- No breaking changes without discussion

## Questions?

Open an issue or tag [@ZLouisMiguel](https://github.com/ZLouisMiguel) or any other listed maintainer.
