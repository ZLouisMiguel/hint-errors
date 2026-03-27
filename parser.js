// Error parsing function

function parseError(err) { 

//check if the received parameter is really a node error from base class Error

  if (!(err instanceof Error)) {
    return {
      type: "Error",
      message: String(err),
      file: null,
      line: null,
      raw: err,
    };
  }
// error data we'll be working with, the type( name of the error), message, relevant frames from stack trace
  const type = err.name || "Error";
  const message = err.message?.trim() || "An unknown error occured";

  const stackLines = (err.stack || "").split("\n");

  const relevantFrames = stackLines.filter((line) => {
    line.includes("    at ") &&
      !line.includes("node: internal") &&
      !line.includes("node_modules") &&
      !line.includes("(<anonymous>)");
  });

  const firstFrame = relevantFrames[0] || "";

  const match = firstFrame.match(/\((.+):(\d+):(\d+)\)/);

  const file = match ? match[1] : null;
  const line = match ? match[2] : null;

  return {
    type,
    message,
    file,
    line,
    raw: err,
  };
}

module.exports = { parseError };
