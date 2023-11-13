export function isQuoted(str) {
  return hasBoundary(str, '"') || hasBoundary(str, "'");
}

function hasBoundary(str, boundary) {
  return str.startsWith(boundary) && str.endsWith(boundary);
}

export function unquoted(str) {
  if (isQuoted(str)) {
    return str.slice(1, -1);
  } else {
    return str;
  }
}
