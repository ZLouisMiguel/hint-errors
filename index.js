function isWDS(string) {
  if (string.length > 3) return false;
  return string.toUpperCase() === "WDS" || string.toLowerCase() === "wds";
}

module.exports = isWDS;
