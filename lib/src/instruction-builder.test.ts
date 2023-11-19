import { expect, test } from '@jest/globals';
import { Context } from './interfaces/context.interface';
import { buildInstructions } from './instruction-builder';
import {
  ActionInstruction,
  AssertionInstruction,
  BlockActionInstruction,
  BuiltInActionInstruction,
  ResolvedAssertion,
} from './interfaces/instructions.interface';
import { BuiltinAction } from './builtin-actions';

test('should throw if action target cannot be resolved', () => {
  const context: Context = { pageObjectTree: {}, systemActions: {} };
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
    },
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
      },
    },
    systemActions: {},
  };

  const instructions = buildInstructions(
    'when I click on form button then it should be visible',
    context,
  );
  expect(instructions.when).toEqual([
    {
      kind: 'builtin',
      selectors: ['form', 'button'],
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
    systemActions: {},
  };

  const instructions = buildInstructions(
    'when I type "foo" on form button then it should be visible',
    context,
  );
  expect(instructions.when).toEqual([
    {
      kind: 'builtin',
      selectors: ['form', 'button'],
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

test('should build instructions with an action block', () => {
  const instructions = buildInstructions(
    `when I click twice on button then it should be visible
      done
      
      In order to click twice on button:
      - I click on it
      - I click on it`,
    {
      pageObjectTree: {
        button: 'button',
      },
      systemActions: {},
    },
  );

  const firstAction = instructions.when[0] as BuiltInActionInstruction;
  expect(firstAction.kind).toEqual('builtin');
  expect(firstAction.action).toEqual('click');
  expect(firstAction.args).toEqual([]);
  expect(firstAction.selectors).toEqual(['button']);

  const secondAction = instructions.when[1] as BuiltInActionInstruction;
  expect(secondAction.kind).toEqual('builtin');
  expect(secondAction.action).toEqual('click');
  expect(secondAction.args).toEqual([]);
  expect(secondAction.selectors).toEqual(['button']);
});

test('should reject circular action blocks', () => {
  expect(() =>
    buildInstructions(
      `when I click twice on button then it should be visible
      done
      
      In order to click twice on button:
      - I click twice on button`,
      {
        pageObjectTree: {
          button: 'button',
        },
        systemActions: {},
      },
    ),
  ).toThrow(`Circular action block detected: "click twice"
Line 5, column 11:
      - I click twice on button
          ^`);
});

test('should reject nested circular action blocks', () => {
  expect(() =>
    buildInstructions(
      `when I click twice on button then it should be visible
      done
      
      In order to click twice on button:
      - I foobar on button
      done
      
      In order to foobar on button:
      - I click twice on button
      done`,
      {
        pageObjectTree: {
          button: 'button',
        },
        systemActions: {},
      },
    ),
  ).toThrow(`Circular action block detected: "click twice"
Line 9, column 11:
      - I click twice on button
          ^`);
});
