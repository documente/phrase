import { Token, tokenize } from './tokenizer';
import { printErrorLineAndContent } from './error';
import { isQuoted } from './quoted-text';
import { isArgument } from './arguments';

export interface ActionStatement {
  kind: 'action';
  target: Token[];
  action: Token[];
  args: any[];
}

export interface AssertionStatement {
  kind: 'assertion';
  target: Token[];
  assertion: Token[];
  args: Token[];
  shouldToken: Token;
}

export interface SystemLevelStatement {
  kind: 'system-level';
  tokens: Token[];
  args: Token[];
}

export interface Sentence {
  prerequisites: (ActionStatement | SystemLevelStatement)[];
  actions: ActionStatement[];
  assertions: AssertionStatement[];
}

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
   * @returns {Sentence} parsed sentence
   */
  parse(sentence: string): Sentence {
    this.sentence = sentence;
    this.tokens = tokenize(sentence);
    this.index = 0;

    if (this.tokens.length === 0) {
      throw new Error('Empty sentence');
    }

    const prerequisites = this.parseGiven();
    this.consume('when', 'Expected "when"');
    const actions = this.parseActions();
    this.consume('then', 'Expected "then"');
    const assertions = this.parseAssertions();

    return {
      prerequisites,
      actions,
      assertions,
    };
  }

  parseGiven(): (ActionStatement | SystemLevelStatement)[] {
    if (this.matches('given')) {
      this.index++;
      return this.parseActionOrSystemLevelStatements();
    }

    return [];
  }

  parseActionOrSystemLevelStatements(): (ActionStatement | SystemLevelStatement)[] {
    const statements: (ActionStatement | SystemLevelStatement)[] = [];

    while (!this.isAtEnd() && !this.matches('then', 'when')) {
      if (this.matches('I')) {
        this.index++;
        const action = this.consumeAction();
        const args = this.consumeQuotedArg();

        let target: Token[] = [];
        if (this.matches('on')) {
          this.index++;
          target = this.consumeTarget();
        }

        statements.push({
          kind: 'action',
          target,
          action,
          args,
        });
      } else {
        const tokens = [];
        const args = [];

        while (!this.isAtEnd() && !this.matches('then', 'when', 'and')) {
          if (isArgument(this.currentToken.value)) {
            args.push(this.currentToken);
          } else {
            tokens.push(this.currentToken);
          }

          this.index++;
        }

        statements.push({
          kind: 'system-level',
          tokens,
          args,
        });
      }

      if (!this.matches('and')) {
        break;
      } else {
        this.index++;
      }
    }

    return statements;
  }

  parseActions(): ActionStatement[] {
    const actions: ActionStatement[] = [];

    while (!this.isAtEnd() && !this.matches('then', 'when')) {
      this.consumeOptional('I');
      const action = this.consumeAction();
      const args = this.consumeQuotedArg();

      let target: Token[] = [];
      if (this.matches('on')) {
        this.index++;
        target = this.consumeTarget();
      }

      actions.push({
        kind: 'action',
        target,
        action,
        args,
      });

      if (!this.matches('and')) {
        break;
      } else {
        this.index++;
      }
    }

    return actions;
  }

  consumeAction() {
    const action = [];

    while (
      !this.isAtEnd() &&
      !this.matches('on', 'then') &&
      !isQuoted(this.currentValue)
    ) {
      this.reject(['I', 'and', 'when'], 'Expected action');
      action.push(this.currentToken);
      this.index++;
    }

    if (action.length === 0) {
      this.error('Missing action');
    }

    return action;
  }

  parseAssertions(): AssertionStatement[] {
    const assertions: AssertionStatement[] = [];

    while (!this.isAtEnd()) {
      const target = this.consumeTarget();
      const shouldToken = this.consume('should', 'Expected "should"');
      const { assertion, args } = this.consumeAssertion();

      assertions.push({
        kind: 'assertion',
        target,
        assertion,
        args,
        shouldToken,
      });

      if (!this.matches('and')) {
        break;
      } else {
        this.index++;
      }
    }

    if (assertions.length === 0) {
      this.error('Missing assertion');
    }

    return assertions;
  }

  consumeAssertion(): { assertion: Token[]; args: Token[] } {
    const assertion: Token[] = [];
    const args: Token[] = [];

    while (!this.isAtEnd() && !this.matches('on', 'then', 'and')) {
      this.reject(['I', 'and', 'when', 'then'], 'Expected assertion');

      if (isArgument(this.currentToken.value)) {
        args.push(this.currentToken);
      } else {
        assertion.push(this.currentToken);
      }

      this.index++;
    }

    if (assertion.length === 0) {
      this.error('Missing assertion');
    }

    return { assertion, args };
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

  consume(expectedTokenValue: string, errorMessage: string): Token {
    if (this.matches(expectedTokenValue)) {
      const token = this.currentToken;
      this.index++;
      return token;
    } else {
      this.error(errorMessage);
    }

    // To avoid typing error...
    throw new Error('Unreachable');
  }

  consumeOptional(expectedTokenValue: string): void {
    if (this.matches(expectedTokenValue)) {
      this.index++;
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
