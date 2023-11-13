import { tokenize } from './tokenizer';
import { expect, test } from '@jest/globals';

test('should tokenize an empty sentence', () => {
  expect(tokenize('')).toEqual([]);
});

test('should tokenize a sentence with one word', () => {
  expect(tokenize('foo')).toEqual([
    {
      value: 'foo',
      line: 1,
      column: 1,
    },
  ]);
});

test('should tokenize a sentence with two words', () => {
  expect(tokenize('foo bar')).toEqual([
    {
      value: 'foo',
      line: 1,
      column: 1,
    },
    {
      value: 'bar',
      line: 1,
      column: 5,
    },
  ]);
});

test('should tokenize a sentence with two words and a newline', () => {
  expect(tokenize('foo\nbar')).toEqual([
    {
      value: 'foo',
      line: 1,
      column: 1,
    },
    {
      value: 'bar',
      line: 2,
      column: 1,
    },
  ]);
});

test('should tokenize a sentence with quoted text', () => {
  expect(tokenize('message is "Hello, World!"')).toEqual([
    {
      value: 'message',
      line: 1,
      column: 1,
    },
    {
      value: 'is',
      line: 1,
      column: 9,
    },
    {
      value: '"Hello, World!"',
      line: 1,
      column: 11,
    },
  ]);
});

test('should ignore comments', () => {
  expect(tokenize('foo bar//baz')).toEqual([
    {
      value: 'foo',
      line: 1,
      column: 1,
    },
    {
      value: 'bar',
      line: 1,
      column: 5,
    },
  ]);
});

test('should ignore comments with newlines', () => {
  expect(tokenize('foo bar//baz\nqux')).toEqual([
    {
      value: 'foo',
      line: 1,
      column: 1,
    },
    {
      value: 'bar',
      line: 1,
      column: 5,
    },
    {
      value: 'qux',
      line: 2,
      column: 1,
    },
  ]);
});

test('should ignore comments with newlines and carriage returns', () => {
  expect(tokenize('foo bar//baz\r\nqux')).toEqual([
    {
      value: 'foo',
      line: 1,
      column: 1,
    },
    {
      value: 'bar',
      line: 1,
      column: 5,
    },
    {
      value: 'qux',
      line: 2,
      column: 1,
    },
  ]);
});

test('should throw an error when a quoted text is not closed', () => {
  expect(() => tokenize('foo "bar\nbaz')).toThrow('Missing closing "');
});

test('should throw an error when a quoted text is not closed at the end of the sentence', () => {
  expect(() => tokenize('foo "bar')).toThrow('Missing closing "');
});
