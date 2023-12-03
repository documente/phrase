export function extractFunctionName(str: string) {
  return str.replace(/\([^)]*\)/, '');
}
