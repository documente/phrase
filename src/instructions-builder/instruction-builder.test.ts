import { expect, test } from '@jest/globals';
import { buildInstructions } from './instruction-builder';
import {
  ActionInstruction,
  AssertionInstruction,
  BuiltInActionInstruction,
  BuiltInAssertion,
  SystemLevelInstruction,
} from '../interfaces/instructions.interface';
import { SelectorTree } from '../interfaces/selector-tree.interface';

test('should throw if action target cannot be resolved', () => {
  expect(() =>
    buildInstructions(
      'when I click form button then it should be visible',
      {},
      {},
      {},
    ),
  ).toThrow('Could not resolve target path for "form button"');
});

test('should throw if action in unknown', () => {
  const tree: SelectorTree = {
    form: {
      _selector: 'form',
      button: 'button',
    },
  };

  expect(() =>
    buildInstructions(
      'when I foobar on form button then it should be visible',
      tree,
      {},
      {},
    ),
  ).toThrow('Unknown action "foobar on form button"');
});

test('should build an action without arguments', () => {
  const tree: SelectorTree = {
    form: {
      _selector: 'form',
      button: 'button',
    },
  };

  const instructions = buildInstructions(
    'when I click form button then it should be visible',
    tree,
    {},
    {},
  );
  expect(instructions[0]).toEqual({
    kind: 'builtin-action',
    selectors: ['form', 'button'],
    action: 'click',
    args: [],
  } satisfies ActionInstruction);
});

test('should build an action with arguments', () => {
  const tree: SelectorTree = {
    form: {
      _selector: 'form',
      button: 'button',
    },
  };

  const instructions = buildInstructions(
    'when I type "foo" on form button then it should be visible',
    tree,
    {},
    {},
  );
  expect(instructions[0]).toEqual({
    kind: 'builtin-action',
    selectors: ['form', 'button'],
    action: 'type',
    args: ['foo'],
  } satisfies ActionInstruction);
});

test('should build an assertion', () => {
  const tree: SelectorTree = {
    button: 'button',
    welcomeMessage: 'h1',
  };

  const instructions = buildInstructions(
    'when I click on button then welcome message should be visible',
    tree,
    {},
    {},
  );
  expect(instructions[1]).toEqual({
    kind: 'builtin-assertion',
    selectors: ['h1'],
    target: [
      {
        arg: undefined,
        fragments: ['welcome', 'message'],
        key: 'welcomeMessage',
      },
    ],
    code: 'be visible',
    args: [],
  } satisfies BuiltInAssertion);
});

test('should build an assertion with quoted text argument', () => {
  const tree: SelectorTree = {
    button: 'button',
    welcomeMessage: 'h1',
  };

  const instructions = buildInstructions(
    'when I click on button then welcome message should have text "Hello, World!"',
    tree,
    {},
    {},
  );
  expect(instructions[1]).toEqual({
    kind: 'builtin-assertion',
    selectors: ['h1'],
    target: [
      {
        arg: undefined,
        fragments: ['welcome', 'message'],
        key: 'welcomeMessage',
      },
    ],
    code: 'have text',
    args: ['Hello, World!'],
  } satisfies AssertionInstruction);
});

test('should build instructions with an action block', () => {
  const instructions = buildInstructions(
    `when I click twice on button then it should be visible

      In order to click twice on $button:
      - I click on it
      - I click on it`,
    { button: 'button' },
    {},
    {},
  );

  const firstAction = instructions[0] as BuiltInActionInstruction;
  expect(firstAction.kind).toEqual('builtin-action');
  expect(firstAction.action).toEqual('click');
  expect(firstAction.args).toEqual([]);
  expect(firstAction.selectors).toEqual(['button']);

  const secondAction = instructions[1] as BuiltInActionInstruction;
  expect(secondAction.kind).toEqual('builtin-action');
  expect(secondAction.action).toEqual('click');
  expect(secondAction.args).toEqual([]);
  expect(secondAction.selectors).toEqual(['button']);
});

test('should reject circular action blocks', () => {
  expect(() =>
    buildInstructions(
      `when I click twice on button then it should be visible

      In order to click twice on button:
      - I click twice on button`,
      { button: 'button' },
      {},
      {},
    ),
  ).toThrow(`Circular block detected: "click twice on button"
Line 4, column 11:
      - I click twice on button
          ^`);
});

test('should reject nested circular action blocks', () => {
  expect(() =>
    buildInstructions(
      `when I click twice on button then it should be visible

      In order to click twice on button:
      - I foobar on button

      In order to foobar on button:
      - I click twice on button`,
      { button: 'button' },
      {},
      {},
    ),
  ).toThrow(`Circular block detected: "click twice on button"
Line 7, column 11:
      - I click twice on button
          ^`);
});

test('should build instructions with an assertion block', () => {
  const instructions = buildInstructions(
    `when I click on button then it should be shown

      For button to be shown:
      - it should be visible`,
    { button: 'button' },
    {},
    {},
  );

  const assertion = instructions[1] as AssertionInstruction;
  expect(assertion.kind).toEqual('builtin-assertion');
  expect(assertion.selectors).toEqual(['button']);
  expect(assertion.args).toEqual([]);
  expect(assertion.target).toEqual([
    { arg: undefined, fragments: ['button'], key: 'button' },
  ]);

  const resolvedAssertion = assertion as BuiltInAssertion;
  expect(resolvedAssertion.kind).toEqual('builtin-assertion');
  expect(resolvedAssertion.code).toEqual('be visible');
});

test('should build instructions with a builtin negated assertion', () => {
  const instructions = buildInstructions(
    'when I click button then it should not exist',
    { button: 'button' },
    {},
    {},
  );

  const builtinAssertion = instructions[1] as BuiltInAssertion;
  expect(builtinAssertion.kind).toBe('builtin-assertion');
  expect(builtinAssertion.code).toBe('not exist');
});

test('should reject unknown assertions', () => {
  expect(() =>
    buildInstructions(
      `when I click button then it should foobar`,
      { button: 'button' },
      {},
      {},
    ),
  ).toThrow('Unknown assertion "foobar"');
});

test('should reject nested circular assertion blocks', () => {
  expect(() =>
    buildInstructions(
      `when I click on button then it should be red

      For button to be red:
      - it should be red`,
      { button: 'button' },
      {},
      {},
    ),
  ).toThrow(`Circular block detected: "be red"
Line 4, column 19:
      - it should be red
                  ^`);
});

test('should handle interpolated arguments in selectors', () => {
  const instructions = buildInstructions(
    `when I click button
then it should contain label "foobar"

for $element to contain label {{content}}:
- its label with text "{{content}}" should exist`,
    {
      button: {
        _selector: 'button',
        'label with text {{label}}': 'label[text="{{label}}"]',
      },
    },
    {},
    {},
  );

  const firstBuiltinAssertion: BuiltInAssertion =
    instructions[1] as BuiltInAssertion;
  expect(firstBuiltinAssertion.selectors).toEqual([
    'button',
    'label[text="foobar"]',
  ]);
});

test('should build instructions with a system statement', () => {
  const instructions = buildInstructions(
    'given stock is empty when I click button then it should be visible',
    { button: 'button' },
    {
      stockIsEmpty: () => {},
    },
    {},
  );

  const systemInstruction = instructions[0] as SystemLevelInstruction;
  expect(systemInstruction.kind).toBe('system-level');
  expect(systemInstruction.key).toBe('stockIsEmpty');
});

test('should throw if no matching system-level action is found', () => {
  expect(() =>
    buildInstructions(
      'given stock is empty when I click button then it should be visible',
      { button: 'button' },
      {},
      {},
    ),
  ).toThrow('Unknown system-level action "stock is empty"');
});
