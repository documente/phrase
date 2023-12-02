const fs = require('fs');
const { parse } = require('yaml');
const { basename, resolve, relative } = require('path');
const glob = require('glob').globSync;
const Mustache = require('mustache');

const workingDir = '../example-sut';
const config = require(resolve(workingDir, 'documenté.config'));
const { selectors, externals, input, outputDir } = config;

const selectorsFile = fs.readFileSync(resolve(workingDir, selectors), 'utf8');
const selectorsData = parse(selectorsFile);
console.log(selectorsData);

const externalsFns = require(resolve(workingDir, externals));
console.log(externalsFns);

const files = glob(input, {
  cwd: resolve(process.cwd(), workingDir),
});
console.log(files);

const cySpecTemplate = fs.readFileSync(resolve(__dirname, 'cy-spec.mustache'), 'utf8');

files.forEach(file => {
  const sourceFileName = basename(file);
  const fileContent = fs.readFileSync(resolve(workingDir, file), 'utf8');
  const blocks = fileContent.match(/```phrasé[^`]*```/g);
  blocks.forEach((block, index) => {
    const blockContent = block.replace(/```phrasé([^`]*)```/, '$1');
    console.log(blockContent);
    const view = {
      pathToExternals: relative(resolve(outputDir), resolve(externals)).replace(/\\/g, '/'),
      selectorTree: selectorsFile,
      sourceFileName: sourceFileName,
      specNumber: index + 1,
      spec: blockContent,
    };
    const rendered = Mustache.render(cySpecTemplate, view);
    const outputFileName = `${sourceFileName.replace(/\.md$/, '')}.generated.cy.js`;
    const pathToOutputFile = resolve(process.cwd(), workingDir, outputDir, outputFileName);
    fs.writeFileSync(pathToOutputFile, rendered, 'utf8');
  })
});
