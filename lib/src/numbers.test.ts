import { isParsableAsNumber } from './numbers';
import { expect, test } from '@jest/globals';

test('isParsableAsNumber should detect numbers', () => {
  expect(isParsableAsNumber('0')).toBe(true);
  expect(isParsableAsNumber('1')).toBe(true);
  expect(isParsableAsNumber('1.1')).toBe(true);
  expect(isParsableAsNumber('0x1')).toBe(true);
  expect(isParsableAsNumber('0b1')).toBe(true);
  expect(isParsableAsNumber('0o1')).toBe(true);
  expect(isParsableAsNumber('1e1')).toBe(true);
  expect(isParsableAsNumber('1e-1')).toBe(true);
  expect(isParsableAsNumber('1e+1')).toBe(true);
  expect(isParsableAsNumber('1E1')).toBe(true);
  expect(isParsableAsNumber('1E-1')).toBe(true);
  expect(isParsableAsNumber('1E+1')).toBe(true);
  expect(isParsableAsNumber('01')).toBe(true);

  expect(isParsableAsNumber('')).toBe(false);
  expect(isParsableAsNumber('1.1.1')).toBe(false);
  expect(isParsableAsNumber('1,000')).toBe(false);
  expect(isParsableAsNumber('foo')).toBe(false);
});
