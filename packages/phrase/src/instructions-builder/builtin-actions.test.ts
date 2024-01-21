import { expect, test } from '@jest/globals';
import { getMatchResult, QualifiedPatternPart } from './builtin-actions';
import { Token } from '../interfaces/token.interface';

test('should detect builtin actions without argument and without target', () => {
  const tokens: Token[] = [
    { kind: 'generic', value: 'go', line: 1, column: 1, index: 0 },
    { kind: 'generic', value: 'back', line: 1, column: 4, index: 0 },
  ];
  const parts: QualifiedPatternPart[] = [{ kind: 'text', value: 'go back' }];

  expect(getMatchResult(tokens, parts)).toEqual({
    target: [],
    args: [],
  });
});

test('should detect builtin actions without argument and with target', () => {
  const tokens: Token[] = [
    { kind: 'generic', value: 'check', line: 1, column: 1, index: 0 },
    { kind: 'generic', value: 'task', line: 1, column: 6, index: 0 },
    { kind: 'generic', value: 'with', line: 1, column: 9, index: 0 },
    { kind: 'generic', value: 'text', line: 1, column: 14, index: 0 },
    { kind: 'generic', value: '"foo"', line: 1, column: 19, index: 0 },
  ];
  const parts: QualifiedPatternPart[] = [
    { kind: 'text', value: 'check' },
    { kind: 'target' },
  ];
  const result = getMatchResult(tokens, parts)!;
  expect(result.target.map((token) => token.value)).toEqual([
    'task',
    'with',
    'text',
    '"foo"',
  ]);
  expect(result.args).toEqual([]);
});

test('should detect builtin actions with argument and with target and preposition', () => {
  const tokens: Token[] = [
    { kind: 'generic', value: 'select', line: 1, column: 1, index: 0 },
    { kind: 'generic', value: '"foo"', line: 1, column: 8, index: 0 },
    { kind: 'generic', value: 'in', line: 1, column: 14, index: 0 },
    { kind: 'generic', value: 'bar', line: 1, column: 17, index: 0 },
    { kind: 'generic', value: 'select', line: 1, column: 21, index: 0 },
  ];
  const parts: QualifiedPatternPart[] = [
    { kind: 'text', value: 'select' },
    { kind: 'arg' },
    { kind: 'text', value: 'in' },
    { kind: 'target' },
  ];
  const result = getMatchResult(tokens, parts)!;
  expect(result.target.map((token) => token.value)).toEqual(['bar', 'select']);
  expect(result.args.map((token) => token.value)).toEqual(['"foo"']);
});

test('should not match if argument is not provided', () => {
  const tokens: Token[] = [
    { kind: 'generic', value: 'select', line: 1, column: 1, index: 0 },
    { kind: 'generic', value: 'in', line: 1, column: 8, index: 0 },
    { kind: 'generic', value: 'bar', line: 1, column: 11, index: 0 },
    { kind: 'generic', value: 'select', line: 1, column: 15, index: 0 },
  ];
  const parts: QualifiedPatternPart[] = [
    { kind: 'text', value: 'select' },
    { kind: 'arg' },
    { kind: 'text', value: 'in' },
    { kind: 'target' },
  ];
  expect(getMatchResult(tokens, parts)).toBeNull();
});
