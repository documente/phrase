import { expect, test } from '@jest/globals';
import {
  resolve,
  resolvePath,
  resolvePathRecursively,
  splitOnQuotedText,
} from './resolver';

test('resolvePath should resolve a root node', () => {
  const tree = {
    foo: {
      bar: {},
    },
    bar: {},
  };
  const result = resolvePath(tree, ['foo']);
  expect(result).toEqual({
    key: 'foo',
    fragments: ['foo'],
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
    key: 'welcomeMessage',
    fragments: ['welcome', 'message'],
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
  expect(result?.map((r) => r.key)).toEqual(['foo', 'bar']);
});

test('resolvePathRecursively should resolve a nested node with composed tokens', () => {
  const tree = {
    welcome: {
      message: { foo: {} },
    },
    welcomeMessage: { foo: {} },
  };
  const result = resolvePathRecursively(tree, ['welcome', 'message', 'foo']);
  expect(result?.map((r) => r.key)).toEqual(['welcomeMessage', 'foo']);
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

  const result = resolve(
    tree,
    ['foo', 'bar'],
    [
      {
        key: 'welcome',
        fragments: ['welcome'],
      },
    ],
  );
  expect(result?.map((r) => r.key)).toEqual(['welcome', 'foo', 'bar']);
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

  const result = resolve(
    tree,
    ['foo', 'bar'],
    [
      {
        key: 'welcome',
        fragments: ['welcome'],
      },
      {
        key: 'bar',
        fragments: ['bar'],
      },
    ],
  );
  expect(result?.map((r) => r.key)).toEqual(['welcome', 'foo', 'bar']);
});

test('resolve should ignore previous and find from root', () => {
  const tree = {
    welcome: {
      foo: { bar: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(
    tree,
    ['bar', 'baz'],
    [
      {
        key: 'welcome',
        fragments: ['welcome'],
      },
    ],
  );
  expect(result?.map((r) => r.key)).toEqual(['bar', 'baz']);
});

test('resolve should ignore previous and previous parent and find from root', () => {
  const tree = {
    welcome: {
      message: '.message',
      foo: { bar: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(
    tree,
    ['bar', 'baz'],
    [
      {
        key: 'welcome',
        fragments: ['welcome'],
      },
      {
        key: 'message',
        fragments: ['message'],
      },
    ],
  );
  expect(result?.map((r) => r.key)).toEqual(['bar', 'baz']);
});

test('resolve should throw if previous node is not found', () => {
  const tree = {
    welcomeMessage: { foo: {} },
  };

  expect(() =>
    resolve(
      tree,
      ['foo'],
      [
        {
          key: 'welcome',
          fragments: ['welcome'],
        },
      ],
    ),
  ).toThrow('Could not find node at path welcome');
});

test('splitOnQuotedText should group segments with quoted text', () => {
  const result = splitOnQuotedText(['foo', 'bar', '"baz"', 'foobar']);
  expect(result).toEqual([
    { segments: ['foo', 'bar'], arg: '"baz"' },
    { segments: ['foobar'] },
  ]);
});

test('splitOnQuotedText should group segments with quoted text at the end', () => {
  const result = splitOnQuotedText([
    'foo',
    'bar',
    '"baz"',
    'foobar',
    '"barbaz"',
  ]);
  expect(result).toEqual([
    { segments: ['foo', 'bar'], arg: '"baz"' },
    { segments: ['foobar'], arg: '"barbaz"' },
  ]);
});

test('resolveRecursively should resolve a nested node with quoted text', () => {
  const tree = {
    welcomeMessage: { foo: {} },
  };
  const result = resolvePathRecursively(tree, [
    'welcome',
    'message',
    '"foo"',
    'foo',
  ]);
  expect(result?.map((r) => r.key)).toEqual(['welcomeMessage', 'foo']);
});

test('resolve should resolve in child of previous node when path starts with its', () => {
  const tree = {
    welcomeMessage: { foo: {} },
  };
  const result = resolve(
    tree,
    ['its', 'foo'],
    [
      {
        key: 'welcomeMessage',
        fragments: ['welcome', 'message'],
      },
    ],
  );
  expect(result?.map((r) => r.key)).toEqual(['welcomeMessage', 'foo']);
});

test('resolve should throw if using its without child path', () => {
  const tree = {
    welcomeMessage: { foo: {} },
  };
  expect(() =>
    resolve(
      tree,
      ['its'],
      [
        {
          key: 'welcomeMessage',
          fragments: ['welcome', 'message'],
        },
      ],
    ),
  ).toThrow('Expected child path after "its" but got nothing');
});

test('resolve should throw if cannot find child node using its', () => {
  const tree = {
    welcomeMessage: { foo: {} },
  };
  expect(() =>
    resolve(
      tree,
      ['its', 'bar'],
      [
        {
          key: 'welcomeMessage',
          fragments: ['welcome', 'message'],
        },
      ],
    ),
  ).toThrow('Cannot find child node at path welcome message bar');
});

test('resolve should throw if using its without previous path', () => {
  const tree = {
    welcomeMessage: { foo: {} },
  };
  expect(() => resolve(tree, ['its', 'foo'], [])).toThrow(
    'Cannot use "its" without a previous path',
  );
});
