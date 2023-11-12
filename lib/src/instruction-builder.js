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
    const resolved = extractTargetSelector(
      tree,
      action.target,
      previousPath,
      input,
    );
    const target = resolved?.selectors ?? null;
    if (resolved?.path) {
      previousPath = resolved.path;
    }
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
    const resolved = extractTargetSelector(
      tree,
      assertion.target,
      previousPath,
      input,
    );
    const target = resolved?.selectors ?? null;
    if (resolved?.path) {
      previousPath = resolved.path;
    }

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

function extractTargetSelector(tree, target, previousPath, input) {
  if (target.length === 0) {
    return null;
  }

  if (target.length === 1 && target[0].value === 'it') {
    return previousPath;
  }

  const targetPath = resolve(
    tree,
    target.map((t) => t.value),
    previousPath,
  );

  if (!targetPath) {
    throw new Error(
      prettyPrintError(
        `Could not resolve target path for "${target
          .map((t) => t.value)
          .join(' ')}"`,
        input,
        target[0],
      ),
    );
  }

  const selectors = [];
  let currentNode = tree;

  targetPath.forEach((pathSegment) => {
    currentNode = currentNode[pathSegment];
    if (!currentNode) {
      throw new Error(
        prettyPrintError(
          `Could not resolve target path for "${target
            .map((t) => t.value)
            .join(' ')}"`,
          input,
          target[0],
        ),
      );
    }
    selectors.push(currentNode._selector ?? currentNode);
  });

  return {
    selectors,
    path: targetPath,
  };
}
