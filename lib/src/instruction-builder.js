import { Parser } from './parser.js';
import { resolve } from './resolver.js';
import { prettyPrintError } from './error.js';
import { isBuiltinAction } from './builtin-actions.js';

export function buildInstructions(input, tree) {
  const parser = new Parser();
  const sentenceTree = parser.parse(input);

  const instructions = [];
  let previousPath = [];

  sentenceTree.actions.forEach((action) => {
    const target = extractTarget(tree, action, previousPath, input);
    const actionName = extractAction(action, input);
    const args = action.args.map((arg) => arg.value);

    instructions.push({
      target,
      action: actionName,
      args,
    });
  });

  return instructions;
}

function extractAction(action, input) {
  const actionName = action.action.map((a) => a.value).join(' ');

  if (!isBuiltinAction(actionName)) {
    throw new Error(
      prettyPrintError(
        `Unknown action "${actionName}"`,
        input,
        action.action[0],
      ),
    );
  }
  return actionName;
}

function extractTarget(tree, action, previousPath, input) {
  if (action.target.length === 0) {
    throw new Error(
      prettyPrintError('Missing target', input, action.action[0]),
    );
  }
  const targetPath = resolve(
    tree,
    action.target.map((t) => t.value),
    previousPath,
  );

  if (!targetPath) {
    throw new Error(
      prettyPrintError(
        `Could not resolve target path for "${action.target
          .map((t) => t.value)
          .join(' ')}"`,
        input,
        action.target[0],
      ),
    );
  }

  return targetPath;
}
