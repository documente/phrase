import {EditorView, basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
// @ts-ignore
import {buildInstructions} from "../../lib/src/instruction-builder";

const treeEditor = new EditorView({
  doc: `{
  welcomePage: {
    _selector: '.welcome',
    greetButton: 'button',
    welcomeMessage: {
      _selector: '.message',
      shouldHaveFragmentHighlighted(self, fragment) {/* ... */},
    }
  }
}
`,
  extensions: [basicSetup, javascript()],
  parent: document.body.querySelector("#tree-editor")!,
});

const testEditor = new EditorView({
  doc: `when I click on welcome page greet button
then welcome message should be visible
and it should have text "Hello, World!"
and it should have fragment "World!" highlighted`,
  extensions: [basicSetup, javascript()],
  parent: document.body.querySelector("#test-editor")!,
});

document.addEventListener('DOMContentLoaded', () => {

  (window as any)['__buildInstructions'] = buildInstructions;

  document.body.querySelector('#run-button')?.addEventListener('click', () => {
    const tree = treeEditor.state.doc.toString();
    const test = testEditor.state.doc.toString();
    const fullDoc = `try {
      const instructions = __buildInstructions(\`${test}\`, ${tree});
      const outputElement = document.querySelector('#output');
      outputElement.innerText = JSON.stringify(instructions, null, 2);
      outputElement.classList.remove('error');      
    } catch(e) {
      const outputElement = document.querySelector('#output');
      outputElement.innerText = e.message;
      outputElement.classList.add('error');
    }`;

    new Function(fullDoc)();
  });
});

