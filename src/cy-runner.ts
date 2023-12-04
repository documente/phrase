import {
  BuiltInActionInstruction,
  BuiltInAssertion,
  Instruction,
  SystemLevelInstruction,
} from './interfaces/instructions.interface';
import { Externals } from './interfaces/externals.interface';
import { validateContext } from './context-validation';
import { SelectorTree } from './interfaces/selector-tree.interface';
import { buildInstructions } from './instructions-builder/instruction-builder';
import YAML from 'yaml';
import { normalizeEOL } from './normalize-eol';
import { BuiltinAssertionCode } from './instructions-builder/builtin-assertions';

export type TemplateStringsOrStringConsumer = (
  strings: TemplateStringsArray | string,
  ...values: unknown[]
) => void;

interface TestRunner {
  add: TemplateStringsOrStringConsumer;
  test: TemplateStringsOrStringConsumer;
}

function processTemplateStrings(
  strings: TemplateStringsArray | string,
  values: unknown[],
): string {
  if (Array.isArray(strings)) {
    return normalizeEOL(
      strings.reduce((acc, curr, i) => {
        return acc + curr + (values[i] ?? '');
      }, ''),
    );
  } else if (typeof strings === 'string') {
    return normalizeEOL(strings);
  } else {
    throw new Error('Invalid input');
  }
}

export function withContext(
  selectorTree: SelectorTree | string,
  externals: Externals,
): TestRunner {
  const tree =
    typeof selectorTree === 'string' ? YAML.parse(selectorTree) : selectorTree;

  const fragments: string[] = [];

  validateContext(tree, externals);

  function runInstruction(instruction: Instruction): void {
    if (instruction.kind === 'system-level') {
      runSystemLevel(instruction, externals);
    } else if (instruction.kind === 'builtin-action') {
      runAction(instruction);
    } else if (instruction.kind === 'builtin-assertion') {
      runBuiltInAssertion(instruction);
    }
  }

  return {
    add(strings, ...values) {
      fragments.push(processTemplateStrings(strings, values));
    },
    test(strings, ...values) {
      let str = processTemplateStrings(strings, values);

      str += '\n' + fragments.join('\n');

      const instructions = buildInstructions(str, tree, externals);
      instructions.forEach(runInstruction);
    },
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

const knownChainer: Record<BuiltinAssertionCode, string> = {
  'have text': 'have.text',
  'be visible': 'be.visible',
  'contain text': 'contain.text',
  'have value': 'have.value',
  'have class': 'have.class',
  exist: 'exist',
  'not exist': 'not.exist',
  'be checked': 'be.checked',
  'be unchecked': 'be.unchecked',
  'be disabled': 'be.disabled',
  'be enabled': 'be.enabled',
  'have occurrences': 'have.length',
};

function runBuiltInAssertion(assertion: BuiltInAssertion): void {
  const { selectors, args } = assertion;

  if (!selectors) {
    throw new Error('Target selectors are required for built-in assertions.');
  }

  const chainer = knownChainer[assertion.code] as string;

  if (chainer == null) {
    throw new Error(`Unknown assertion: ${assertion.code}`);
  }

  cy.get(selectors.join(' ')).should(chainer, ...args);
}

function runSystemLevel(
  instruction: SystemLevelInstruction,
  externals: Externals,
): void {
  const systemAction = externals[instruction.key];
  systemAction(...instruction.args);
}
