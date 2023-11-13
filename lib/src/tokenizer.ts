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
    } else if (char === '\n' && !insideDoubleQuotes) {
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
    } else {
      currentToken += char;
      column++;
    }
  }

  pushToken();
  return tokens;
}
