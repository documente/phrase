import { Splitter } from './splitter';
import { expect } from '@jest/globals';

test('should split blocks and tests', () => {
  const splitter = new Splitter();

  splitter.add(`
when I click button then message is visible
done

in order to foo:
- I click on button
done
`);

  const result = splitter.split();
  expect(result.blocks).toHaveLength(1);
  expect(result.blocks[0]).toEqual(`in order to foo:
- I click on button
done`);
  expect(result.tests).toHaveLength(1);
  expect(result.tests[0]).toEqual(`when I click button then message is visible
done`);
});

test('should split blocks and tests with Windows-style end of lines', () => {
  const splitter = new Splitter();

  splitter.add('when I click button then message is visible\r\ndone\r\nin order to foo:\r\n- I click on button\r\ndone\r\n');

  const result = splitter.split();
  expect(result.blocks).toHaveLength(1);
  expect(result.blocks[0]).toEqual('in order to foo:\n- I click on button\ndone');
  expect(result.tests).toHaveLength(1);
  expect(result.tests[0]).toEqual('when I click button then message is visible\ndone');
});
