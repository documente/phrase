export function prettyPrintError(errorMessage, sentence, location) {
  return `${errorMessage}\n${printErrorLineAndContent(
    sentence,
    location.line,
    location.column,
  )}`;
}

export function printErrorLineAndContent(sentence, line, column) {
  const lineContent = sentence.split('\n')[line - 1];
  const pointer = ' '.repeat(column - 1) + '^';
  return `Line ${line}, column ${column}:\n${lineContent}\n${pointer}`;
}
