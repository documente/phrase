export function isParsableAsNumber(value: string): boolean {
  if (value === '') {
    return false;
  }

  return !isNaN(Number(value));
}
