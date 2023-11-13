import { Token, tokenize } from './tokenizer';
import { printErrorLineAndContent } from './error';
import { isQuoted } from './quoted-text';

export interface Action {
  target: Token[];
  action: Token[];
  args: any[];
}

export interface Assertion {
  target: Token[];
  assertion: Token[];
  args: Token[];
}

export interface Sentence {
  prerequisites: Action[];
  actions: Action[];
  assertions: Assertion[];
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

  parseGiven(): Action[] {
    if (this.matches('given')) {
      this.index++;
      return this.parseActions();
    }

    return [];
  }

  parseActions(): Action[] {
    const actions = [];

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
        target,
        action,
        args,
      });

      this.consumeOptional('and');
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

  parseAssertions(): Assertion[] {
    const assertions: Assertion[] = [];

    while (!this.isAtEnd()) {
      const target = this.consumeTarget();
      this.consume('should', 'Expected "should"');
      const assertion = this.consumeAssertion();
      const args: Token[] = this.isAtEnd() ? [] : this.consumeQuotedArg();

      assertions.push({
        target,
        assertion,
        args,
      });

      this.consumeOptional('and');
    }

    if (assertions.length === 0) {
      this.error('Missing assertion');
    }

    return assertions;
  }

  consumeAssertion(): Token[] {
    const assertion: Token[] = [];

    while (
      !this.isAtEnd() &&
      !this.matches('on', 'then', 'and') &&
      !isQuoted(this.currentValue)
    ) {
      this.reject(['I', 'and', 'when', 'then'], 'Expected assertion');
      assertion.push(this.currentToken);
      this.index++;
    }

    if (assertion.length === 0) {
      this.error('Missing assertion');
    }

    return assertion;
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
