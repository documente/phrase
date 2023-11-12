import { Parser } from './parser.js';
import { resolve } from './resolver.js';
import { prettyPrintError } from './error.js';
import { isBuiltinAction } from './builtin-actions.js';

export function buildInstructions(input, tree) {
  const parser = new Parser();
  const sentenceTree = parser.parse(input);

  const actions = [];
  let previousPath = [];

  sentenceTree.actions.forEach((action) => {
    const target = extractTargetSelector(tree, action, previousPath, input);
    const actionName = extractAction(action, input);
    const args = action.args.map((arg) => arg.value);

    actions.push({
      target,
      action: actionName,
      args,
    });
  });

  const assertions = [];

  sentenceTree.assertions.forEach((assertion) => {
    const target = extractTargetSelector(tree, assertion, previousPath, input);
    const assertionName = assertion.assertion.map((a) => a.value).join(' ');

    assertions.push({
      target,
      assertion: assertionName,
    });
  });

  return {
    actions,
    assertions,
  };
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

function extractTargetSelector(tree, action, previousPath, input) {
  if (action.target.length === 0) {
    return null;
  }

  if (action.target.length === 1 && action.target[0].value === 'it') {
    return previousPath;
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

  const selectors = [];
  let currentNode = tree;

  targetPath.forEach((pathSegment) => {
    currentNode = currentNode[pathSegment];
    selectors.push(currentNode._selector ?? currentNode);
  });

  return selectors;
}
