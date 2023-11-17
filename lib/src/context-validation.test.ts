import {Context} from './context.interface';
import { test, expect } from '@jest/globals';
import {validateContext} from './context-validation';

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
        field: (name: string) => {},
        label: {
          _selector: () => 'label',
          shouldHaveText(self, text: string) {}
        }
      },
    },
  };

  expect(() => validateContext(context)).not.toThrow();
});

test('should throw if pageObjectTree is missing', () => {
  // @ts-expect-error
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
  };

  expect(() => validateContext(context)).toThrow('pageObjectTree is required');
});

test('should throw if systemActions is missing', () => {
  // @ts-expect-error
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
      // @ts-expect-error
      action1: 'not a function',
    },
    pageObjectTree: {
      form: {
        _selector: 'form',
        button: 'button',
      },
    },
  };

  expect(() => validateContext(context)).toThrow('systemActions.action1 must be a function');
});

test('should throw if pageObjectTree contains null nodes', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
    pageObjectTree: {
      // @ts-expect-error
      form: null,
    },
  };

  expect(() => validateContext(context)).toThrow('Page object node must not be null or undefined at path form');
});

test('should throw if pageObjectTree contains number nodes', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
    pageObjectTree: {
      // @ts-expect-error
      form: 1,
    },
  };

  expect(() => validateContext(context)).toThrow('Page object node must be either a string, function or an object at path form');
});

test('should throw if pageObjectTree contains invalid selector', () => {
  const context: Context = {
    systemActions: {
      action1: () => {},
    },
    pageObjectTree: {
      form: {
        // @ts-expect-error
        _selector: 1,
        button: 'button',
      },
    },
  };

  expect(() => validateContext(context)).toThrow('Page object node selector must be either a string or a function at path form._selector');
});
