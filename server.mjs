/**
 * @fileoverview ESM entry point shim for server mode. See index.mjs for the
 * rationale — this re-exports server.js (CommonJS) so projects using
 * `"type": "module"` can `import "hint-errors/server"` directly.
 */
import hintErrors from "./server.js";

export default hintErrors;
export const addHint = hintErrors.addHint;
