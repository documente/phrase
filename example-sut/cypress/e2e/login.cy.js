import { buildInstructions } from '../../../lib/src/instruction-builder';

const tree = {
  loginForm: {
    _selector: '.login-form',
    loginField: 'input[type="text"]',
    passwordField: 'input[type="password"]',
    confirmButton: 'button[type="submit"]',
  },
  welcomeMessage: 'h1',
};

describe('template spec', () => {
  it('passes', () => {
    cy.visit('http://localhost:3000/');

    const test = (strings) => {
      const instructions = buildInstructions(strings[0], tree);

      instructions.actions.forEach(({ target, action, args }) => {
        if (action === 'click') {
          return cy.get(target.join(' ')).click();
        } else if (action === 'type') {
          cy.get(target.join(' ')).type(args[0].slice(1, -1));
        }
      });

      instructions.assertions.forEach(({ target, assertion }) => {
        if (assertion === 'be visible') {
          cy.get(target.join(' ')).should('be.visible');
        }
      });
    };

    test `when I type "username" on login form login field
        and I type "password" on login form password field
        and I click on login form confirm button
        then welcome message should be visible`;
  });
})