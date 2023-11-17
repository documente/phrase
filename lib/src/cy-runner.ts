import {
  ActionInstruction,
  AssertionInstruction,
  buildInstructions,
  BuiltInAssertion,
  CustomAssertion, SystemLevelInstruction,
} from './instruction-builder';
import { PageObjectTree } from './page-object-tree';
import { getNode } from './get-node';
import { ResolvedTarget } from './resolver';
import {Context} from './context.interface';

interface TestFunction {
  (strings: TemplateStringsArray | string, ...values: any[]): void;
}

function runSystemLevel(instruction: SystemLevelInstruction, context: Context): void {
  context.systemActions[instruction.key](...instruction.args);
}

// TODO: check validity of context
export function withContext(context: Context): TestFunction {
  const tree = context.pageObjectTree;

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

    const instructions = buildInstructions(str, context);
    instructions.given.forEach(instruction => {
      if (instruction.kind === 'system-level') {
        runSystemLevel(instruction, context);
      } else if (instruction.kind === 'action') {
        runAction(instruction);
      }
    });
    instructions.when.forEach(runAction);
    instructions.then.forEach((assertion) =>
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

  if (assertion.kind === 'builtin') {
    runKnownAssertion(assertion, selectors, args);
    return;
  }

  const customAssertion = findCustomAssertion(assertion, target, tree);

  if (customAssertion) {
    if (!selectors) {
      throw new Error('Target selectors are required for custom assertions.');
    }

    customAssertion(cy.get(selectors.join(' ')), ...args);
    return;
  }

  throw new Error(`Unknown assertion: ${assertion}`);
}

function runKnownAssertion(
  assertion: BuiltInAssertion,
  selectors: string[] | null,
  args: string[],
) {
  if (!selectors) {
    throw new Error('Target selectors are required for built-in assertions.');
  }

  cy.get(selectors.join(' ')).should(assertion.chainer, ...args);
}

function findCustomAssertion(
  assertion: CustomAssertion,
  target: ResolvedTarget[] | null,
  tree: PageObjectTree,
): Function {
  if (!target) {
    throw new Error('Target is required for custom assertions.');
  }

  const node = getNode(
    tree,
    target.map((t) => t.key),
  );

  return node[assertion.method as keyof typeof node] as Function;
}
