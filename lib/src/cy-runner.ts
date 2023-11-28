import {
  BuiltInActionInstruction,
  BuiltInAssertion,
  CustomAssertion,
  Instruction,
  SystemLevelInstruction,
} from './interfaces/instructions.interface';
import { getNode } from './get-node';
import { Externals } from './interfaces/externals.interface';
import { validateContext } from './context-validation';
import { SelectorTree } from './interfaces/selector-tree.interface';
import { buildInstructions } from './instructions-builder/instruction-builder';
import YAML from 'yaml';
import { extractFunctionName } from './function-name';

interface TestFunction {
  (strings: TemplateStringsArray | string, ...values: unknown[]): void;
}

function runSystemLevel(
  instruction: SystemLevelInstruction,
  externals: Externals,
): void {
  const systemAction = externals[instruction.key];
  systemAction(...instruction.args);
}

export function withContext(
  selectorTree: SelectorTree | string,
  externals: Externals,
): TestFunction {
  const tree =
    typeof selectorTree === 'string' ? YAML.parse(selectorTree) : selectorTree;

  validateContext(tree, externals);

  function runInstruction(instruction: Instruction): void {
    if (instruction.kind === 'system-level') {
      runSystemLevel(instruction, externals);
    } else if (instruction.kind === 'builtin-action') {
      runAction(instruction);
    } else if (instruction.kind === 'builtin-assertion') {
      runBuiltInAssertion(instruction);
    } else if (instruction.kind === 'custom-assertion') {
      runCustomAssertion(instruction, tree);
    }
  }

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

    const instructions = buildInstructions(str, tree, externals);
    instructions.forEach(runInstruction);
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

function runAction(actionInstruction: BuiltInActionInstruction): void {
  const { selectors, action, args } = actionInstruction;

  switch (action) {
    case 'type':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).type(args[0]);
      }
      break;
    case 'click':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).click();
      }
      break;
    case 'visit':
      cy.visit(args[0]);
      break;
    case 'check':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).check();
      }
      break;
    case 'clear':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).clear();
      }
      break;
    case 'double_click':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).dblclick();
      }
      break;
    case 'right_click':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).rightclick();
      }
      break;
    case 'scroll':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).scrollIntoView();
      }
      break;
    case 'uncheck':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).uncheck();
      }
      break;
    case 'select':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).select(args[0]);
      }
      break;
    case 'go_back':
      cy.go('back');
      break;
    case 'go_forward':
      cy.go('forward');
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function runBuiltInAssertion(assertion: BuiltInAssertion): void {
  const { selectors, args } = assertion;

  if (!selectors) {
    throw new Error('Target selectors are required for built-in assertions.');
  }

  cy.get(selectors.join(' ')).should(assertion.chainer, ...args);
}

function runCustomAssertion(assertion: CustomAssertion, tree: SelectorTree) {
  const customAssertion = findCustomAssertion(assertion, tree);

  const { selectors, args } = assertion;

  if (customAssertion) {
    if (!selectors) {
      throw new Error('Target selectors are required for custom assertions.');
    }

    customAssertion(cy.get(selectors.join(' ')), ...args);
    return;
  }

  throw new Error(`Unknown assertion: ${assertion}`);
}

function findCustomAssertion(
  assertion: CustomAssertion,
  tree: SelectorTree,
): (...args: unknown[]) => void {
  const target = assertion.target;

  if (!target) {
    throw new Error('Target is required for custom assertions.');
  }

  const node = getNode(
    tree,
    target.map((t) => t.key),
  );

  return node[assertion.method as keyof typeof node] as (
    ...args: unknown[]
  ) => void;
}
