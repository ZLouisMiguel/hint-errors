/**
 * @fileoverview ESM entry point shim. hint-errors' actual implementation
 * lives in index.js (CommonJS) — this file re-exports it so projects using
 * `"type": "module"` or `import` syntax can `import "hint-errors"` /
 * `import { addHint } from "hint-errors"` without needing createRequire()
 * workarounds. Importing this module triggers the same side effects as
 * requiring index.js (registering the uncaughtException/unhandledRejection
 * listeners), since Node evaluates the underlying CommonJS module either way.
 */
import hintErrors from "./index.js";

export default hintErrors;
export const addHint = hintErrors.addHint;