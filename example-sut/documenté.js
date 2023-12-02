const config = require('./documenté.config');
const { readFileSync } = require('fs');
const { parse } = require('yaml');
const { resolve } = require('path');

const { selectors, externals, input } = config;

const selectorsFile = readFileSync(resolve(selectors), 'utf8');
const selectorsData = parse(selectorsFile);
console.log(selectorsData);

const externalsFns = require(resolve(externals));
console.log(externalsFns);

const glob = require('glob').globSync;
const files = glob(input);
files.forEach(file => {
  const fileContent = readFileSync(resolve(file), 'utf8');
  const blocks = fileContent.match(/```phrasé[^`]*```/g);
  blocks.forEach(block => {
    const blockContent = block.replace(/```phrasé([^`]*)```/, '$1');
    console.log(blockContent);
  })
});
