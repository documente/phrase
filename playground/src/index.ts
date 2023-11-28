import {EditorView, basicSetup} from "codemirror"
import {buildInstructions} from "../../lib/src/instructions-builder/instruction-builder";
import {validateContext} from "../../lib/src/context-validation";
import * as yamlMode from '@codemirror/legacy-modes/mode/yaml';
import { StreamLanguage } from "@codemirror/language"
import * as YAML from 'yaml';

const localStorageContextKey = 'playground-context';
const savedContext = localStorage.getItem(localStorageContextKey);

const localStorageTestKey = 'playground-test';
const savedTest = localStorage.getItem(localStorageTestKey);

const treeEditor = new EditorView({
  doc: savedContext ?? `welcomePage:
  _selector: .welcome
  greetButton: button
  welcomeMessage:
    _selector: .message
`,
  extensions: [basicSetup, StreamLanguage.define(yamlMode.yaml)],
  parent: document.body.querySelector("#tree-editor")!,
});

const testEditor = new EditorView({
  doc: savedTest ?? `When I click on welcome page greet button
then welcome message should be visible
and it should have text "Hello, World!"`,
  extensions: [basicSetup],
  parent: document.body.querySelector("#test-editor")!,
});

document.addEventListener('DOMContentLoaded', () => {
  // We treat this element as a span because there isn't dedicated HTML*Element type for it
  const outputElement = document.querySelector('#output') as HTMLSpanElement;

  document.body.querySelector('#run-button')?.addEventListener('click', () => {
    const tree = treeEditor.state.doc.toString();
    const test = testEditor.state.doc.toString();

    localStorage.setItem(localStorageContextKey, tree);
    localStorage.setItem(localStorageTestKey, test);

    try {
      const treeObject = YAML.parse(tree);
      validateContext(treeObject);
      const instructions = buildInstructions(test, treeObject, {});
      outputElement.innerText = JSON.stringify(instructions, null, 2);
      outputElement.classList.remove('error');
    } catch(error) {
      console.error(error);
      outputElement.innerText = (error as any).message ?? error;
      outputElement.classList.add('error');
      return;
    }
  });
});

