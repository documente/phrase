import {EditorView, basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
import {buildInstructions} from "../../lib/src/instructions-builder/instruction-builder";
import {validateContext} from "../../lib/src/context-validation";

const localStorageContextKey = 'playground-context';
const savedContext = localStorage.getItem(localStorageContextKey);

const localStorageTestKey = 'playground-test';
const savedTest = localStorage.getItem(localStorageTestKey);

const contextEditor = new EditorView({
  doc: savedContext ?? `{
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
  parent: document.body.querySelector("#context-editor")!,
});

const testEditor = new EditorView({
  doc: savedTest ?? `given database is seeded with default data
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
    const context = contextEditor.state.doc.toString();
    const test = testEditor.state.doc.toString();

    localStorage.setItem(localStorageContextKey, context);
    localStorage.setItem(localStorageTestKey, test);

    try {
      const contextValue = new Function(`return ${context}`)();
      validateContext(contextValue);
      const instructions = buildInstructions(test, contextValue);
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

