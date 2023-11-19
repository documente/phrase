import { tokenize } from './tokenizer';
import { printErrorLineAndContent } from './error';
import { isQuoted } from './quoted-text';
import { isArgument } from './arguments';
import {
  ActionBlock,
  ActionStatement,
  AssertionStatement,
  Block,
  ParsedSentence,
  Statement,
  SystemLevelStatement,
} from './interfaces/statements.interface';
import { Token } from './interfaces/token.interface';

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

  get currentKind(): Token['kind'] {
    return this.currentToken?.kind;
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

    const parsedSentence: ParsedSentence = {
      given: this.parseGiven(),
      when: this.parseWhen(),
      then: this.parseThen(),
      blocks: this.parseBlocks(),
    };

    if (!this.isAtEnd()) {
      this.error(`Unexpected "${this.currentValue}"`);
    }

    return parsedSentence;
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

  parseBlocks(): Block[] {
    if (this.isAtEnd() || !this.matchesKind('done')) {
      return [];
    }

    this.consumeKind('done', 'Expected "done"');

    const blocks: Block[] = [];

    while (!this.isAtEnd()) {
      const header = this.consumeBlockHeader();
      const body = this.parseBullets();
      blocks.push({
        kind: 'action',
        header,
        body,
      } satisfies ActionBlock);

      if (this.matchesKind('done')) {
        this.index++;
      } else {
        break;
      }
    }

    return blocks;
  }

  parseStatements(): Statement[] {
    const statements: Statement[] = [];

    while (
      !this.isAtEnd() &&
      !this.matches('given', 'when', 'then') &&
      !this.matchesKind('bullet', 'done')
    ) {
      statements.push(this.parseStatement());

      if (this.matches('and') || this.matchesKind('bullet')) {
        this.index++;
      } else {
        break;
      }
    }

    return statements;
  }

  private parseStatement(): Statement {
    if (this.matches('I')) {
      this.index++;
      return this.parseActionStatement();
    } else {
      return this.parseAssertionOrSystemStateChangeStatement();
    }
  }

  private parseAssertionOrSystemStateChangeStatement():
    | SystemLevelStatement
    | AssertionStatement {
    let { tokensBeforeShould, tokensAfterShould, foundShould } =
      this.extractAssertionOrSystemStateChangeTokens();

    if (foundShould) {
      return this.buildAssertionStatement(
        tokensAfterShould,
        tokensBeforeShould,
      );
    } else {
      return this.buildSystemStateChangeStatement(tokensBeforeShould);
    }
  }

  private extractAssertionOrSystemStateChangeTokens(): {
    tokensBeforeShould: Token[];
    tokensAfterShould: Token[];
    foundShould: boolean;
  } {
    const tokensBeforeShould = [];
    const tokensAfterShould = [];
    let foundShould = false;

    while (
      !this.isAtEnd() &&
      !this.matches('given', 'when', 'then', 'and') &&
      !this.matchesKind('bullet', 'done')
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
    return { tokensBeforeShould, tokensAfterShould, foundShould };
  }

  private buildSystemStateChangeStatement(
    tokensBeforeShould: any[],
  ): SystemLevelStatement {
    const tokens = tokensBeforeShould.filter(
      (token) => !isArgument(token.value),
    );
    const args = tokensBeforeShould.filter((token) => isArgument(token.value));
    return {
      kind: 'system-level',
      tokens,
      args,
    } satisfies SystemLevelStatement;
  }

  private buildAssertionStatement(
    tokensAfterShould: any[],
    tokensBeforeShould: any[],
  ): AssertionStatement {
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
      !this.matchesKind('bullet', 'done') &&
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

  matchesKind(...kinds: Token['kind'][]): boolean {
    return kinds.includes(this.currentKind);
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

    while (
      !this.isAtEnd() &&
      !this.matches('when', 'then', 'and', 'should') &&
      !this.matchesKind('bullet', 'done')
    ) {
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

  consumeKind(expectedKind: Token['kind'], errorMessage: string): void {
    if (this.matchesKind(expectedKind)) {
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

  private consumeBlockHeader(): Token[] {
    const blockName = [];

    while (!this.isAtEnd() && !this.matchesKind('colon')) {
      blockName.push(this.currentToken);
      this.index++;
    }

    return blockName;
  }

  parseBullets(): Statement[] {
    const statements: Statement[] = [];

    while (!this.isAtEnd() && !this.matches('done')) {
      if (this.matchesKind('bullet')) {
        this.index++;
        statements.push(this.parseStatement());
      } else {
        this.index++;
      }
    }

    return statements;
  }
}
