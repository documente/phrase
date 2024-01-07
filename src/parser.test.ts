import { Parser } from './parser';
import { expect, test } from '@jest/globals';
import {
  ActionStatement,
  AssertionStatement,
  Block,
  GivenWhenThenStatements,
  SystemLevelStatement,
} from './interfaces/statements.interface';

test('should throw if parsing an empty sentence', () => {
  const parser = new Parser();
  expect(() => parser.parse('')).toThrow('Empty sentence');
});

test('should parse a sentence with an action without target and without args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then it should be done',
  )[0] as GivenWhenThenStatements;

  expect(sentence.when).toEqual([
    {
      kind: 'action',
      tokens: [
        {
          kind: 'generic',
          column: 8,
          line: 1,
          value: 'click',
          index: 7,
        },
      ],
      index: 7,
    } satisfies ActionStatement,
  ]);
});

test('should parse a sentence with an action with a target and without args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click button then it should be done',
  )[0] as GivenWhenThenStatements;
  expect(sentence.when).toEqual([
    {
      kind: 'action',
      tokens: [
        {
          kind: 'generic',
          column: 8,
          line: 1,
          value: 'click',
          index: 7,
        },
        {
          kind: 'generic',
          column: 14,
          line: 1,
          value: 'button',
          index: 13,
        },
      ],
      index: 7,
    } satisfies ActionStatement,
  ]);
});

test('should parse a sentence with an action with a target and with args', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I type "foo" in input then it should be done',
  )[0] as GivenWhenThenStatements;

  expect(sentence.when).toEqual([
    {
      kind: 'action',
      tokens: [
        {
          kind: 'generic',
          column: 8,
          line: 1,
          value: 'type',
          index: 7,
        },
        {
          kind: 'generic',
          column: 13,
          line: 1,
          value: '"foo"',
          index: 12,
        },
        {
          kind: 'generic',
          column: 19,
          line: 1,
          value: 'in',
          index: 18,
        },
        {
          kind: 'generic',
          column: 22,
          line: 1,
          value: 'input',
          index: 21,
        },
      ],
      index: 7,
    } satisfies ActionStatement,
  ]);
});

test('should parse a sentence with two actions', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click button and I type "foo" into input then it should be done',
  )[0] as GivenWhenThenStatements;

  const firstAction = sentence.when[0] as ActionStatement;
  expect(firstAction.tokens[0].value).toEqual('click');
  expect(firstAction.tokens[1].value).toEqual('button');

  const secondAction = sentence.when[1] as ActionStatement;
  expect(secondAction.tokens[0].value).toEqual('type');
  expect(secondAction.tokens[1].value).toEqual('"foo"');
  expect(secondAction.tokens[2].value).toEqual('into');
  expect(secondAction.tokens[3].value).toEqual('input');
});

test('should parse an action with quoted text argument', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click on button with text "submit" then it should be done',
  )[0] as GivenWhenThenStatements;

  const firstAction = sentence.when[0] as ActionStatement;
  expect(firstAction.tokens[0].value).toEqual('click');
  expect(firstAction.tokens[1].value).toEqual('on');
  expect(firstAction.tokens[2].value).toEqual('button');
  expect(firstAction.tokens[3].value).toEqual('with');
  expect(firstAction.tokens[4].value).toEqual('text');
  expect(firstAction.tokens[5].value).toEqual('"submit"');
});

test('should throw if parsing a sentence with invalid action', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I and foo then it should be done')).toThrow(
    `Missing action
Line 1, column 8:
when I and foo then it should be done
       ^`,
  );
});

test('should throw if parsing a sentence with "I" in action name', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I am I foo then it should be done')).toThrow(
    `Unexpected "I" in action name
Line 1, column 11:
when I am I foo then it should be done
          ^`,
  );
});

test('should throw if parsing a sentence with missing action', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I then it should be done')).toThrow(
    `Missing action
Line 1, column 8:
when I then it should be done
       ^`,
  );
});

test('should parse a sentence with an assertion', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then dialog should be hidden',
  )[0] as GivenWhenThenStatements;

  const assertion = sentence.then[0] as AssertionStatement;
  expect(assertion.target.map((a) => a.value)).toEqual(['dialog']);
  expect(assertion.assertion.map((a) => a.value)).toEqual(['be', 'hidden']);
});

test('should parse a sentence with an assertion with quoted text argument', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then message should have text "Hello, World!"',
  )[0] as GivenWhenThenStatements;

  const assertion = sentence.then[0] as AssertionStatement;
  expect(assertion.target.map((a) => a.value)).toEqual(['message']);
  expect(assertion.assertion.map((a) => a.value)).toEqual([
    'have',
    'text',
    '"Hello, World!"',
  ]);
});

test('should parse a sentence with two assertions', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'when I click then dialog should be hidden and button should be visible',
  )[0] as GivenWhenThenStatements;

  const firstAssertion = sentence.then[0] as AssertionStatement;
  expect(firstAssertion.target.map((a) => a.value)).toEqual(['dialog']);
  expect(firstAssertion.assertion.map((a) => a.value)).toEqual([
    'be',
    'hidden',
  ]);

  const secondAssertion = sentence.then[1] as AssertionStatement;
  expect(secondAssertion.target.map((a) => a.value)).toEqual(['button']);
  expect(secondAssertion.assertion.map((a) => a.value)).toEqual([
    'be',
    'visible',
  ]);
});

test('should throw if parsing a sentence with invalid assertion', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then dialog and hidden'))
    .toThrow(`Expected assertion
Line 1, column 36:
when I click then dialog and hidden
                                   ^`);
});

test('should throw if parsing a sentence with missing assertion before and', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then dialog should and')).toThrow(
    `Missing assertion
Line 1, column 33:
when I click then dialog should and
                                ^`,
  );
});

test('should throw if parsing a sentence with missing assertion', () => {
  const parser = new Parser();
  expect(() => parser.parse('when I click then')).toThrow(
    `Missing statement
Line 1, column 18:
when I click then
                 ^`,
  );
});

test('should parse a sentence with a system-level instruction', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'given system is "ready" when I click then it should be done',
  )[0] as GivenWhenThenStatements;
  expect(
    (sentence.given[0] as SystemLevelStatement).tokens.map((a) => a.value),
  ).toEqual(['system', 'is']);
  expect(
    (sentence.given[0] as SystemLevelStatement).args.map((a) => a.value),
  ).toEqual(['"ready"']);
});

test('should parse a sentence with a user action in a given', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'given I land on Mars when I leave then it should be done',
  )[0] as GivenWhenThenStatements;
  expect(
    (sentence.given[0] as ActionStatement).tokens.map((a) => a.value),
  ).toEqual(['land', 'on', 'Mars']);
});

test('should parse a sentence with a user action and a system state change in a given', () => {
  const parser = new Parser();
  const sentence = parser.parse(
    'given I login and system is "ready" when I leave then it should be done',
  )[0] as GivenWhenThenStatements;
  expect(
    (sentence.given[0] as ActionStatement).tokens.map((a) => a.value),
  ).toEqual(['login']);
  expect(
    (sentence.given[1] as SystemLevelStatement).tokens.map((a) => a.value),
  ).toEqual(['system', 'is']);
  expect(
    (sentence.given[1] as SystemLevelStatement).args.map((a) => a.value),
  ).toEqual(['"ready"']);
});

test('should parse a sentence with an action block', () => {
  const parser = new Parser();
  const sections = parser.parse(`
    when I long press on button
    then it should be red

    In order to long press on it:
    - I press mouse button on it
    - I wait 1 second
    - I release mouse button on it
  `);

  const givenWhenThen = sections[0] as GivenWhenThenStatements;
  expect(givenWhenThen.then.length).toEqual(1);

  const block = sections[1] as Block;
  expect(block.kind).toEqual('action-block');
  expect(block.header.map((a) => a.value)).toEqual([
    'long',
    'press',
    'on',
    'it',
  ]);
  expect(block.body.length).toEqual(3);
});

test('should parse a sentence with an assertion block', () => {
  const parser = new Parser();
  const sections = parser.parse(`
    when I click on button
    then it should be red

    For element to be red:
    - it should have class "red"
  `);

  const givenWhenThen = sections[0] as GivenWhenThenStatements;
  expect(givenWhenThen.then.length).toEqual(1);

  const block = sections[1] as Block;
  expect(block.kind).toEqual('assertion-block');
  expect(block.header.map((a) => a.value)).toEqual(['be', 'red']);
  expect(block.body.length).toEqual(1);
});

test.skip('should throw if parsing a sentence with an invalid block header', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    when I click on button
    then it should be red

    foo bar:
    - it should have class "red"
  `),
  ).toThrow(
    `Unexpected block header. Block header must start with "In order to" or follow "For ... to ..." structure.`,
  );
});

test('should reject assertion block header without "to"', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    when I click on button
    then it should be red

    for foo:
    - it should have class "red"
  `),
  ).toThrow(
    `Unexpected block header. Block header must start with "In order to" or follow "For ... to ..." structure.`,
  );
});

test('should throw if parsing a sentence with missing statement', () => {
  const parser = new Parser();
  ['given', 'when', 'when I click on button then'].forEach((sentence) => {
    expect(() => parser.parse(sentence)).toThrow(`Missing statement`);
  });
});

test.skip('should throw if parsing a sentence with missing block name', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    when I click on button then it should be red

    :
    - it should have class "red"
  `),
  ).toThrow(`Missing block name`);
});

test('should throw if parsing a sentence with bullet in block name', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    when I click on button then it should be red

    for $element to be red
    - it should have class "red"
  `),
  ).toThrow(`Unexpected bullet in block header`);
});

test('should correctly parse a multiline given-when-then statement', () => {
  const parser = new Parser();
  const parsed = parser.parse(`
    given I login
    when I click on button
    then it should be red
  `);

  expect(parsed).toHaveLength(1);
});

test('should correctly parse 2 multiline given-when-then statements', () => {
  const parser = new Parser();
  const parsed = parser.parse(`
    given I login
    when I click on button
    then it should be red
    given I login
    when I click on button
    then it should be red
  `);

  expect(parsed).toHaveLength(2);
});

test('should correctly parse a given-when-then statement and a when-then statement', () => {
  const parser = new Parser();
  const parsed = parser.parse(`
    given I login
    when I click on button
    then it should be red
    when I click on button
    then it should be red
  `);

  expect(parsed).toHaveLength(2);
});

test('should correctly parse a multi line and single line (given-)when-then statement', () => {
  const parser = new Parser();
  const parsed = parser.parse(`
    given I login
    when I click on button
    then it should be red
    given I login when I click on button then it should be red
    when I click on button then it should be red
    when I click on button
    then it should be red
  `);

  expect(parsed).toHaveLength(4);
});

test('should reject given-then statement', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    given I login
    then it should be red
  `),
  ).toThrow(`Unexpected delimiter. Expected WHEN`);
});

test('should reject block missing assertion name', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    For $element to:
    - it should have class "red"
  `),
  ).toThrow(
    `Missing assertion name. Block header must follow "For ... to ..." structure.`,
  );
});

test('should reject block missing action name', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    In order to:
    - I click button
  `),
  ).toThrow(
    `Missing action name. Block header must follow "In order to ..." structure.`,
  );
});

test('should reject statement with only given', () => {
  const parser = new Parser();
  expect(() =>
    parser.parse(`
    given I login
    `),
  ).toThrow(`Expected "when"`);
});
