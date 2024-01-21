import { Splitter } from './splitter';
import { test, expect } from '@jest/globals';

test('should split blocks and tests', () => {
  const splitter = new Splitter();

  splitter.add(`
when I click button then message should be visible

in order to foo:
- I click on button
`);

  const result = splitter.split();
  expect(result.blocks).toHaveLength(1);
  expect(result.blocks[0]).toEqual(`in order to foo:
- I click on button`);
  expect(result.tests).toHaveLength(1);
  expect(result.tests[0]).toEqual(
    `when I click button then message should be visible`,
  );
});

test('should split blocks and tests with Windows-style end of lines', () => {
  const splitter = new Splitter();

  splitter.add(
    'when I click button then message should be visible\r\nin order to foo:\r\n- I click on button\r\n',
  );

  const result = splitter.split();
  expect(result.blocks).toHaveLength(1);
  expect(result.blocks[0]).toEqual('in order to foo:\n- I click on button');
  expect(result.tests).toHaveLength(1);
  expect(result.tests[0]).toEqual(
    'when I click button then message should be visible',
  );
});
