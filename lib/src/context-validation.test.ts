import { test, expect } from '@jest/globals';
import { validateContext } from './context-validation';
import { Context } from './interfaces/context.interface';

test('should validate context with valid systemActions and pageObjectTree', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
      action2: () => {},
    },
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
        field: () => 'field',
        label: {
          _selector: () => 'label',
          shouldHaveText() {},
        },
      },
    },
  };

  expect(() => validateContext(context)).not.toThrow();
});

test('should throw if pageObjectTree is missing', () => {
  // @ts-expect-error - testing invalid context
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
  };

  expect(() => validateContext(context)).toThrow('pageObjectTree is required');
});

test('should throw if systemActions is missing', () => {
  // @ts-expect-error - testing invalid context
  const context: Context = {
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
      },
    },
  };

  expect(() => validateContext(context)).toThrow('systemActions is required');
});

test('should throw if systemActions contains non-function values', () => {
  const context: Context = {
    systemActions: {
      // @ts-expect-error - testing invalid context
      action1: 'not a function',
    },
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
      },
    },
  };

  expect(() => validateContext(context)).toThrow(
    'systemActions.action1 must be a function',
  );
});

test('should throw if pageObjectTree contains null nodes', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
    pageObjectTree: {
      // @ts-expect-error - testing invalid selector
      form: null,
    },
  };

  expect(() => validateContext(context)).toThrow(
    'Page object node must not be null or undefined at path form',
  );
});

test('should throw if pageObjectTree contains number nodes', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
    pageObjectTree: {
      // @ts-expect-error - testing invalid selector
      form: 1,
    },
  };

  expect(() => validateContext(context)).toThrow(
    'Page object node must be either a string, function or an object at path form',
  );
});

test('should throw if pageObjectTree contains invalid selector', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
    pageObjectTree: {
      form: {
        // @ts-expect-error - testing invalid selector
        _selector: 1,
        button: 'button',
      },
    },
  };

  expect(() => validateContext(context)).toThrow(
    'Page object node selector must be either a string or a function at path form._selector',
  );
});

test('should throw if pageObjectTree contains empty string node', () => {
  const context: Context = {
    systemActions: {},
    pageObjectTree: {
      form: '',
    },
  };

  expect(() => validateContext(context)).toThrow(
    'Page object node must not be empty string at path form',
  );
});

test('should throw if pageObjectTree contains empty string selector', () => {
  const context: Context = {
    systemActions: {},
    pageObjectTree: {
      form: {
        _selector: '',
        button: 'button',
      },
    },
  };

  expect(() => validateContext(context)).toThrow(
    'Page object node selector must not be empty string at path form._selector',
  );
});

test('should report ambiguous paths', () => {
  const context: Context = {
    systemActions: {},
    pageObjectTree: {
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
    },
  };

  expect(() => validateContext(context)).toThrow(
    'Ambiguous page object paths detected: "form button", "foo bar", "foo bar baz". ' +
      'Please use unique page object paths.',
  );
});
