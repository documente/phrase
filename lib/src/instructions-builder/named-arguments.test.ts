import {
  interpolate,
  isNamedArgument,
  withoutMoustaches,
} from './named-arguments';
import { expect, test } from '@jest/globals';

test('isNamedArgument should return true if string starts and ends with {{}}', () => {
  [
    { input: '{{foo}}', expected: true },
    { input: '{{foo', expected: false },
    { input: 'foo}}', expected: false },
    { input: 'foo', expected: false },
  ].forEach(({ input, expected }) => {
    expect(isNamedArgument(input)).toEqual(expected);
  });
});

test('withoutMoustaches should remove moustaches from string', () => {
  [
    { input: '{{foo}}', expected: 'foo' },
    { input: '{{foo', expected: '{{foo' },
    { input: 'foo}}', expected: 'foo}}' },
    { input: 'foo', expected: 'foo' },
  ].forEach(({ input, expected }) => {
    expect(withoutMoustaches(input)).toEqual(expected);
  });
});

test('interpolate should replace named arguments with values', () => {
  const args = {
    foo: 'bar',
    baz: 'qux',
  };

  [
    { input: '{{foo}}', expected: 'bar' },
    { input: '{{foo}} {{baz}}', expected: 'bar qux' },
  ].forEach(({ input, expected }) => {
    expect(
      interpolate(
        input,
        args,
        {
          line: 0,
          column: 0,
          value: input,
          kind: 'generic',
          index: 0,
        },
        input,
      ),
    ).toEqual(expected);
  });
});

test('interpolate should throw an error if named argument is not defined', () => {
  const args = {
    foo: 'bar',
    baz: 'qux',
  };

  const input = 'foo{{foo}}{{quux}}';
  expect(() =>
    interpolate(
      input,
      args,
      {
        line: 1,
        column: 1,
        value: input,
        kind: 'generic',
        index: 0,
      },
      input,
    ),
  ).toThrow(`Unknown argument "quux"
Line 1, column 11:
foo{{foo}}{{quux}}
          ^`);
});
