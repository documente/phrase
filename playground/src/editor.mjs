import {EditorView, basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"

new EditorView({
  doc: `export const tree = {
  foo: {
    _selector: '.foo',
    bar: '.bar'
  }
};
`,
  extensions: [basicSetup, javascript()],
  parent: document.body.querySelector("#tree-editor"),
});

new EditorView({
  doc: `when I click on foo then bar should be visible`,
  extensions: [basicSetup, javascript()],
  parent: document.body.querySelector("#test-editor"),
});
