import { tokenize } from './tokenizer';
import { expect, test } from '@jest/globals';
import { Token } from './interfaces/token.interface';

test('should tokenize an empty sentence', () => {
  expect(tokenize('')).toEqual([]);
});

test('should tokenize a sentence with one word', () => {
  expect(tokenize('foo')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
  ]);
});

test('should tokenize a sentence with two words', () => {
  expect(tokenize('foo bar')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'bar',
      line: 1,
      column: 5,
      index: 4,
    } satisfies Token,
  ]);
});

test('should tokenize a sentence with two words and a newline', () => {
  expect(tokenize('foo\nbar')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'bar',
      line: 2,
      column: 1,
      index: 4,
    } satisfies Token,
  ]);
});

test('should tokenize a sentence with quoted text', () => {
  expect(tokenize('message is "Hello, World!"')).toEqual([
    {
      kind: 'generic',
      value: 'message',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'is',
      line: 1,
      column: 9,
      index: 8,
    } satisfies Token,
    {
      kind: 'generic',
      value: '"Hello, World!"',
      line: 1,
      column: 12,
      index: 11,
    } satisfies Token,
  ]);
});

test('should ignore comments', () => {
  expect(tokenize('foo bar//baz')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'bar',
      line: 1,
      column: 5,
      index: 4,
    } satisfies Token,
  ]);
});

test('should ignore comments with newlines', () => {
  expect(tokenize('foo bar//baz\nqux')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'bar',
      line: 1,
      column: 5,
      index: 4,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'qux',
      line: 2,
      column: 1,
      index: 13,
    } satisfies Token,
  ]);
});

test('should ignore comments with newlines and carriage returns', () => {
  expect(tokenize('foo bar//baz\r\nqux')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'bar',
      line: 1,
      column: 5,
      index: 4,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'qux',
      line: 2,
      column: 1,
      index: 14,
    } satisfies Token,
  ]);
});

test('should detect a bullet token', () => {
  expect(tokenize('foo\n- bar')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'bullet',
      value: '-',
      line: 2,
      column: 1,
      index: 4,
    } satisfies Token,
    {
      kind: 'generic',
      value: 'bar',
      line: 2,
      column: 3,
      index: 6,
    } satisfies Token,
  ]);
});

test('should tokenize "-" as a generic token', () => {
  expect(tokenize('foo -')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: '-',
      line: 1,
      column: 5,
      index: 4,
    } satisfies Token,
  ]);
});

test('should throw an error when a quoted text is not closed', () => {
  expect(() => tokenize('foo "bar\nbaz')).toThrow('Missing closing "');
});

test('should throw an error when a quoted text is not closed at the end of the sentence', () => {
  expect(() => tokenize('foo "bar')).toThrow('Missing closing "');
});

test('should escape a double quote inside a quoted text', () => {
  expect(tokenize('foo "bar \\" baz"')).toEqual([
    {
      kind: 'generic',
      value: 'foo',
      line: 1,
      column: 1,
      index: 0,
    } satisfies Token,
    {
      kind: 'generic',
      value: '"bar \\" baz"',
      line: 1,
      column: 5,
      index: 4,
    } satisfies Token,
  ]);
});
