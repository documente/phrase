import {tokenize} from './tokenizer';
import {printErrorLineAndContent} from './error';
import {isQuoted} from './quoted-text';
import {isArgument} from './arguments';
import {
  ActionStatement,
  AssertionStatement,
  ParsedSentence,
  Statement,
  SystemLevelStatement,
} from './interfaces/statements.interface';
import {Token} from './interfaces/token.interface';

export class Parser {
  sentence = '';
  tokens: Token[] = [];
  index = 0;

  get currentToken(): Token {
    return this.tokens[this.index];
  }

  get currentValue(): string {
    return this.currentToken?.value;
  }

  /**
   * @param {string} sentence - sentence to parse
   * @returns {ParsedSentence} parsed sentence
   */
  parse(sentence: string): ParsedSentence {
    this.sentence = sentence;
    this.tokens = tokenize(sentence);
    this.index = 0;

    if (this.tokens.length === 0) {
      throw new Error('Empty sentence');
    }

    return {
      given: this.parseGiven(),
      when: this.parseWhen(),
      then: this.parseThen(),
      blocks: {},
    };
  }

  parseGiven(): Statement[] {
    if (this.matches('given')) {
      this.index++;
      return this.parseStatements();
    }

    return [];
  }

  parseWhen(): Statement[] {
    this.consume('when', 'Expected "when"');
    return this.parseStatements();
  }

  parseThen(): Statement[] {
    this.consume('then', 'Expected "when"');
    return this.parseStatements();
  }

  parseStatements(): Statement[] {
    const statements: Statement[] = [];

    while (!this.isAtEnd() && !this.matches('given', 'when', 'then', '>')) {
      if (this.matches('I')) {
        this.index++;
        statements.push(this.parseActionStatement());
      } else {
        statements.push(this.parseAssertionOrSystemStateChangeStatement());
      }

      if (!this.matches('and')) {
        break;
      } else {
        this.index++;
      }
    }

    return statements;
  }

  private parseAssertionOrSystemStateChangeStatement():
      | SystemLevelStatement
      | AssertionStatement {
    const tokensBeforeShould = [];
    const tokensAfterShould = [];
    let foundShould = false;

    while (
        !this.isAtEnd() &&
        !this.matches('given', 'when', 'then', 'and', '>')
        ) {
      if (this.matches('should')) {
        foundShould = true;
      } else {
        if (foundShould) {
          tokensAfterShould.push(this.currentToken);
        } else {
          tokensBeforeShould.push(this.currentToken);
        }
      }

      this.index++;
    }

    if (foundShould) {
      const assertion = tokensAfterShould.filter(
          (token) => !isArgument(token.value),
      );
      const args = tokensAfterShould.filter((token) => isArgument(token.value));
      return {
        kind: 'assertion',
        target: tokensBeforeShould,
        assertion,
        args,
        firstToken: tokensAfterShould[0],
      } satisfies AssertionStatement;
    } else {
      const tokens = tokensBeforeShould.filter(
          (token) => !isArgument(token.value),
      );
      const args = tokensBeforeShould.filter((token) =>
          isArgument(token.value),
      );
      return {
        kind: 'system-level',
        tokens,
        args,
      } satisfies SystemLevelStatement;
    }
  }

  private parseActionStatement(): ActionStatement {
    const action = this.consumeActionName();
    const args = this.consumeQuotedArg();

    let target: Token[] = [];
    if (this.matches('on')) {
      this.index++;
      target = this.consumeTarget();
    }

    return {
      kind: 'action',
      target,
      action,
      args,
    } satisfies ActionStatement;
  }

  consumeActionName() {
    const action = [];

    while (
        !this.isAtEnd() &&
        !this.matches('on', 'then', 'when', 'and') &&
        !isQuoted(this.currentValue)
        ) {
      this.reject(['I'], 'Unexpected "I" in action name');
      action.push(this.currentToken);
      this.index++;
    }

    if (action.length === 0) {
      this.error('Missing action');
    }

    return action;
  }

  matches(...candidates: string[]): boolean {
    return candidates.includes(this.currentValue);
  }

  consumeQuotedArg(): Token[] {
    const args = [];

    if (isQuoted(this.currentValue)) {
      args.push(this.currentToken);
      this.index++;
    }

    return args;
  }

  consumeTarget(): Token[] {
    const target = [];

    while (!this.isAtEnd() && !this.matches('when', 'then', 'and', 'should')) {
      target.push(this.currentToken);
      this.index++;
    }

    return target;
  }

  consume(expectedTokenValue: string, errorMessage: string): void {
    if (this.matches(expectedTokenValue)) {
      this.index++;
    } else {
      this.error(errorMessage);
    }
  }

  reject(rejectedStrings: string[], errorMessage: string): void {
    if (this.matches(...rejectedStrings)) {
      this.error(errorMessage);
    }
  }

  error(errorMessage: string): void {
    throw new Error(errorMessage + '\n' + this.printErrorLocation());
  }

  printErrorLocation(): string {
    if (this.isAtEnd()) {
      const line = this.sentence.split('\n').length;
      const column = this.sentence.split('\n')[line - 1].length + 1;
      return printErrorLineAndContent(this.sentence, line, column);
    } else {
      const line = this.currentToken.line;
      const column = this.currentToken.column;
      return printErrorLineAndContent(this.sentence, line, column);
    }
  }

  isAtEnd(): boolean {
    return this.index >= this.tokens.length;
  }
}
