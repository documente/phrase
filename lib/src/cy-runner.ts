import {
  ActionInstruction,
  AssertionInstruction,
  buildInstructions,
} from './instruction-builder';
import { KnownChainer } from './known-chainers';
import { PageObjectTree } from './page-object-tree';
import { getNode } from './get-node';
import { ResolvedTarget } from './resolver';

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
    instructions.assertions.forEach((assertion) =>
      runAssertion(assertion, tree),
    );
  };
}

function targetIsDefined(
  target: string[] | null,
  action: string,
): target is string[] {
  if (!target) {
    throw new Error(`Target is required for action ${action}.`);
  }

  return true;
}

function runAction(actionInstruction: ActionInstruction): void {
  const { target, action, args } = actionInstruction;

  switch (action) {
    case 'type':
      if (targetIsDefined(target, action)) {
        cy.get(target.join(' ')).type(args[0]);
      }
      break;
    case 'click':
      if (targetIsDefined(target, action)) {
        cy.get(target.join(' ')).click();
      }
      break;
    case 'visit':
      cy.visit(args[0]);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function runAssertion(
  assertionInstruction: AssertionInstruction,
  tree: PageObjectTree,
): void {
  const { target, assertion, args, selectors } = assertionInstruction;

  if (isKnownAssertion(assertion)) {
    runKnownAssertion(assertion, selectors, args);
    return;
  }

  const customAssertion = findCustomAssertion(assertion, target, tree);

  if (customAssertion && selectors) {
    customAssertion(cy.get(selectors.join(' ')), ...args);
    return;
  }

  throw new Error(`Unknown assertion: ${assertion}`);
}

function isKnownAssertion(assertion: string): assertion is KnownChainer {
  if (assertion.startsWith('not ')) {
    assertion = assertion.slice(4);
  }

  return Object.keys(KnownChainer).includes(assertion);
}

function runKnownAssertion(
  assertion: KnownChainer,
  selectors: string[] | null,
  args: string[],
) {
  const isNegated = assertion.startsWith('not ');
  const assertionName = isNegated ? assertion.slice(4) : assertion;
  let chainer: string =
    KnownChainer[assertionName as keyof typeof KnownChainer];

  if (!selectors) {
    throw new Error('Target selectors are required for built-in assertions.');
  }

  if (isNegated) {
    chainer = 'not.' + chainer;
  }

  cy.get(selectors.join(' ')).should(chainer, ...args);
}

function findCustomAssertion(
  assertion: string,
  target: ResolvedTarget[] | null,
  tree: PageObjectTree,
): Function | null {
  if (!target) {
    return null;
  }

  const node = getNode(
    tree,
    target.map((t) => t.key),
  );
  const assertionTestValue = assertion.split(' ').join('').toLowerCase();

  for (const key in node) {
    const keyWithoutShould = key
      .toLowerCase()
      .split('_')
      .join('')
      .replace('should', '');
    const candidate = node[key];

    if (
      keyWithoutShould === assertionTestValue &&
      typeof candidate === 'function'
    ) {
      return candidate;
    }
  }

  return null;
}
