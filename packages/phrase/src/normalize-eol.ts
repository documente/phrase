export function normalizeEOL(inputString: string) {
  // Use a regular expression to match all Windows-style EOL (\r\n) and replace with Linux-style EOL (\n)
  return inputString.replace(/\r\n/g, '\n');
}
