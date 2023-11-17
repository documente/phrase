import {EditorView, basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
import {buildInstructions} from "../../lib/src/instruction-builder";

const treeEditor = new EditorView({
  doc: `{
  systemActions: {
    databaseIsSeededWithDefaultData() {/* ... */},
  },
  pageObjectTree: {
    welcomePage: {
      _selector: '.welcome',
      greetButton: 'button',
      welcomeMessage: {
        _selector: '.message',
        shouldHaveFragmentHighlighted(self, fragment) {/* ... */},
      }
    }
  }
}
`,
  extensions: [basicSetup, javascript()],
  parent: document.body.querySelector("#tree-editor")!,
});

const testEditor = new EditorView({
  doc: `given database is seeded with default data
when I click on welcome page greet button
then welcome message should be visible
and it should have text "Hello, World!"
and it should have fragment "World!" highlighted`,
  extensions: [basicSetup],
  parent: document.body.querySelector("#test-editor")!,
});

document.addEventListener('DOMContentLoaded', () => {
  // We treat this element as a span because there isn't dedicated HTML*Element type for it
  const outputElement = document.querySelector('#output') as HTMLSpanElement;

  document.body.querySelector('#run-button')?.addEventListener('click', () => {
    const tree = treeEditor.state.doc.toString();
    const test = testEditor.state.doc.toString();

    try {
      const treeValue = new Function(`return ${tree}`)();
      const instructions = buildInstructions(test, treeValue);
      outputElement.innerText = JSON.stringify(instructions, null, 2);
      outputElement.classList.remove('error');
    } catch(error) {
      outputElement.innerText = (error as any).message ?? error;
      outputElement.classList.add('error');
      return;
    }
  });
});

