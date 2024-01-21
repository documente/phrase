export function isQuoted(str: string): boolean {
  return hasBoundary(str, '"') || hasBoundary(str, "'");
}

function hasBoundary(str: string, boundary: string): boolean {
  return str.startsWith(boundary) && str.endsWith(boundary);
}

export function unquoted(str: string): string {
  if (isQuoted(str)) {
    return str.slice(1, -1);
  } else {
    return str;
  }
}
