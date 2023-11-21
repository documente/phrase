// Splits a camelCase string into single-space separated words.
export function decamelize(str: string): string {
  return str
    .replace(/([^A-Z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter((t) => t.length > 0)
    .join(' ');
}
