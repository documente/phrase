import {ActionStatement, Parser, SystemLevelStatement} from './parser';
import { expect, test } from '@jest/globals';

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

  expect(sentence.actions).toEqual([
    {
      kind: 'action',
      target: [],
      action: [
        {
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
  expect(sentence.actions).toEqual([
    {
      kind: 'action',
      target: [
        {
          column: 17,
          line: 1,
          value: 'button',
        },
      ],
      action: [
        {
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

  expect(sentence.actions).toEqual([
    {
      kind: 'action',
      target: [
        {
          column: 22,
          line: 1,
          value: 'input',
        },
      ],
      action: [
        {
          column: 8,
          line: 1,
          value: 'type',
        },
      ],
      args: [
        {
          column: 12,
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

  expect(sentence.actions[0].action[0].value).toEqual('click');
  expect(sentence.actions[0].target[0].value).toEqual('button');
  expect(sentence.actions[0].args.length).toEqual(0);

  expect(sentence.actions[1].action[0].value).toEqual('type');
  expect(sentence.actions[1].target[0].value).toEqual('input');
  expect(sentence.actions[1].args[0].value).toEqual('"foo"');
});

test('should parse an action with quoted text argument', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when click on button with text "submit" then it should be done',
  );
  expect(sentence.actions[0].target[0].value).toEqual('button');
  expect(sentence.actions[0].target[1].value).toEqual('with');
  expect(sentence.actions[0].target[2].value).toEqual('text');
  expect(sentence.actions[0].target[3].value).toEqual('"submit"');
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

  expect(sentence.assertions[0].target.map((a) => a.value)).toEqual(['dialog']);
  expect(sentence.assertions[0].assertion.map((a) => a.value)).toEqual([
    'be',
    'hidden',
  ]);
});

test('should parse a sentence with an assertion with quoted text argument', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then message should have text "Hello, World!"',
  );

  expect(sentence.assertions[0].target.map((a) => a.value)).toEqual([
    'message',
  ]);
  expect(sentence.assertions[0].assertion.map((a) => a.value)).toEqual([
    'have',
    'text',
  ]);
  expect(sentence.assertions[0].args.map((a) => a.value)).toEqual([
    '"Hello, World!"',
  ]);
});

test('should parse a sentence with two assertions', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then dialog should be hidden and button should be visible',
  );

  expect(sentence.assertions[0].target.map((a) => a.value)).toEqual(['dialog']);
  expect(sentence.assertions[0].assertion.map((a) => a.value)).toEqual([
    'be',
    'hidden',
  ]);

  expect(sentence.assertions[1].target.map((a) => a.value)).toEqual(['button']);
  expect(sentence.assertions[1].assertion.map((a) => a.value)).toEqual([
    'be',
    'visible',
  ]);
});

test('should throw if parsing a sentence with invalid assertion', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then dialog and hidden'))
    .toThrow(`Expected "should"
Line 1, column 26:
when I click then dialog and hidden
                         ^`);
});

test('should throw if parsing a sentence with missing assertion', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then dialog should and')).toThrow(
    `Missing assertion
Line 1, column 33:
when I click then dialog should and
                                ^`,
  );
});

test('should throw if parsing a sentence with missing assertion', () => {
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
  const sentence = parser.parse('given system is "ready" when I click then it should be done');
  expect((sentence.prerequisites[0] as SystemLevelStatement).tokens.map((a) => a.value)).toEqual([
    'system',
    'is',
  ]);
  expect((sentence.prerequisites[0] as SystemLevelStatement).args.map((a) => a.value)).toEqual([
    '"ready"',
  ]);
});

test('should parse a sentence with a user action in a given', () => {
  const parser = new Parser();
  const sentence = parser.parse('given I land on Mars when I leave then it should be done');
  expect((sentence.prerequisites[0] as ActionStatement).action.map((a) => a.value)).toEqual([
      'land'
  ]);
  expect((sentence.prerequisites[0] as ActionStatement).target.map((a) => a.value)).toEqual([
    'Mars'
  ]);
});

test('should parse a sentence with a user action and a system state change in a given', () => {
const parser = new Parser();
  const sentence = parser.parse('given I login and system is "ready" when I leave then it should be done');
  expect((sentence.prerequisites[0] as ActionStatement).action.map((a) => a.value)).toEqual([
    'login'
  ]);
  expect((sentence.prerequisites[1] as SystemLevelStatement).tokens.map((a) => a.value)).toEqual([
    'system',
    'is',
  ]);
  expect((sentence.prerequisites[1] as SystemLevelStatement).args.map((a) => a.value)).toEqual([
    '"ready"',
  ]);
});