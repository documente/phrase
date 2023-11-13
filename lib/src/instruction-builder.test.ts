import { buildInstructions } from './instruction-builder';
import { expect, test } from '@jest/globals';

test('should throw if action target cannot be resolved', () => {
  const tree = {};
  expect(() =>
    buildInstructions(
      'when I click on form button then it should be done',
      tree,
    ),
  ).toThrow('Could not resolve target path for "form button"');
});

test('should throw if action in unknown', () => {
  const tree = {
    form: {
      _selector: 'form',
      button: 'button',
    },
  };

  expect(() =>
    buildInstructions(
      'when I foobar on form button then it should be done',
      tree,
    ),
  ).toThrow('Unknown action "foobar"');
});

test('should build an action without arguments', () => {
  const tree = {
    form: {
      _selector: 'form',
      button: 'button',
    },
  };

  const instructions = buildInstructions(
    'when I click on form button then it should be done',
    tree,
  );
  expect(instructions.actions).toEqual([
    {
      target: ['form', 'button'],
      action: 'click',
      args: [],
    },
  ]);
});

test('should build an action with arguments', () => {
  const tree = {
    form: {
      _selector: 'form',
      button: 'button',
    },
  };

  const instructions = buildInstructions(
    'when I type "foo" on form button then it should be done',
    tree,
  );
  expect(instructions.actions).toEqual([
    {
      target: ['form', 'button'],
      action: 'type',
      args: ['foo'],
    },
  ]);
});

test('should build an assertion', () => {
  const tree = {
    button: 'button',
    welcomeMessage: 'h1',
  };

  const instructions = buildInstructions(
    'when I click on button then welcome message should be visible',
    tree,
  );
  expect(instructions.assertions).toEqual([
    {
      target: ['h1'],
      assertion: 'be visible',
      args: [],
    },
  ]);
});

test('should build an assertion with quoted text argument', () => {
  const tree = {
    button: 'button',
    welcomeMessage: 'h1',
  };

  const instructions = buildInstructions(
    'when I click on button then welcome message should have text "Hello, World!"',
    tree,
  );
  expect(instructions.assertions).toEqual([
    {
      target: ['h1'],
      assertion: 'have text',
      args: ['Hello, World!'],
    },
  ]);
});
