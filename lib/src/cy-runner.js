import { buildInstructions } from './instruction-builder.js';
import { knownChainers } from './known-chainers.js';

export function withTree(tree) {
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

function runAction(actionInstruction) {
  const { target, action, args } = actionInstruction;

  switch (action) {
    case 'type':
      return cy.get(target.join(' ')).type(args[0]);
    case 'click':
      return cy.get(target.join(' ')).click();
    case 'visit':
      return cy.visit(args[0]);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function runAssertion(assertionInstruction) {
  const { target, assertion, args } = assertionInstruction;

  if (isKnownAssertion(assertion)) {
    runKnownAssertion(assertion, target, args);
  } else {
    throw new Error(`Unknown assertion: ${assertion}`);
  }
}

function isKnownAssertion(assertion) {
  if (assertion.startsWith('not ')) {
    assertion = assertion.slice(4);
  }

  return Object.keys(knownChainers).includes(assertion);
}

function runKnownAssertion(assertion, target, args) {
  const isNegated = assertion.startsWith('not ');
  const assertionName = isNegated ? assertion.slice(4) : assertion;
  let chainer = knownChainers[assertionName];

  if (isNegated) {
    chainer = 'not.' + chainer;
  }

  cy.get(target.join(' ')).should(chainer, ...args);
}
