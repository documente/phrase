import { buildInstructions } from './instruction-builder.js';

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
      return cy.get(target.join(' ')).type(args[0].slice(1, -1));
    case 'click':
      return cy.get(target.join(' ')).click();
    case 'visit':
      return cy.visit(args[0].slice(1, -1));
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function runAssertion(assertionInstruction) {
  const { target, assertion } = assertionInstruction;

  if (assertion === 'be visible') {
    cy.get(target.join(' ')).should('be.visible');
  } else if (assertion.startsWith('have text')) {
    cy.get(target.join(' ')).should('have.text', assertion.split('"')[1]);
  }
}
