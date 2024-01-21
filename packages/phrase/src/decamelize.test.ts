import { expect, test } from '@jest/globals';
import { decamelize } from './decamelize';

test('decamelize should decamelize a string', () => {
  [
    { input: 'fooBar', expectedOutput: 'foo Bar' },
    { input: 'fooBar Baz', expectedOutput: 'foo Bar Baz' },
    { input: 'FooBAR', expectedOutput: 'Foo BAR' },
    { input: 'foo2Bar', expectedOutput: 'foo2 Bar' },
    { input: 'foo bar Baz', expectedOutput: 'foo bar Baz' },
  ].forEach(({ input, expectedOutput }) => {
    expect(decamelize(input)).toEqual(expectedOutput);
  });
});
