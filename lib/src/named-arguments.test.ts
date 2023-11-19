import {interpolate, isNamedArgument, withoutMoustaches} from './named-arguments';
import {expect} from '@jest/globals';

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
    { input: '{{foo}} {{baz}} {{quux}}', expected: 'bar qux {{quux}}' },
  ].forEach(({ input, expected }) => {
    expect(interpolate(input, args)).toEqual(expected);
  });
});
