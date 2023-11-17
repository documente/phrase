import {ActionInstruction, AssertionInstruction, buildInstructions, ResolvedAssertion} from './instruction-builder';
import { expect, test } from '@jest/globals';
import {Context} from './context.interface';

test('should throw if action target cannot be resolved', () => {
  const context: Context = {pageObjectTree: {}, systemActions: {}};
  expect(() =>
    buildInstructions(
      'when I click on form button then it should be visible',
        context,
    ),
  ).toThrow('Could not resolve target path for "form button"');
});

test('should throw if action in unknown', () => {
  const context: Context = {
    systemActions: {},
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
      },
    }
  };

  expect(() =>
    buildInstructions(
      'when I foobar on form button then it should be visible',
        context,
    ),
  ).toThrow('Unknown action "foobar"');
});

test('should build an action without arguments', () => {
  const context: Context = {
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
      }
    },
    systemActions: {},
  };

  const instructions = buildInstructions(
    'when I click on form button then it should be visible',
    context,
  );
  expect(instructions.when).toEqual([
    {
      kind: 'action',
      target: ['form', 'button'],
      action: 'click',
      args: [],
    } satisfies ActionInstruction,
  ]);
});

test('should build an action with arguments', () => {
  const context: Context = {
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
      },
    },
    systemActions: {}
  };

  const instructions = buildInstructions(
    'when I type "foo" on form button then it should be visible',
      context,
  );
  expect(instructions.when).toEqual([
    {
      kind: 'action',
      target: ['form', 'button'],
      action: 'type',
      args: ['foo'],
    } satisfies ActionInstruction,
  ]);
});

test('should build an assertion', () => {
  const context: Context = {
    pageObjectTree: {
      button: 'button',
      welcomeMessage: 'h1',
    },
    systemActions: {},
  };

  const instructions = buildInstructions(
    'when I click on button then welcome message should be visible',
    context,
  );
  expect(instructions.then).toEqual([
    {
      kind: 'assertion',
      selectors: ['h1'],
      target: [
        {
          arg: undefined,
          fragments: ['welcome', 'message'],
          key: 'welcomeMessage',
        },
      ],
      assertion: {
        kind: 'builtin',
        chainer: 'be.visible',
      } satisfies ResolvedAssertion,
      args: [],
    } satisfies AssertionInstruction,
  ]);
});

test('should build an assertion with quoted text argument', () => {
  const context: Context = {
    pageObjectTree: {
    button: 'button',
        welcomeMessage: 'h1',
  },
    systemActions: {},
};

  const instructions = buildInstructions(
    'when I click on button then welcome message should have text "Hello, World!"',
    context,
  );
  expect(instructions.then).toEqual([
    {
      kind: 'assertion',
      selectors: ['h1'],
      target: [
        {
          arg: undefined,
          fragments: ['welcome', 'message'],
          key: 'welcomeMessage',
        },
      ],
      assertion: {
        kind: 'builtin',
        chainer: 'have.text',
      } satisfies ResolvedAssertion,
      args: ['Hello, World!'],
    } satisfies AssertionInstruction,
  ]);
});

