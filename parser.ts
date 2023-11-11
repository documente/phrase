// Sentence structure :
// when I [ACTION] [ARGS?] on [TARGET] (and I [ACTION] [ARGS?])? then [TARGET] should [ASSERTION] (and [TARGET] should [ASSERTION])?

interface Action {
  target: string[];
  action: string;
  args: any[];
}

interface Assertion {
  target: string[];
  assertion: string[];
}

interface Sentence {
  actions: Action[];
  assertions: Assertion[];
}

export class Parser {
  index = 0;
  tokens: string[] = [];
  foundThen = false;

  actions: Action[] = [];
  assertions: Assertion[] = [];

  parse(sentence: string): Sentence {
    this.tokens = sentence.split(' ');

    if (this.tokens[0] !== 'when') {
      throw new Error('Expected "when"');
    }

    this.index++;

    while (this.index < this.tokens.length) {
      if (this.tokens[this.index] === 'then') {
        this.foundThen = true;
        this.index++;
        continue;
      }

      if (!this.foundThen) {
        this.actions.push(this.parseAction());
      } else {
        this.assertions.push(this.parseAssertion());
      }
    }

    return {
      actions: this.actions,
      assertions: this.assertions,
    };
  }

  private parseAction(): Action {
    if (this.tokens[this.index] === 'I') {
      this.index++;
    } else {
      throw new Error('Expected "I" but got ' + this.tokens[this.index]);
    }

    const actionKind = this.tokens[this.index];
    this.index++;

    if (this.tokens[this.index] === 'on') {
      this.index++;
    } else {
      throw new Error('Expected "on" but got ' + this.tokens[this.index]);
    }

    const targetPath: string[] = [];

    while (this.index < this.tokens.length
    && !['and', 'then'].includes(this.tokens[this.index])
    && !isQuoted(this.tokens[this.index])) {
      targetPath.push(this.tokens[this.index]);
      this.index++;
    }

    const args: any[] = [];

    if (this.index < this.tokens.length && isQuoted(this.tokens[this.index])) {
      args.push(this.tokens[this.index].slice(1, -1));
      this.index++;
    }

    if (this.tokens[this.index] === 'then') {
      this.foundThen = true;
      this.index++;
    }

    if (this.tokens[this.index] === 'and') {
      this.index++;
    }

    return {
      target: targetPath,
      action: actionKind,
      args,
    };
  }

  private parseAssertion(): Assertion {
    const targetPath: string[] = [];

    while (this.index < this.tokens.length
    && !['should'].includes(this.tokens[this.index])) {
      targetPath.push(this.tokens[this.index]);
      this.index++;
    }

    if (this.tokens[this.index] === 'should') {
      this.index++;
    } else {
      throw new Error('Expected "should" but got ' + this.tokens[this.index]);
    }

    const assertion: string[] = [];

    while (this.index < this.tokens.length
    && !['and'].includes(this.tokens[this.index])) {
      assertion.push(this.tokens[this.index]);
      this.index++;
    }

    if (this.tokens[this.index] === 'and') {
      this.index++;
    }

    return {
      target: targetPath,
      assertion,
    };
  }
}

function isQuoted(str: string): boolean {
  if (str == null) {
    return false;
  }

  return str.startsWith('"') && str.endsWith('"');
}

const parser = new Parser();
console.log(JSON.stringify(parser.parse(
    'when I click on button and I type on input "toto" then button should be visible and input clear button should not be visible')));