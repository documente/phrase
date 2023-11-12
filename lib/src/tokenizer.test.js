import { tokenize } from './tokenizer';

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
      column: 12,
    },
  ]);
});