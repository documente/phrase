export interface CodeLocation {
  line: number;
  column: number;
}

export function prettyPrintError(
  errorMessage: string,
  sentence: string,
  location: CodeLocation,
): string {
  return `${errorMessage}\n${printErrorLineAndContent(
    sentence,
    location.line,
    location.column,
  )}`;
}

export function printErrorLineAndContent(
  sentence: string,
  line: number,
  column: number,
): string {
  const lineContent = sentence.split('\n')[line - 1];
  const pointer = ' '.repeat(column - 1) + '^';
  return `Line ${line}, column ${column}:\n${lineContent}\n${pointer}`;
}
