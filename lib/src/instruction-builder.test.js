import { buildInstructions } from './instruction-builder.js';

test('should throw if action target cannot be resolved', () => {
  const tree = {};
  expect(() =>
    buildInstructions(
      'when I click on form button then it should be done',
      tree,
    ),
  ).toThrow('Could not resolve target path for "form button"');
});

test('should throw if action in unknown', () => {
  const tree = {
    form: {
      button: {},
    },
  };

  expect(() =>
    buildInstructions(
      'when I foobar on form button then it should be done',
      tree,
    ),
  ).toThrow('Unknown action "foobar"');
});

test('should build an action without arguments', () => {
  const tree = {
    form: {
      button: {},
    },
  };

  const instructions = buildInstructions(
    'when I click on form button then it should be done',
    tree,
  );
  expect(instructions).toEqual([
    {
      target: ['form', 'button'],
      action: 'click',
      args: [],
    },
  ]);
});

test('should build an action with arguments', () => {
  const tree = {
    form: {
      button: {},
    },
  };

  const instructions = buildInstructions(
    'when I type "foo" on form button then it should be done',
    tree,
  );
  expect(instructions).toEqual([
    {
      target: ['form', 'button'],
      action: 'type',
      args: ['"foo"'],
    },
  ]);
});
