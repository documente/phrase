import { prettyPrintError } from './error';
import { Token } from './interfaces/token.interface';

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
  let isAtStartOfLine = true;

  const throwError = (message: string) => {
    throw new Error(prettyPrintError(message, sentence, { line, column }));
  };

  function pushToken() {
    if (currentToken !== '') {
      let kind: Token['kind'] = 'generic';

      if (currentToken === 'done' && isAtStartOfLine) {
        kind = 'done';
      } else if (currentToken === '-' && isAtStartOfLine) {
        kind = 'bullet';
      } else if (currentToken === ':') {
        kind = 'colon';
      }

      tokens.push({
        kind,
        value: currentToken,
        line,
        column: column - currentToken.length,
      });
      currentToken = '';
      isAtStartOfLine = false;
    }
  }

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];

    if (char === ' ' && !insideDoubleQuotes) {
      pushToken();
      column++;
    } else if (char === '\n') {
      if (insideDoubleQuotes) {
        throwError('Missing closing "');
      }

      pushToken();
      line++;
      column = 1;
      isAtStartOfLine = true;
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
      isAtStartOfLine = true;
    } else if (char === ':' && !insideDoubleQuotes) {
      pushToken();
      currentToken += char;
      column++;
      pushToken();
    } else {
      currentToken += char;
      column++;
    }
  }

  if (insideDoubleQuotes) {
    throwError('Missing closing "');
  }

  pushToken();
  return tokens;
}
