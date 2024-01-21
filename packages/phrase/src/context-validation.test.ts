import { test, expect } from '@jest/globals';
import { validateContext } from './context-validation';
import { SelectorTree } from './interfaces/selector-tree.interface';

test('should validate context with valid externals and selector tree', () => {
  const tree: SelectorTree = {
    form: {
      _selector: 'form',
      button: 'button',
      field: () => 'field',
      label: {
        _selector: () => 'label',
      },
    },
  };

  expect(() => validateContext(tree, {})).not.toThrow();
});

test('should throw if selector tree is missing', () => {
  // @ts-expect-error - testing invalid tree
  expect(() => validateContext(null, {})).toThrow('Selector tree is required');
});

test('should throw if externals contains non-function values', () => {
  expect(() =>
    validateContext(
      {},
      {
        // @ts-expect-error - testing invalid context
        action1: 123456,
      },
    ),
  ).toThrow('externals.action1 must be a function');
});

test('should throw if selector tree contains null nodes', () => {
  const tree: SelectorTree = {
    // @ts-expect-error - testing invalid selector
    form: null,
  };

  expect(() => validateContext(tree, {})).toThrow(
    'Selector tree node must not be null or undefined at path form',
  );
});

test('should throw if selector tree contains number nodes', () => {
  const tree: SelectorTree = {
    // @ts-expect-error - testing invalid selector
    form: 1,
  };

  expect(() => validateContext(tree, {})).toThrow(
    'Selector tree node must be either a string, function or an object at path form',
  );
});

test('should throw if selector tree contains invalid selector', () => {
  const tree: SelectorTree = {
    form: {
      // @ts-expect-error - testing invalid selector
      _selector: 1,
      button: 'button',
    },
  };

  expect(() => validateContext(tree, {})).toThrow(
    'Selector tree node selector must be either a string or a function at path form._selector',
  );
});

test('should throw if selector tree contains empty string node', () => {
  const tree: SelectorTree = {
    form: '',
  };

  expect(() => validateContext(tree, {})).toThrow(
    'Selector tree node must not be empty string at path form',
  );
});

test('should throw if selector tree contains empty string selector', () => {
  const tree: SelectorTree = {
    form: {
      _selector: '',
      button: 'button',
    },
  };

  expect(() => validateContext(tree, {})).toThrow(
    'Selector tree node selector must not be empty string at path form._selector',
  );
});

test('should report ambiguous paths', () => {
  const tree: SelectorTree = {
    form: {
      button: 'button',
    },
    'form button': {
      _selector: 'form button',
    },
    foo: {
      bar: {
        baz: {},
      },
      'bar baz': 'bar baz',
    },
    fooBar: {
      baz: {},
    },
  };

  expect(() => validateContext(tree, {})).toThrow(
    'Ambiguous selector tree paths detected: "form button", "foo bar", "foo bar baz". ' +
      'Please use unique selector tree paths.',
  );
});
