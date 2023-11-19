import { Parser } from './parser';
import { expect, test } from '@jest/globals';
import {
  ActionStatement,
  AssertionStatement,
  SystemLevelStatement,
} from './interfaces/statements.interface';

test('should throw if parsing an empty sentence', () => {
  const parser = new Parser();
  expect(() => parser.parse('')).toThrow('Empty sentence');
});

test('should throw if parsing a sentence without "when"', () => {
  const parser = new Parser();
  expect(() => parser.parse('foo')).toThrow(
    `Expected "when"
Line 1, column 1:
foo
^`,
  );
});

test('should parse a sentence with an action without target and without args', () => {
  const parser = new Parser();
  const sentence = parser.parse('when I click then it should be done');

  expect(sentence.when).toEqual([
    {
      kind: 'action',
      target: [],
      action: [
        {
          kind: 'generic',
          column: 8,
          line: 1,
          value: 'click',
        },
      ],
      args: [],
    } satisfies ActionStatement,
  ]);
});

test('should parse a sentence with an action with a target and without args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click on button then it should be done',
  );
  expect(sentence.when).toEqual([
    {
      kind: 'action',
      target: [
        {
          kind: 'generic',
          column: 17,
          line: 1,
          value: 'button',
        },
      ],
      action: [
        {
          kind: 'generic',
          column: 8,
          line: 1,
          value: 'click',
        },
      ],
      args: [],
    } satisfies ActionStatement,
  ]);
});

test('should parse a sentence with an action with a target and with args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I type "foo" on input then it should be done',
  );

  expect(sentence.when).toEqual([
    {
      kind: 'action',
      target: [
        {
          kind: 'generic',
          column: 22,
          line: 1,
          value: 'input',
        },
      ],
      action: [
        {
          kind: 'generic',
          column: 8,
          line: 1,
          value: 'type',
        },
      ],
      args: [
        {
          kind: 'generic',
          column: 13,
          line: 1,
          value: '"foo"',
        },
      ],
    } satisfies ActionStatement,
  ]);
});

test('should parse a sentence with two actions', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click on button and I type "foo" on input then it should be done',
  );

  const firstAction = sentence.when[0] as ActionStatement;
  expect(firstAction.action[0].value).toEqual('click');
  expect(firstAction.target[0].value).toEqual('button');
  expect(firstAction.args.length).toEqual(0);

  const secondAction = sentence.when[1] as ActionStatement;
  expect(secondAction.action[0].value).toEqual('type');
  expect(secondAction.target[0].value).toEqual('input');
  expect(secondAction.args[0].value).toEqual('"foo"');
});

test('should parse an action with quoted text argument', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click on button with text "submit" then it should be done',
  );

  const firstAction = sentence.when[0] as ActionStatement;
  expect(firstAction.target[0].value).toEqual('button');
  expect(firstAction.target[1].value).toEqual('with');
  expect(firstAction.target[2].value).toEqual('text');
  expect(firstAction.target[3].value).toEqual('"submit"');
});

test('should throw if parsing a sentence with invalid action', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I and foo then it should be done')).toThrow(
    `Missing action
Line 1, column 8:
when I and foo then it should be done
       ^`,
  );
});

test('should throw if parsing a sentence with "I" in action name', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I am I foo then it should be done')).toThrow(
    `Unexpected "I" in action name
Line 1, column 11:
when I am I foo then it should be done
          ^`,
  );
});

test('should throw if parsing a sentence with missing action', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I then it should be done')).toThrow(
    `Missing action
Line 1, column 8:
when I then it should be done
       ^`,
  );
});

test('should parse a sentence with an assertion', () => {
  const parser = new Parser();
  const sentence = parser.parse('when I click then dialog should be hidden');

  const assertion = sentence.then[0] as AssertionStatement;
  expect(assertion.target.map((a) => a.value)).toEqual(['dialog']);
  expect(assertion.assertion.map((a) => a.value)).toEqual(['be', 'hidden']);
});

test('should parse a sentence with an assertion with quoted text argument', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then message should have text "Hello, World!"',
  );

  const assertion = sentence.then[0] as AssertionStatement;
  expect(assertion.target.map((a) => a.value)).toEqual(['message']);
  expect(assertion.assertion.map((a) => a.value)).toEqual(['have', 'text']);
  expect(assertion.args.map((a) => a.value)).toEqual(['"Hello, World!"']);
});

test('should parse a sentence with two assertions', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then dialog should be hidden and button should be visible',
  );

  const firstAssertion = sentence.then[0] as AssertionStatement;
  expect(firstAssertion.target.map((a) => a.value)).toEqual(['dialog']);
  expect(firstAssertion.assertion.map((a) => a.value)).toEqual([
    'be',
    'hidden',
  ]);

  const secondAssertion = sentence.then[1] as AssertionStatement;
  expect(secondAssertion.target.map((a) => a.value)).toEqual(['button']);
  expect(secondAssertion.assertion.map((a) => a.value)).toEqual([
    'be',
    'visible',
  ]);
});

// TODO: should we allow this?
test.skip('should throw if parsing a sentence with invalid assertion', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then dialog and hidden'))
    .toThrow(`Expected "should"
Line 1, column 26:
when I click then dialog and hidden
                         ^`);
});

// TODO: should we allow this?
test.skip('should throw if parsing a sentence with missing assertion before and', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then dialog should and')).toThrow(
    `Missing assertion
Line 1, column 33:
when I click then dialog should and
                                ^`,
  );
});

// TODO: should we allow this?
test.skip('should throw if parsing a sentence with missing assertion', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then')).toThrow(
    `Missing assertion
Line 1, column 18:
when I click then
                 ^`,
  );
});

test('should parse a sentence with a system-level instruction', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'given system is "ready" when I click then it should be done',
  );
  expect(
    (sentence.given[0] as SystemLevelStatement).tokens.map((a) => a.value),
  ).toEqual(['system', 'is']);
  expect(
    (sentence.given[0] as SystemLevelStatement).args.map((a) => a.value),
  ).toEqual(['"ready"']);
});

test('should parse a sentence with a user action in a given', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'given I land on Mars when I leave then it should be done',
  );
  expect(
    (sentence.given[0] as ActionStatement).action.map((a) => a.value),
  ).toEqual(['land']);
  expect(
    (sentence.given[0] as ActionStatement).target.map((a) => a.value),
  ).toEqual(['Mars']);
});

test('should parse a sentence with a user action and a system state change in a given', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'given I login and system is "ready" when I leave then it should be done',
  );
  expect(
    (sentence.given[0] as ActionStatement).action.map((a) => a.value),
  ).toEqual(['login']);
  expect(
    (sentence.given[1] as SystemLevelStatement).tokens.map((a) => a.value),
  ).toEqual(['system', 'is']);
  expect(
    (sentence.given[1] as SystemLevelStatement).args.map((a) => a.value),
  ).toEqual(['"ready"']);
});

test('should parse a sentence with an action block', () => {
  const parser = new Parser();
  const sentence = parser.parse(`
    when I long press on button
    then it should be red
    done

    In order to long press on it:
    - I press mouse button on it
    - I wait 1 second
    - I release mouse button on it
    done
  `);

  expect(sentence.then.length).toEqual(1);

  expect(sentence.blocks.length).toEqual(1);
  expect(sentence.blocks[0].kind).toEqual('action-block');
  expect(sentence.blocks[0].header.map((a) => a.value)).toEqual([
    'long',
    'press',
    'on',
    'it',
  ]);
  expect(sentence.blocks[0].body.length).toEqual(3);
});

test('should parse a sentence with an assertion block', () => {
  const parser = new Parser();
  const sentence = parser.parse(`
    when I click on button
    then it should be red
    done

    For element to be red:
    - it should have class "red"
    done
  `);

  expect(sentence.then.length).toEqual(1);

  expect(sentence.blocks.length).toEqual(1);
  expect(sentence.blocks[0].kind).toEqual('assertion-block');
  expect(sentence.blocks[0].header.map((a) => a.value)).toEqual(['be', 'red']);
  expect(sentence.blocks[0].body.length).toEqual(1);
});
