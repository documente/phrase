import { isQuoted, unquoted } from './quoted-text';
import { expect, test } from '@jest/globals';

test('isQuoted should detect a quoted string', () => {
  expect(isQuoted('"foo"')).toEqual(true);
  expect(isQuoted("'foo'")).toEqual(true);
});

test('isQuoted should detect a non-quoted string', () => {
  expect(isQuoted('foo')).toEqual(false);
  expect(isQuoted('foo"')).toEqual(false);
  expect(isQuoted('"foo')).toEqual(false);
  expect(isQuoted('foo"')).toEqual(false);
  expect(isQuoted("foo'")).toEqual(false);
  expect(isQuoted('\'foo"')).toEqual(false);
  expect(isQuoted('"foo\'')).toEqual(false);
});

test('unquoted should remove quotes from a quoted string', () => {
  expect(unquoted('"foo"')).toEqual('foo');
  expect(unquoted("'foo'")).toEqual('foo');
});

test('unquoted should not remove quotes from a non-quoted string', () => {
  expect(unquoted('foo')).toEqual('foo');
  expect(unquoted('foo"')).toEqual('foo"');
  expect(unquoted('"foo')).toEqual('"foo');
  expect(unquoted('foo"')).toEqual('foo"');
  expect(unquoted("foo'")).toEqual("foo'");
  expect(unquoted('\'foo"')).toEqual('\'foo"');
  expect(unquoted('"foo\'')).toEqual('"foo\'');
});
