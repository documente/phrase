import { resolve, resolvePath, resolvePathRecursively } from './resolver.js';

test('resolvePath should resolve a root node', () => {
  const tree = {
    foo: {
      bar: {},
    },
    bar: {},
  };
  const result = resolvePath(tree, ['foo']);
  expect(result).toEqual({
    matchingKey: 'foo',
    consumedLength: 1,
  });
});

test('resolvePath should resolve a root node with composed tokens', () => {
  const tree = {
    welcome: {
      message: {},
    },
    welcomeMessage: {},
  };
  const result = resolvePath(tree, ['welcome', 'message']);
  expect(result).toEqual({
    matchingKey: 'welcomeMessage',
    consumedLength: 2,
  });
});

test('resolvePath should return undefined when no match is found', () => {
  const tree = {
    foo: {},
    bar: {},
  };

  const result = resolvePath(tree, ['baz']);
  expect(result).toEqual(undefined);
});

test('resolvePathRecursively should resolve a nested node', () => {
  const tree = {
    foo: {
      bar: {},
    },
    bar: {},
  };
  const result = resolvePathRecursively(tree, ['foo', 'bar']);
  expect(result).toEqual(['foo', 'bar']);
});

test('resolvePathRecursively should resolve a nested node with composed tokens', () => {
  const tree = {
    welcome: {
      message: { foo: {} },
    },
    welcomeMessage: { foo: {} },
  };
  const result = resolvePathRecursively(tree, ['welcome', 'message', 'foo']);
  expect(result).toEqual(['welcomeMessage', 'foo']);
});

test('resolvePathRecursively should throw error if no match is found', () => {
  const tree = {
    welcome: {
      message: { foo: {} },
    },
    welcomeMessage: { foo: {} },
  };

  const result = resolvePathRecursively(tree, ['foo']);
  expect(result).toBeUndefined();
});

test('resolve should find among previous node descendants', () => {
  const tree = {
    welcome: {
      foo: { bar: {} },
      bar: { baz: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, ['foo', 'bar'], ['welcome']);
  expect(result).toEqual(['welcome', 'foo', 'bar']);
});

test("resolve should find among previous' parent descendants", () => {
  const tree = {
    welcome: {
      foo: { bar: {} },
      bar: { baz: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, ['foo', 'bar'], ['welcome']);
  expect(result).toEqual(['welcome', 'foo', 'bar']);
});

test('resolve should ignore previous and find from root', () => {
  const tree = {
    welcome: {
      foo: { bar: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, ['bar', 'baz'], ['welcome']);
  expect(result).toEqual(['bar', 'baz']);
});
