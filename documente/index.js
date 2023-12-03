const fs = require('fs');
const { parse } = require('yaml');
const { basename, resolve, relative } = require('path');
const glob = require('glob').globSync;
const Mustache = require('mustache');
const { Splitter } = require('./../lib/dist/splitter');

function importConfigFile() {
  try {
    return require(resolve(workingDir, 'documenté.config'));
  } catch (e) {
    throw new Error(`Error importing config file: ${e.message}`);
  }
}

function extractFromConfig(config) {
  const { selectors, externals, input, outputDir } = config;

  let inputArray;

  if (typeof input === 'string') {
    inputArray = [input];
  } else if (Array.isArray(input)) {
    inputArray = input;
  } else {
    throw new Error('input must be a string or an array of strings');
  }

  if (typeof selectors !== 'string') {
    throw new Error('selectors must be a string path to a yaml file');
  }

  if (typeof externals !== 'string') {
    throw new Error('externals must be a string path to a js file');
  }

  if (typeof outputDir !== 'string') {
    throw new Error('outputDir must be a string path to a directory');
  }

  return { selectors, externals, outputDir, inputArray };
}

function readSelectorsFile(pathToSelectorsFile) {
  try {
    const resolvedPath = resolve(workingDir, pathToSelectorsFile);
    fs.accessSync(resolvedPath, fs.constants.R_OK);
    return fs.readFileSync(resolvedPath, 'utf8');
  } catch (e) {
    throw new Error(`Error reading selectors file: ${e.message}`);
  }
}

function readAndParseSelectorsFile(pathToSelectorsFile) {
  const selectorsFileContent = readSelectorsFile(pathToSelectorsFile);

  try {
    parse(selectorsFileContent);
  } catch (e) {
    throw new Error(`Error parsing selectors file: ${e.message}`);
  }

  return selectorsFileContent;
}

function importExternals(pathToExternals) {
  try {
    return require(resolve(workingDir, pathToExternals));
  } catch (e) {
    throw new Error(`Error importing externals file: ${e.message}`);
  }
}

function checkExternalsImport(pathToExternals) {
  const importedExternals = importExternals(pathToExternals);

  if (typeof importedExternals !== 'object') {
    throw new Error('Externals file must export an object');
  }
}

function getInputFiles(inputGlobArray) {
  return glob(inputGlobArray, {
    cwd: resolve(process.cwd(), workingDir),
  });
}

function validateInputFiles(inputGlobArray) {
  const files = getInputFiles(inputGlobArray);

  if (files.length === 0) {
    throw new Error('No input files found');
  }

  return files;
}

const workingDir = '../example-sut';
const config = importConfigFile();
const { selectors, externals, outputDir, inputArray } =
  extractFromConfig(config);
checkExternalsImport(externals);
const outputPathToExternals = relative(
  resolve(outputDir),
  resolve(externals),
).replace(/\\/g, '/');
const selectorsFile = readAndParseSelectorsFile(selectors);
const files = validateInputFiles(inputArray);
const cySpecTemplate = fs.readFileSync(
  resolve(__dirname, 'cy-spec.mustache'),
  'utf8',
);

function processDocumentationFile(file) {
  const splitter = new Splitter();
  const sourceFileName = basename(file);
  const fileContent = fs.readFileSync(resolve(workingDir, file), 'utf8');
  const regex = /```phras[ée][^`]*```/gm;
  fileContent
    .match(regex)
    .map((block) => block.replace(/```phras[ée]([^`]*)```/, '$1').trim())
    .forEach((block) => splitter.add(block));

  const splitResult = splitter.split();

  const blocks = splitResult.blocks.map((block) => ({ block }));

  const specs = splitResult.tests.map((spec, index) => ({
    spec,
    specNumber: index + 1,
  }));

  if (specs.length === 0) {
    throw new Error(`No test found in ${file}`);
  }

  const view = {
    pathToExternals: outputPathToExternals,
    selectorTree: selectorsFile,
    sourceFileName: sourceFileName,
    specs,
    blocks,
  };
  const rendered = Mustache.render(cySpecTemplate, view);
  const outputFileName = `${sourceFileName.replace(
    /\.md$/,
    '',
  )}.generated.cy.js`;
  const pathToOutputFile = resolve(
    process.cwd(),
    workingDir,
    outputDir,
    outputFileName,
  );
  fs.writeFileSync(pathToOutputFile, rendered, 'utf8');
  console.log(
    `Generated ${specs.length} Cypress tests in ${pathToOutputFile}.`,
  );
}

files.forEach((file) => processDocumentationFile(file));

console.log(
  `Generated ${files.length} Cypress spec files in ${resolve(
    process.cwd(),
    workingDir,
    outputDir,
  )}.`,
);
