import { expect, test } from '@jest/globals';
import { Context } from '../interfaces/context.interface';
import { buildInstructions } from './instruction-builder';
import {
  ActionInstruction,
  AssertionInstruction,
  BuiltInActionInstruction,
  BuiltInAssertion,
} from '../interfaces/instructions.interface';

test('should throw if action target cannot be resolved', () => {
  const context: Context = { pageObjectTree: {}, systemActions: {} };
  expect(() =>
    buildInstructions(
      'when I click form button then it should be visible',
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
  ).toThrow('Unknown action "foobar on form button"');
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
    'when I click form button then it should be visible',
    context,
  );
  expect(instructions.when).toEqual([
    {
      kind: 'builtin-action',
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
      kind: 'builtin-action',
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
      kind: 'builtin-assertion',
      selectors: ['h1'],
      target: [
        {
          arg: undefined,
          fragments: ['welcome', 'message'],
          key: 'welcomeMessage',
        },
      ],
      chainer: 'be.visible',
      args: [],
    } satisfies BuiltInAssertion,
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
      kind: 'builtin-assertion',
      selectors: ['h1'],
      target: [
        {
          arg: undefined,
          fragments: ['welcome', 'message'],
          key: 'welcomeMessage',
        },
      ],
      chainer: 'have.text',
      args: ['Hello, World!'],
    } satisfies AssertionInstruction,
  ]);
});

test('should build instructions with an action block', () => {
  const instructions = buildInstructions(
    `when I click twice on button then it should be visible
      done

      In order to click twice on $button:
      - I click on it
      - I click on it`,
    {
      pageObjectTree: {
        button: 'button',
      },
      systemActions: {},
    },
  );

  expect(instructions.when).toHaveLength(2);

  const firstAction = instructions.when[0] as BuiltInActionInstruction;
  expect(firstAction.kind).toEqual('builtin-action');
  expect(firstAction.action).toEqual('click');
  expect(firstAction.args).toEqual([]);
  expect(firstAction.selectors).toEqual(['button']);

  const secondAction = instructions.when[1] as BuiltInActionInstruction;
  expect(secondAction.kind).toEqual('builtin-action');
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
  ).toThrow(`Circular block detected: "click twice on button"
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
  ).toThrow(`Circular block detected: "click twice on button"
Line 9, column 11:
      - I click twice on button
          ^`);
});

test('should build instructions with an assertion block', () => {
  const instructions = buildInstructions(
    `when I click on button then it should be shown
      done

      For button to be shown:
      - it should be visible`,
    {
      pageObjectTree: {
        button: 'button',
      },
      systemActions: {},
    },
  );

  expect(instructions.then).toHaveLength(1);

  const assertion = instructions.then[0] as AssertionInstruction;
  expect(assertion.kind).toEqual('builtin-assertion');
  expect(assertion.selectors).toEqual(['button']);
  expect(assertion.args).toEqual([]);
  expect(assertion.target).toEqual([
    { arg: undefined, fragments: ['button'], key: 'button' },
  ]);

  const resolvedAssertion = assertion as BuiltInAssertion;
  expect(resolvedAssertion.kind).toEqual('builtin-assertion');
  expect(resolvedAssertion.chainer).toEqual('be.visible');
});

test('should reject nested circular assertion blocks', () => {
  expect(() =>
    buildInstructions(
      `when I click on button then it should be red
      done

      For button to be red:
      - it should be red
      done`,
      {
        pageObjectTree: {
          button: 'button',
        },
        systemActions: {},
      },
    ),
  ).toThrow(`Circular block detected: "be red"
Line 5, column 19:
      - it should be red
                  ^`);
});

test.only('should handle interpolated arguments in selectors', () => {
  const instructions = buildInstructions(
    `when I click button
then it should contain label "foobar"
done

for $element to contain label {{content}}:
- its label with text "{{content}}" should exist
done`, {
      pageObjectTree: {
        button: {
          _selector: 'button',
          'label with text {{label}}': 'label[text="{{label}}"]'
        },
      },
      systemActions: {},
    }
  );

  const firstBuiltinAssertion: BuiltInAssertion = instructions.then[0] as BuiltInAssertion;
  expect(firstBuiltinAssertion.selectors).toEqual([ 'button', 'label[text="foobar"]' ]);
})
