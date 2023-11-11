import { tokenize } from './tokenizer.js';

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

    this.consume('when', 'Expected "when"');

    // consume actions
    const actions = this.parseActions();

    return {
      actions,
      assertions: [],
    };
  }

  parseActions() {
    const actions = [];
    let currentAction = [];
    let currentTarget = [];
    let currentArgs = [];

    this.consumeOptional('I');

    while (
      this.index < this.tokens.length &&
      !['then', 'and', 'on'].includes(this.tokens[this.index].value) &&
      !isQuoted(this.tokens[this.index].value)
    ) {
      currentAction.push(this.tokens[this.index]);
      this.index++;
    }

    if (isQuoted(this.tokens[this.index]?.value)) {
      currentArgs.push(this.tokens[this.index]);
      this.index++;
    }

    if (this.tokens[this.index]?.value === 'on') {
      this.index++;

      while (
        this.index < this.tokens.length &&
        !['then', 'and'].includes(this.tokens[this.index].value) &&
        !isQuoted(this.tokens[this.index].value)
      ) {
        currentTarget.push(this.tokens[this.index]);
        this.index++;
      }
    }

    actions.push({
      target: currentTarget,
      action: currentAction,
      args: currentArgs,
    });
    return actions;
  }

  // private parseAction(): Action {
  //   this.consume('I', 'Expected "I"');
  //
  //   const actionKind = this.tokens[this.index];
  //   this.index++;
  //
  //   if (this.tokens[this.index] === 'on') {
  //     this.index++;
  //   } else {
  //     throw new Error('Expected "on" but got ' + this.tokens[this.index]);
  //   }
  //
  //   const targetPath: string[] = [];
  //
  //   while (this.index < this.tokens.length
  //   && !['and', 'then'].includes(this.tokens[this.index])
  //   && !isQuoted(this.tokens[this.index])) {
  //     targetPath.push(this.tokens[this.index]);
  //     this.index++;
  //   }
  //
  //   const args: any[] = [];
  //
  //   if (this.index < this.tokens.length && isQuoted(this.tokens[this.index])) {
  //     args.push(this.tokens[this.index].slice(1, -1));
  //     this.index++;
  //   }
  //
  //   if (this.tokens[this.index] === 'then') {
  //     this.foundThen = true;
  //     this.index++;
  //   }
  //
  //   if (this.tokens[this.index] === 'and') {
  //     this.index++;
  //   }
  //
  //   return {
  //     target: targetPath,
  //     action: [actionKind],
  //     args,
  //   };
  // }

  consume(expectedTokenValue, errorMessage) {
    if (this.tokens[this.index].value === expectedTokenValue) {
      this.index++;
    } else {
      throw new Error(errorMessage + '\n' + this.printErrorLocation());
    }
  }

  consumeOptional(expectedTokenValue) {
    if (this.tokens[this.index].value === expectedTokenValue) {
      this.index++;
    }
  }

  // parseAssertion() {
  //   const targetPath: string[] = [];
  //
  //   while (this.index < this.tokens.length
  //   && !['should'].includes(this.tokens[this.index])) {
  //     targetPath.push(this.tokens[this.index]);
  //     this.index++;
  //   }
  //
  //   if (this.tokens[this.index] === 'should') {
  //     this.index++;
  //   } else {
  //     throw new Error('Expected "should" but got ' + this.tokens[this.index]);
  //   }
  //
  //   const assertion: string[] = [];
  //
  //   while (this.index < this.tokens.length
  //   && !['and'].includes(this.tokens[this.index])) {
  //     assertion.push(this.tokens[this.index]);
  //     this.index++;
  //   }
  //
  //   if (this.tokens[this.index] === 'and') {
  //     this.index++;
  //   }
  //
  //   return {
  //     target: targetPath,
  //     assertion,
  //   };
  // }
  printErrorLocation() {
    const index = this.index;
    const line = this.tokens[index].line;
    const column = this.tokens[index].column;
    const lineContent = this.sentence.split('\n')[line - 1];
    const pointer = ' '.repeat(column - 1) + '^';
    return `Line ${line}, column ${column}:\n${lineContent}\n${pointer}`;
  }
}

function isQuoted(str) {
  if (str == null) {
    return false;
  }

  return str.startsWith('"') && str.endsWith('"');
}

const parser = new Parser();
console.log(
  JSON.stringify(
    parser.parse(
      `
      when I click on button and I type "toto" on input then
    button should be visible and input clear button should not be visible`,
    ),
  ),
);
