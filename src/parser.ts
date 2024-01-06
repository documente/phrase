import { tokenize } from './tokenizer';
import { printErrorLineAndContent } from './error';
import { isArgument } from './arguments';
import {
  ActionBlock,
  ActionStatement,
  AssertionBlock,
  AssertionStatement,
  Block,
  GivenWhenThenStatements,
  Statement,
  StatementSection,
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

  get previousToken(): Token {
    return this.tokens[this.index - 1];
  }

  get currentValue(): string | undefined {
    return this.currentToken?.value;
  }

  get currentKind(): Token['kind'] | undefined {
    return this.currentToken?.kind;
  }

  /**
   * @param {string} sentence - sentence to parse
   * @returns {GivenWhenThenStatements} parsed sentence
   */
  public parse(sentence: string): StatementSection[] {
    this.sentence = sentence;
    this.index = 0;

    const tokens = tokenize(sentence);

    if (tokens.length === 0) {
      throw new Error('Empty sentence');
    }

    const tokenSections: Token[][] = this.splitTokensIntoSections(tokens);

    const statementSections: StatementSection[] = [];

    for (const tokenSection of tokenSections) {
      this.tokens = tokenSection;
      this.index = 0;

      const delimiter = this.getCurrentAsDelimiter();

      switch (delimiter) {
        case Delimiter.GIVEN:
        case Delimiter.WHEN:
          statementSections.push(this.parseGivenWhenThen());
          break;
        case Delimiter.FOR:
        case Delimiter.IN_ORDER_TO:
          statementSections.push(this.parseBlock());
          break;
        default:
          throw new Error('Unreachable code.');
      }
    }

    return statementSections;
  }

  private parseGivenWhenThen(): GivenWhenThenStatements {
    const startIndex = this.currentToken.index;
    const given = this.parseGiven();
    const when = this.parseWhen();
    const then = this.parseThen();

    return {
      kind: 'given-when-then',
      given,
      when,
      then,
      source: this.getSource(startIndex),
    };
  }

  private parseBlock(): Block {
    const startIndex = this.currentToken.index;
    const fullHeader = this.consumeBlockHeader();

    if (this.isActionBlockHeader(fullHeader)) {
      if (fullHeader.length <= 3) {
        this.error(
          'Missing action name. Block header must follow "In order to ..." structure.',
        );
      }

      return {
        kind: 'action-block',
        header: fullHeader.slice(3),
        body: this.parseBullets(),
        source: this.getSource(startIndex),
      } satisfies ActionBlock;
    } else {
      const indexOfTo = fullHeader.findIndex(
        (t) => t.value.toLowerCase() === 'to',
      );

      if (indexOfTo === -1) {
        this.error(
          'Unexpected block header. Block header must start with "In order to" or follow "For ... to ..." structure.',
        );
      }

      if (fullHeader.length <= indexOfTo + 1) {
        this.error(
          'Missing assertion name. Block header must follow "For ... to ..." structure.',
        );
      }

      return {
        kind: 'assertion-block',
        header: fullHeader.slice(indexOfTo + 1),
        body: this.parseBullets(),
        source: this.getSource(startIndex),
      } satisfies AssertionBlock;
    }
  }

  private getSource(startIndex: number): string {
    return this.sentence.slice(
      startIndex,
      this.previousToken.index + this.previousToken.value.length,
    );
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
    this.consume('then', 'Expected "then"');
    return this.parseAssertions();
  }

  private isActionBlockHeader(fullHeader: Token[]): boolean {
    return fullHeader
      .map((token) => token.value)
      .join(' ')
      .toLowerCase()
      .startsWith('in order to');
  }

  parseStatements(): Statement[] {
    const statements: Statement[] = [];

    while (
      !this.isAtEnd() &&
      !this.matches('given', 'when', 'then') &&
      !this.matchesKind('bullet')
    ) {
      statements.push(this.parseStatement());

      if (this.matches('and') || this.matchesKind('bullet')) {
        this.index++;
      } else {
        break;
      }
    }

    if (statements.length === 0) {
      this.error('Missing statement');
    }

    return statements;
  }

  private parseAssertions(): Statement[] {
    const statements = this.parseStatements();

    if (statements.some((s) => s.kind !== 'assertion')) {
      this.error('Expected assertion');
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
    const { tokensBeforeShould, tokensAfterShould, foundShould } =
      this.extractAssertionOrSystemStateChangeTokens();

    if (foundShould) {
      return this.buildAssertionStatement(
        tokensAfterShould,
        tokensBeforeShould,
        tokensBeforeShould[0]?.index ?? tokensAfterShould[0].index,
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
      !this.matchesKind('bullet')
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
    tokensBeforeShould: Token[],
  ): SystemLevelStatement {
    const tokens = tokensBeforeShould.filter(
      (token) => !isArgument(token.value),
    );
    const args = tokensBeforeShould.filter((token) => isArgument(token.value));
    return {
      kind: 'system-level',
      tokens,
      args,
      index: tokens[0].index,
    } satisfies SystemLevelStatement;
  }

  private buildAssertionStatement(
    tokensAfterShould: Token[],
    tokensBeforeShould: Token[],
    index: number,
  ): AssertionStatement {
    if (tokensAfterShould.length === 0) {
      this.error('Missing assertion');
    }

    return {
      kind: 'assertion',
      target: tokensBeforeShould,
      assertion: tokensAfterShould,
      firstToken: tokensAfterShould[0],
      index,
    } satisfies AssertionStatement;
  }

  private parseActionStatement(): ActionStatement {
    const tokens = this.consumeAction();

    return {
      kind: 'action',
      tokens,
      index: tokens[0].index,
    } satisfies ActionStatement;
  }

  consumeAction(): Token[] {
    const action = [];

    while (
      !this.isAtEnd() &&
      !this.matches('then', 'when', 'and') &&
      !this.matchesKind('bullet')
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

  matches(...candidates: (string | string[])[]): boolean {
    const currentValue = this.currentValue;

    if (!currentValue) {
      return false;
    }

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        if (this.nextTokensMatch(candidate)) {
          return true;
        }
      } else {
        if (candidate.toLowerCase() === currentValue.toLowerCase()) {
          return true;
        }
      }
    }

    return false;
  }

  matchesKind(...kinds: Token['kind'][]): boolean {
    return kinds.includes(this.currentKind!);
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

  rejectKind(rejectedKinds: Token['kind'][], errorMessage: string): void {
    if (this.matchesKind(...rejectedKinds)) {
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
      this.rejectKind(['bullet'], 'Unexpected bullet in block header');
      blockName.push(this.currentToken);
      this.index++;
    }

    if (blockName.length === 0) {
      this.error('Missing block name');
    }

    return blockName;
  }

  parseBullets(): Statement[] {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      if (this.matchesKind('bullet')) {
        this.index++;
        statements.push(this.parseStatement());
      } else {
        this.index++;
      }
    }

    return statements;
  }

  private nextTokensMatch(values: string[]): boolean {
    for (let i = 0; i < values.length; i++) {
      if (this.tokens[this.index + i].value.toLowerCase() !== values[i]) {
        return false;
      }
    }

    return true;
  }

  private splitTokensIntoSections(tokens: Token[]): Token[][] {
    this.tokens = tokens;

    if (!this.isPotentialSectionStart()) {
      this.error(
        'Missing section start. A section should start with "Given", "When", "For", or "In order to"',
      );
    }

    const tokenSections: Token[][] = [];
    let currentSection: Token[] = [];

    let previousDelimiter: Delimiter | null = null;

    while (!this.isAtEnd()) {
      const currentDelimiter = this.getCurrentAsDelimiter();

      if (currentDelimiter != null) {
        if (previousDelimiter != null) {
          const validDelimiters = delimiterTransitions[
            previousDelimiter
          ] as Readonly<Delimiter[]>;

          if (!validDelimiters.includes(currentDelimiter)) {
            this.error(
              `Unexpected delimiter. Expected ${validDelimiters.join(', ')}`,
            );
          }
        }

        const isGivenToWhen =
          previousDelimiter === Delimiter.GIVEN &&
          currentDelimiter === Delimiter.WHEN;

        if (this.isPotentialSectionStart() && !isGivenToWhen) {
          if (currentSection.length > 0) {
            tokenSections.push(currentSection);
          }

          currentSection = [];
        }

        previousDelimiter = currentDelimiter;
      }

      currentSection.push(this.currentToken);
      this.index++;
    }

    if (currentSection.length > 0) {
      tokenSections.push(currentSection);
    }

    return tokenSections;
  }

  private getCurrentAsDelimiter(): Delimiter | null {
    if (this.currentToken == null) {
      return null;
    } else if (this.matches('given')) {
      return Delimiter.GIVEN;
    } else if (this.matches('when')) {
      return Delimiter.WHEN;
    } else if (this.matches('then')) {
      return Delimiter.THEN;
    } else if (this.matches('for')) {
      return Delimiter.FOR;
    } else if (this.matches(['in', 'order', 'to'])) {
      return Delimiter.IN_ORDER_TO;
    } else {
      return null;
    }
  }

  private isPotentialSectionStart(): boolean {
    const currentDelimiter = this.getCurrentAsDelimiter();

    if (currentDelimiter == null) {
      return false;
    }

    return ALL_STARTER_DELIMITERS.includes(currentDelimiter);
  }
}

enum Delimiter {
  GIVEN = 'GIVEN',
  WHEN = 'WHEN',
  THEN = 'THEN',
  FOR = 'FOR',
  IN_ORDER_TO = 'IN_ORDER_TO',
}

const ALL_STARTER_DELIMITERS: Delimiter[] = [
  Delimiter.GIVEN,
  Delimiter.WHEN,
  Delimiter.FOR,
  Delimiter.IN_ORDER_TO,
];

const delimiterTransitions: Record<Delimiter, Readonly<Delimiter[]>> = {
  GIVEN: [Delimiter.WHEN],
  WHEN: [Delimiter.THEN],
  THEN: ALL_STARTER_DELIMITERS,
  FOR: ALL_STARTER_DELIMITERS,
  IN_ORDER_TO: ALL_STARTER_DELIMITERS,
};
