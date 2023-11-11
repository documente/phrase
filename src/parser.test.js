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
  expect(parser.parse('when I click')).toEqual({
    actions: [
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
    ],
    assertions: [],
  });
});

test('should parse a sentence with an action with a target and without args', () => {
  const parser = new Parser();
  expect(parser.parse('when I click on button')).toEqual({
    actions: [
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
    ],
    assertions: [],
  });
});

test('should parse a sentence with an action with a target and with args', () => {
  const parser = new Parser();
  expect(parser.parse('when I type "foo" on input')).toEqual({
    actions: [
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
    ],
    assertions: [],
  });
});
