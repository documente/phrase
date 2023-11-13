import {tokenize} from './tokenizer.js';
import {printErrorLineAndContent} from './error.js';
import {isQuoted} from './quoted-text.js';

/**
 * @typedef {Object} Action
 * @property {string[]} target - target path
 * @property {string[]} action - action name
 * @property {any[]} args - action arguments
 */

/**
 * @typedef {Object} Assertion
 * @property {string[]} target - target path
 * @property {string[]} assertion - assertion name
 */

/**
 * @typedef {Object} Sentence
 * @property {Action[]} actions - actions
 * @property {Assertion[]} assertions - assertions
 */

export class Parser {
  sentence = '';

  /**
   * @type {Token[]}
   */
  tokens = [];

  index = 0;

  get currentToken() {
    return this.tokens[this.index];
  }

  get currentValue() {
    return this.currentToken?.value;
  }

  /**
   * @param {string} sentence - sentence to parse
   * @returns {Sentence} parsed sentence
   */
  parse(sentence) {
    this.sentence = sentence;
    this.tokens = tokenize(sentence);
    this.index = 0;

    if (this.tokens.length === 0) {
      throw new Error('Empty sentence');
    }

    const prerequisite = this.parseGiven();
    this.consume('when', 'Expected "when"');
    const actions = this.parseActions();
    this.consume('then', 'Expected "then"');
    const assertions = this.parseAssertions();

    return {
      prerequisite,
      actions,
      assertions,
    };
  }

  parseGiven() {
    if (this.matches('given')) {
      this.index++;
      return this.parseActions();
    }

    return [];
  }

  parseActions() {
    const actions = [];

    while (!this.isAtEnd() && !this.matches('then', 'when')) {
      this.consumeOptional('I');
      const action = this.consumeAction();
      const args = this.consumeQuotedArg();

      let target = [];
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

  parseAssertions() {
    const assertions = [];

    while (!this.isAtEnd()) {
      const target = this.consumeTarget();
      this.consume('should', 'Expected "should"');
      const assertion = this.consumeAssertion();
      const args = this.isAtEnd() ? [] : this.consumeQuotedArg();

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

  consumeAssertion() {
    const assertion = [];

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

  matches(...candidates) {
    return candidates.includes(this.currentValue);
  }

  consumeQuotedArg() {
    const args = [];

    if (isQuoted(this.currentValue)) {
      args.push(this.currentToken);
      this.index++;
    }

    return args;
  }

  consumeTarget() {
    const target = [];

    while (
      !this.isAtEnd() &&
      !this.matches('when', 'then', 'and', 'should')
    ) {
      target.push(this.currentToken);
      this.index++;
    }

    return target;
  }

  consume(expectedTokenValue, errorMessage) {
    if (this.matches(expectedTokenValue)) {
      this.index++;
    } else {
      this.error(errorMessage);
    }
  }

  consumeOptional(expectedTokenValue) {
    if (this.matches(expectedTokenValue)) {
      this.index++;
    }
  }

  reject(rejectedStrings, errorMessage) {
    if (this.matches(...rejectedStrings)) {
      this.error(errorMessage);
    }
  }

  error(errorMessage) {
    throw new Error(errorMessage + '\n' + this.printErrorLocation());
  }

  printErrorLocation() {
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

  isAtEnd() {
    return this.index >= this.tokens.length;
  }
}
