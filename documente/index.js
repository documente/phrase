const { readFileSync } = require('fs');
const { parse } = require('yaml');
const { resolve, relative } = require('path');
const glob = require('glob').globSync;

const workingDir = '../example-sut';
const config = require(resolve(workingDir, 'documenté.config'));
const { selectors, externals, input } = config;

const selectorsFile = readFileSync(resolve(workingDir, selectors), 'utf8');
const selectorsData = parse(selectorsFile);
console.log(selectorsData);

const externalsFns = require(resolve(workingDir, externals));
console.log(externalsFns);

const files = glob(input, {
  cwd: resolve(process.cwd(), workingDir),
});
console.log(files);

files.forEach(file => {
  const fileContent = readFileSync(resolve(workingDir, file), 'utf8');
  const blocks = fileContent.match(/```phrasé[^`]*```/g);
  blocks.forEach(block => {
    const blockContent = block.replace(/```phrasé([^`]*)```/, '$1');
    console.log(blockContent);
  })
});
