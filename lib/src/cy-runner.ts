import {
  ActionInstruction,
  AssertionInstruction,
  buildInstructions,
} from './instruction-builder';
import { KnownChainer } from './known-chainers';
import { PageObjectTree } from './page-object-tree';

interface TestFunction {
  (strings: TemplateStringsArray | string, ...values: any[]): void;
}

export function withTree(tree: PageObjectTree): TestFunction {
  return function test(strings, ...values) {
    let str = null;

    if (Array.isArray(strings)) {
      str = strings.reduce((acc, curr, i) => {
        return acc + curr + (values[i] ?? '');
      }, '');
    } else if (typeof strings === 'string') {
      str = strings;
    } else {
      throw new Error('Invalid input');
    }

    const instructions = buildInstructions(str, tree);
    instructions.actions.forEach(runAction);
    instructions.assertions.forEach(runAssertion);
  };
}

function runAction(actionInstruction: ActionInstruction): void {
  const { target, action, args } = actionInstruction;

  if (!target) {
    throw new Error('Target is required for actions');
  }

  switch (action) {
    case 'type':
      cy.get(target.join(' ')).type(args[0]);
      break;
    case 'click':
      cy.get(target.join(' ')).click();
      break;
    case 'visit':
      cy.visit(args[0]);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function runAssertion(assertionInstruction: AssertionInstruction): void {
  const { target, assertion, args } = assertionInstruction;

  if (isKnownAssertion(assertion)) {
    runKnownAssertion(assertion, target, args);
  } else {
    throw new Error(`Unknown assertion: ${assertion}`);
  }
}

function isKnownAssertion(assertion: string): assertion is KnownChainer {
  if (assertion.startsWith('not ')) {
    assertion = assertion.slice(4);
  }

  return Object.keys(KnownChainer).includes(assertion);
}

function runKnownAssertion(
  assertion: KnownChainer,
  target: string[] | null,
  args: string[],
) {
  const isNegated = assertion.startsWith('not ');
  const assertionName = isNegated ? assertion.slice(4) : assertion;
  let chainer: string =
    KnownChainer[assertionName as keyof typeof KnownChainer];

  if (!target) {
    throw new Error('Target is required for assertions');
  }

  if (isNegated) {
    chainer = 'not.' + chainer;
  }

  cy.get(target.join(' ')).should(chainer, ...args);
}
