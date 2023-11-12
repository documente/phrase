import { Parser } from './parser.js';

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
      target: [],
      action: [
        {
          column: 8,
          line: 1,
          value: 'click',
        },
      ],
      args: [],
    },
  ]);
});

test('should parse a sentence with an action with a target and without args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click on button then it should be done',
  );
  expect(sentence.actions).toEqual([
    {
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
    },
  ]);
});

test('should parse a sentence with an action with a target and with args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I type "foo" on input then it should be done',
  );

  expect(sentence.actions).toEqual([
    {
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
          column: 13,
          line: 1,
          value: '"foo"',
        },
      ],
    },
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

test('should throw if parsing a sentence with invalid action', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I and foo then it should be done')).toThrow(
    `Expected action
Line 1, column 8:
when I and foo then it should be done
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
