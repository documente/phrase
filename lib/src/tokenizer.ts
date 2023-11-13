import { prettyPrintError } from './error';

export interface Token {
  value: string;
  line: number;
  column: number;
}

/**
 * Tokenize a sentence.
 * @param {string} sentence - sentence to tokenize
 * @returns {Token[]} tokens
 */
export function tokenize(sentence: string): Token[] {
  const tokens: Token[] = [];

  let currentToken = '';
  let line = 1;
  let column = 1;
  let insideDoubleQuotes = false;

  function pushToken() {
    if (currentToken !== '') {
      tokens.push({
        value: currentToken,
        line,
        column: column - currentToken.length,
      });
      currentToken = '';
    }
  }

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];

    if (char === ' ' && !insideDoubleQuotes) {
      pushToken();
      column++;
    } else if (char === '\n') {
      if (insideDoubleQuotes) {
        throw new Error(
          prettyPrintError('Missing closing "', sentence, { line, column }),
        );
      }

      pushToken();
      line++;
      column = 1;
    } else if (char === '"') {
      currentToken += char;

      if (insideDoubleQuotes) {
        pushToken();
      }

      insideDoubleQuotes = !insideDoubleQuotes;
      column++;
    } else if (char === '/' && sentence[i + 1] === '/' && !insideDoubleQuotes) {
      pushToken();
      i = sentence.indexOf('\n', i);

      if (i === -1) {
        break;
      }

      line++;
      column = 1;
    } else {
      currentToken += char;
      column++;
    }
  }

  if (insideDoubleQuotes) {
    throw new Error(
      prettyPrintError('Missing closing "', sentence, { line, column }),
    );
  }

  pushToken();
  return tokens;
}
